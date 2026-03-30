/**
 * React hook for settings management
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import type {
  Settings,
  SettingsUpdate,
  UpdateSettingsMessage,
} from '@/shared/types';
import { createMessage } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/constants';

interface UseSettingsResult {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (update: SettingsUpdate) => Promise<void>;
  toggleEnabled: () => Promise<void>;
  togglePlatform: (platform: keyof Settings['platforms']) => Promise<void>;
  refreshSettings: () => Promise<void>;
  importSettings: (data: Partial<Settings>) => Promise<void>;
}

/**
 * Hook for managing extension settings
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch settings from background script
   */
  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await browser.runtime.sendMessage(
        createMessage({ type: 'GET_SETTINGS' })
      );

      if (
        response !== null &&
        response !== undefined &&
        typeof response === 'object' &&
        'success' in response
      ) {
        const typedResponse = response as {
          success: boolean;
          data?: Settings;
          error?: string;
        };
        if (
          typedResponse.success === true &&
          typedResponse.data !== undefined
        ) {
          setSettings(typedResponse.data);
        } else {
          setError(typedResponse.error ?? 'Failed to load settings');
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update settings
   */
  const updateSettings = useCallback(
    async (update: SettingsUpdate): Promise<void> => {
      try {
        setError(null);
        console.debug('[useSettings] Sending UPDATE_SETTINGS:', update);

        const response = await browser.runtime.sendMessage(
          createMessage<UpdateSettingsMessage>({
            type: 'UPDATE_SETTINGS',
            payload: update,
          })
        );

        console.debug('[useSettings] Received response:', response);

        if (
          response !== null &&
          response !== undefined &&
          typeof response === 'object' &&
          'success' in response
        ) {
          const typedResponse = response as {
            success: boolean;
            data?: Settings;
            error?: string;
          };
          if (
            typedResponse.success === true &&
            typedResponse.data !== undefined
          ) {
            console.debug(
              '[useSettings] Settings updated successfully, onboardingCompleted:',
              typedResponse.data.onboardingCompleted
            );
            setSettings(typedResponse.data);
          } else {
            console.error('[useSettings] Update failed:', typedResponse.error);
            setError(typedResponse.error ?? 'Failed to update settings');
          }
        } else {
          console.error('[useSettings] Invalid response format:', response);
        }
      } catch (err) {
        console.error('[useSettings] Error:', err);
        setError(String(err));
      }
    },
    []
  );

  /**
   * Toggle enabled state
   */
  const toggleEnabled = useCallback(async (): Promise<void> => {
    await updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  /**
   * Toggle a specific platform
   */
  const togglePlatform = useCallback(
    async (platform: keyof Settings['platforms']): Promise<void> => {
      await updateSettings({
        platforms: {
          [platform]: !settings.platforms[platform],
        },
      });
    },
    [settings.platforms, updateSettings]
  );

  /**
   * Refresh settings
   */
  const refreshSettings = useCallback(async (): Promise<void> => {
    await fetchSettings();
  }, [fetchSettings]);

  /**
   * Import settings from backup
   */
  const importSettings = useCallback(
    async (data: Partial<Settings>): Promise<void> => {
      try {
        setError(null);

        // Merge with current settings, preserving stats
        const mergedSettings: SettingsUpdate = {
          enabled: data.enabled ?? settings.enabled,
          platforms: data.platforms ?? settings.platforms,
          preferences: data.preferences ?? settings.preferences,
        };

        const response = await browser.runtime.sendMessage(
          createMessage<UpdateSettingsMessage>({
            type: 'UPDATE_SETTINGS',
            payload: mergedSettings,
          })
        );

        if (
          response !== null &&
          response !== undefined &&
          typeof response === 'object' &&
          'success' in response
        ) {
          const typedResponse = response as {
            success: boolean;
            data?: Settings;
            error?: string;
          };
          if (
            typedResponse.success === true &&
            typedResponse.data !== undefined
          ) {
            setSettings(typedResponse.data);
          } else {
            throw new Error(typedResponse.error ?? 'Failed to import settings');
          }
        }
      } catch (err) {
        setError(String(err));
        throw err;
      }
    },
    [settings]
  );

  // Initial load
  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: browser.Storage.StorageAreaOnChangedChangesType,
      areaName: string
    ) => {
      if (areaName === 'local' && changes.shortshield_settings) {
        const newSettings = changes.shortshield_settings.newValue as
          | Settings
          | undefined;
        if (newSettings) {
          setSettings(newSettings);
        }
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    toggleEnabled,
    togglePlatform,
    refreshSettings,
    importSettings,
  };
}

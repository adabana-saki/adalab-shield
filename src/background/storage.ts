/**
 * Background script storage management
 * Handles all storage operations with validation and error handling
 */

import browser from 'webextension-polyfill';
import type { Settings, SettingsUpdate } from '@/shared/types';
import { isValidSettings } from '@/shared/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/shared/constants';
import { createLogger } from '@/shared/utils/logger';
import { getLocalDateString } from '@/shared/utils/date';

const logger = createLogger('background-storage');

/**
 * Get current settings from storage
 */
export async function getSettings(): Promise<Settings> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = result[STORAGE_KEYS.SETTINGS];

    if (settings === undefined || settings === null) {
      logger.info('No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    if (!isValidSettings(settings)) {
      logger.warn('Invalid settings in storage, using defaults');
      return DEFAULT_SETTINGS;
    }

    // At this point, settings is validated as Settings type
    const validSettings = settings;

    // Check if daily stats need reset
    const today = getLocalDateString();
    if (validSettings.stats.lastResetDate !== today) {
      const resetSettings: Settings = {
        ...validSettings,
        stats: {
          ...validSettings.stats,
          blockedToday: 0,
          lastResetDate: today,
        },
      };
      await saveSettings(resetSettings);
      return resetSettings;
    }

    return validSettings;
  } catch (error) {
    logger.error('Failed to get settings', { error });
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to storage
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    if (!isValidSettings(settings)) {
      throw new Error('Invalid settings structure');
    }

    await browser.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: settings,
    });

    logger.debug('Settings saved successfully');
  } catch (error) {
    logger.error('Failed to save settings', { error });
    throw error;
  }
}

/**
 * Update settings partially
 */
export async function updateSettings(
  update: SettingsUpdate
): Promise<Settings> {
  console.log('[storage] updateSettings called with:', update);
  console.log(
    '[storage] onboardingCompleted in update:',
    update.onboardingCompleted
  );
  const current = await getSettings();
  console.log(
    '[storage] current onboardingCompleted:',
    current.onboardingCompleted
  );

  const updated: Settings = {
    ...current,
    enabled: update.enabled ?? current.enabled,
    platforms: {
      ...current.platforms,
      ...(update.platforms ?? {}),
    },
    preferences: {
      ...current.preferences,
      ...(update.preferences ?? {}),
    },
    stats: {
      ...current.stats,
      ...(update.stats ?? {}),
    },
    customDomains: update.customDomains ?? current.customDomains,
    schedule: update.schedule
      ? { ...current.schedule, ...update.schedule }
      : current.schedule,
    blockPage: update.blockPage
      ? { ...current.blockPage, ...update.blockPage }
      : current.blockPage,
    focusMode: update.focusMode
      ? { ...current.focusMode, ...update.focusMode }
      : current.focusMode,
    pomodoro: update.pomodoro
      ? { ...current.pomodoro, ...update.pomodoro }
      : current.pomodoro,
    timeLimits: update.timeLimits
      ? { ...current.timeLimits, ...update.timeLimits }
      : current.timeLimits,
    timeTracking: update.timeTracking
      ? { ...current.timeTracking, ...update.timeTracking }
      : current.timeTracking,
    streak: update.streak
      ? { ...current.streak, ...update.streak }
      : current.streak,
    challenge: update.challenge
      ? { ...current.challenge, ...update.challenge }
      : current.challenge,
    lockdown: update.lockdown
      ? { ...current.lockdown, ...update.lockdown }
      : current.lockdown,
    onboardingCompleted:
      update.onboardingCompleted ?? current.onboardingCompleted,
    version: current.version,
  };

  console.log(
    '[storage] updated onboardingCompleted:',
    updated.onboardingCompleted
  );
  await saveSettings(updated);
  console.log('[storage] Settings saved');
  return updated;
}

/**
 * Increment block count
 */
export async function incrementBlockCount(platform: string): Promise<Settings> {
  const settings = await getSettings();

  const byPlatform = { ...settings.stats.byPlatform };
  byPlatform[platform as keyof typeof byPlatform] =
    (byPlatform[platform as keyof typeof byPlatform] ?? 0) + 1;

  const updated: Settings = {
    ...settings,
    stats: {
      ...settings.stats,
      blockedToday: settings.stats.blockedToday + 1,
      blockedTotal: settings.stats.blockedTotal + 1,
      byPlatform,
    },
  };

  await saveSettings(updated);
  return updated;
}

/**
 * Clear all data (for reset functionality)
 */
export async function clearAllData(): Promise<void> {
  try {
    await browser.storage.local.clear();
    await saveSettings(DEFAULT_SETTINGS);
    logger.info('All data cleared');
  } catch (error) {
    logger.error('Failed to clear all data', { error });
    throw error;
  }
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{
  bytesInUse: number;
  quota: number;
}> {
  try {
    // Save reference before type narrowing
    const localStorage = browser.storage.local;

    // Chrome provides getBytesInUse, Firefox doesn't
    type StorageWithBytesInUse = typeof localStorage & {
      getBytesInUse: (keys: string | string[] | null) => Promise<number>;
    };
    if ('getBytesInUse' in localStorage) {
      const bytesInUse = await (
        localStorage as StorageWithBytesInUse
      ).getBytesInUse(null);
      return {
        bytesInUse,
        quota: 10 * 1024 * 1024, // 10MB for local storage
      };
    }

    // Fallback: estimate from stringified data
    const data = await browser.storage.local.get(null);
    const bytesInUse = new Blob([JSON.stringify(data)]).size;
    return {
      bytesInUse,
      quota: 10 * 1024 * 1024,
    };
  } catch (error) {
    logger.error('Failed to get storage info', { error });
    return { bytesInUse: 0, quota: 10 * 1024 * 1024 };
  }
}

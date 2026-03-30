/**
 * Focus mode settings component for options page
 */

import { useCallback } from 'react';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type { FocusDuration } from '@/shared/types';

const DURATION_OPTIONS: { value: FocusDuration; label: string }[] = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 120, label: '2 hours' },
];

export function FocusModeSettings() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();

  const handleToggleEnabled = useCallback(() => {
    void updateSettings({
      focusMode: {
        enabled: !settings.focusMode.enabled,
      },
    });
  }, [settings.focusMode.enabled, updateSettings]);

  const handleToggleSoftLock = useCallback(() => {
    void updateSettings({
      focusMode: {
        softLock: !settings.focusMode.softLock,
      },
    });
  }, [settings.focusMode.softLock, updateSettings]);

  const handleToggleNotifications = useCallback(() => {
    void updateSettings({
      focusMode: {
        enableNotifications: !settings.focusMode.enableNotifications,
      },
    });
  }, [settings.focusMode.enableNotifications, updateSettings]);

  const handleDurationChange = useCallback(
    (duration: FocusDuration) => {
      void updateSettings({
        focusMode: {
          defaultDuration: duration,
        },
      });
    },
    [updateSettings]
  );

  return (
    <div className="focus-mode-settings">
      <h2 className="settings-section-title">{t('focusModeTitle')}</h2>
      <p className="settings-section-description">
        {t('focusModeDescription')}
      </p>

      {/* Enable/Disable Focus Mode */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="focus-enabled">
            {t('focusModeEnabled')}
          </label>
          <p className="settings-item-description">
            {t('focusModeEnabledDescription')}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="focus-enabled"
            checked={settings.focusMode.enabled}
            onChange={handleToggleEnabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Default Duration */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label">
            {t('focusModeDefaultDuration')}
          </label>
          <p className="settings-item-description">
            {t('focusModeDefaultDurationDescription')}
          </p>
        </div>
        <div className="settings-duration-options">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`duration-option ${settings.focusMode.defaultDuration === option.value ? 'selected' : ''}`}
              onClick={() => handleDurationChange(option.value)}
              disabled={!settings.focusMode.enabled}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Soft Lock */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="focus-soft-lock">
            {t('focusModeSoftLock')}
          </label>
          <p className="settings-item-description">
            {t('focusModeSoftLockDescription')}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="focus-soft-lock"
            checked={settings.focusMode.softLock}
            onChange={handleToggleSoftLock}
            disabled={!settings.focusMode.enabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Notifications */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="focus-notifications">
            {t('focusModeNotifications')}
          </label>
          <p className="settings-item-description">
            {t('focusModeNotificationsDescription')}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="focus-notifications"
            checked={settings.focusMode.enableNotifications}
            onChange={handleToggleNotifications}
            disabled={!settings.focusMode.enabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
}

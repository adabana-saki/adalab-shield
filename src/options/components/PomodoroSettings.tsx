/**
 * Pomodoro timer settings component for options page
 */

import { useCallback } from 'react';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';

const WORK_DURATION_OPTIONS = [15, 20, 25, 30, 45, 50, 60];
const BREAK_DURATION_OPTIONS = [3, 5, 10, 15];
const LONG_BREAK_DURATION_OPTIONS = [10, 15, 20, 25, 30];
const SESSIONS_OPTIONS = [2, 3, 4, 5, 6];

export function PomodoroSettings() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();

  const handleToggleEnabled = useCallback(() => {
    void updateSettings({
      pomodoro: {
        enabled: !settings.pomodoro.enabled,
      },
    });
  }, [settings.pomodoro.enabled, updateSettings]);

  const handleWorkDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      void updateSettings({
        pomodoro: {
          workDurationMinutes: parseInt(e.target.value, 10),
        },
      });
    },
    [updateSettings]
  );

  const handleBreakDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      void updateSettings({
        pomodoro: {
          breakDurationMinutes: parseInt(e.target.value, 10),
        },
      });
    },
    [updateSettings]
  );

  const handleLongBreakDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      void updateSettings({
        pomodoro: {
          longBreakDurationMinutes: parseInt(e.target.value, 10),
        },
      });
    },
    [updateSettings]
  );

  const handleSessionsChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      void updateSettings({
        pomodoro: {
          sessionsBeforeLongBreak: parseInt(e.target.value, 10),
        },
      });
    },
    [updateSettings]
  );

  const handleToggleAutoStartBreaks = useCallback(() => {
    void updateSettings({
      pomodoro: {
        autoStartBreaks: !settings.pomodoro.autoStartBreaks,
      },
    });
  }, [settings.pomodoro.autoStartBreaks, updateSettings]);

  const handleToggleAutoStartWork = useCallback(() => {
    void updateSettings({
      pomodoro: {
        autoStartWork: !settings.pomodoro.autoStartWork,
      },
    });
  }, [settings.pomodoro.autoStartWork, updateSettings]);

  const handleToggleSound = useCallback(() => {
    void updateSettings({
      pomodoro: {
        soundEnabled: !settings.pomodoro.soundEnabled,
      },
    });
  }, [settings.pomodoro.soundEnabled, updateSettings]);

  const isDisabled = !settings.pomodoro.enabled;

  return (
    <div className="pomodoro-settings">
      <h2 className="settings-section-title">{t('pomodoroTitle')}</h2>
      <p className="settings-section-description">{t('pomodoroDescription')}</p>

      {/* Enable/Disable Pomodoro */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="pomodoro-enabled">
            {t('pomodoroEnabled')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroEnabledDescription')}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="pomodoro-enabled"
            checked={settings.pomodoro.enabled}
            onChange={handleToggleEnabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Work Duration */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label
            className="settings-item-label"
            htmlFor="pomodoro-work-duration"
          >
            {t('pomodoroWorkDuration')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroWorkDurationDescription')}
          </p>
        </div>
        <select
          id="pomodoro-work-duration"
          className="settings-select"
          value={settings.pomodoro.workDurationMinutes}
          onChange={handleWorkDurationChange}
          disabled={isDisabled}
        >
          {WORK_DURATION_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} {t('minutes')}
            </option>
          ))}
        </select>
      </div>

      {/* Break Duration */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label
            className="settings-item-label"
            htmlFor="pomodoro-break-duration"
          >
            {t('pomodoroBreakDuration')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroBreakDurationDescription')}
          </p>
        </div>
        <select
          id="pomodoro-break-duration"
          className="settings-select"
          value={settings.pomodoro.breakDurationMinutes}
          onChange={handleBreakDurationChange}
          disabled={isDisabled}
        >
          {BREAK_DURATION_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} {t('minutes')}
            </option>
          ))}
        </select>
      </div>

      {/* Long Break Duration */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label
            className="settings-item-label"
            htmlFor="pomodoro-long-break-duration"
          >
            {t('pomodoroLongBreakDuration')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroLongBreakDurationDescription')}
          </p>
        </div>
        <select
          id="pomodoro-long-break-duration"
          className="settings-select"
          value={settings.pomodoro.longBreakDurationMinutes}
          onChange={handleLongBreakDurationChange}
          disabled={isDisabled}
        >
          {LONG_BREAK_DURATION_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} {t('minutes')}
            </option>
          ))}
        </select>
      </div>

      {/* Sessions before long break */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="pomodoro-sessions">
            {t('pomodoroSessionsBeforeLongBreak')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroSessionsBeforeLongBreakDescription')}
          </p>
        </div>
        <select
          id="pomodoro-sessions"
          className="settings-select"
          value={settings.pomodoro.sessionsBeforeLongBreak}
          onChange={handleSessionsChange}
          disabled={isDisabled}
        >
          {SESSIONS_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </div>

      {/* Auto-start breaks */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="pomodoro-auto-breaks">
            {t('pomodoroAutoStartBreaks')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroAutoStartBreaksDescription')}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="pomodoro-auto-breaks"
            checked={settings.pomodoro.autoStartBreaks}
            onChange={handleToggleAutoStartBreaks}
            disabled={isDisabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Auto-start work */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="pomodoro-auto-work">
            {t('pomodoroAutoStartWork')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroAutoStartWorkDescription')}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="pomodoro-auto-work"
            checked={settings.pomodoro.autoStartWork}
            onChange={handleToggleAutoStartWork}
            disabled={isDisabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Sound notifications */}
      <div className="settings-item">
        <div className="settings-item-info">
          <label className="settings-item-label" htmlFor="pomodoro-sound">
            {t('pomodoroSoundEnabled')}
          </label>
          <p className="settings-item-description">
            {t('pomodoroSoundEnabledDescription')}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="pomodoro-sound"
            checked={settings.pomodoro.soundEnabled}
            onChange={handleToggleSound}
            disabled={isDisabled}
          />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
}

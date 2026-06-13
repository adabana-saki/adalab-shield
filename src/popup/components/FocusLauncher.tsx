/**
 * Focus mode launcher for popup.
 *
 * The extension's own pomodoro was removed to avoid confusion with the
 * adalab study pomodoro (study owns the pomodoro; the extension mirrors it).
 * This launcher now starts Focus Mode only — a simple "block everything for
 * N minutes" timer that is the extension's own value.
 */

import { useState } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import { createMessage, type FocusStartMessage } from '@/shared/types/messages';
import type {
  FocusDuration,
  FocusModeState,
  PomodoroState,
} from '@/shared/types';

interface FocusLauncherProps {
  focusEnabled: boolean;
  focusState: FocusModeState;
  pomodoroState: PomodoroState;
  onFocusStateChange: (state: FocusModeState) => void;
}

export function FocusLauncher({
  focusEnabled,
  focusState,
  pomodoroState,
  onFocusStateChange,
}: FocusLauncherProps) {
  const { t } = useI18n();
  const [selectedDuration, setSelectedDuration] = useState<FocusDuration>(30);
  const [isLoading, setIsLoading] = useState(false);

  // Timer is active if focus mode is active or a pomodoro (mirrored from
  // study) is running/paused.
  const isPaused = !pomodoroState.isRunning && pomodoroState.mode !== 'idle';
  const isTimerActive =
    focusState.isActive || pomodoroState.isRunning || isPaused;

  const handleStartFocus = async () => {
    if (!focusEnabled || isTimerActive) {
      return;
    }

    setIsLoading(true);
    try {
      const message = createMessage<FocusStartMessage>({
        type: 'FOCUS_START',
        payload: { duration: selectedDuration },
      });
      const response: {
        success: boolean;
        data?: FocusModeState;
        error?: string;
      } = await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        onFocusStateChange(response.data);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  };

  if (isTimerActive) {
    return null;
  }

  if (!focusEnabled) {
    return (
      <div className="focus-launcher">
        <p className="focus-launcher-hint">{t('popupEnableTimersHint')}</p>
      </div>
    );
  }

  return (
    <div className="focus-launcher">
      <div className="focus-launcher-content">
        <div className="focus-launcher-title">{t('focusModeTitle')}</div>
        <div className="focus-duration-selector">
          {([30, 60, 120] as FocusDuration[]).map((duration) => (
            <button
              key={duration}
              type="button"
              className={`focus-duration-btn ${selectedDuration === duration ? 'active' : ''}`}
              onClick={() => setSelectedDuration(duration)}
            >
              {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="focus-start-btn"
          onClick={() => void handleStartFocus()}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          {t('focusModeStart')}
        </button>
      </div>
    </div>
  );
}

/**
 * Focus mode launcher for popup
 */

import { useState } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import {
  createMessage,
  type FocusStartMessage,
  type PomodoroStartMessage,
} from '@/shared/types/messages';
import type {
  FocusDuration,
  FocusModeState,
  PomodoroState,
} from '@/shared/types';

interface FocusLauncherProps {
  focusEnabled: boolean;
  pomodoroEnabled: boolean;
  focusState: FocusModeState;
  pomodoroState: PomodoroState;
  onFocusStateChange: (state: FocusModeState) => void;
  onPomodoroStateChange: (state: PomodoroState) => void;
}

export function FocusLauncher({
  focusEnabled,
  pomodoroEnabled,
  focusState,
  pomodoroState,
  onFocusStateChange,
  onPomodoroStateChange,
}: FocusLauncherProps) {
  const { t } = useI18n();
  const [selectedDuration, setSelectedDuration] = useState<FocusDuration>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'focus' | 'pomodoro'>('focus');

  // Timer is active if focus mode is active or pomodoro is running/paused
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

  const handleStartPomodoro = async () => {
    if (!pomodoroEnabled || isTimerActive) {
      return;
    }

    setIsLoading(true);
    try {
      const message = createMessage<PomodoroStartMessage>({
        type: 'POMODORO_START',
        payload: { mode: 'work' },
      });
      const response: {
        success: boolean;
        data?: PomodoroState;
        error?: string;
      } = await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        onPomodoroStateChange(response.data);
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

  const canStart =
    (mode === 'focus' && focusEnabled) ||
    (mode === 'pomodoro' && pomodoroEnabled);

  return (
    <div className="focus-launcher">
      <div className="focus-launcher-tabs">
        <button
          type="button"
          className={`focus-launcher-tab ${mode === 'focus' ? 'active' : ''}`}
          onClick={() => setMode('focus')}
          disabled={!focusEnabled}
        >
          {t('focusModeTitle')}
        </button>
        <button
          type="button"
          className={`focus-launcher-tab ${mode === 'pomodoro' ? 'active' : ''}`}
          onClick={() => setMode('pomodoro')}
          disabled={!pomodoroEnabled}
        >
          {t('pomodoroTitle')}
        </button>
      </div>

      {mode === 'focus' && (
        <div className="focus-launcher-content">
          <div className="focus-duration-selector">
            {([30, 60, 120] as FocusDuration[]).map((duration) => (
              <button
                key={duration}
                type="button"
                className={`focus-duration-btn ${selectedDuration === duration ? 'active' : ''}`}
                onClick={() => setSelectedDuration(duration)}
                disabled={!focusEnabled}
              >
                {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="focus-start-btn"
            onClick={() => void handleStartFocus()}
            disabled={!canStart || isLoading}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            {t('focusModeStart')}
          </button>
        </div>
      )}

      {mode === 'pomodoro' && (
        <div className="focus-launcher-content">
          <p className="pomodoro-info">{t('pomodoroDescription')}</p>
          <button
            type="button"
            className="focus-start-btn"
            onClick={() => void handleStartPomodoro()}
            disabled={!canStart || isLoading}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            {t('pomodoroStartWork')}
          </button>
        </div>
      )}

      {!focusEnabled && !pomodoroEnabled && (
        <p className="focus-launcher-hint">{t('popupEnableTimersHint')}</p>
      )}
    </div>
  );
}

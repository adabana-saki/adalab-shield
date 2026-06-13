/**
 * Active timer widget showing Focus Mode or Pomodoro progress
 */

import { useState, useEffect } from 'react';
import { useI18n } from '@/shared/hooks/useI18n';
import type {
  FocusModeState,
  PomodoroState,
  PomodoroSettings,
} from '@/shared/types';

interface ActiveTimerWidgetProps {
  focusState: FocusModeState;
  pomodoroState: PomodoroState;
  pomodoroSettings?: PomodoroSettings;
  /** True when the pomodoro mirrors the adalab study timer (study owns it) */
  pomodoroExternal?: boolean;
  onCancelFocus: () => void;
  onPomodoroAction: (action: 'pause' | 'resume' | 'skip' | 'stop') => void;
}

export function ActiveTimerWidget({
  focusState,
  pomodoroState,
  pomodoroSettings,
  pomodoroExternal = false,
  onCancelFocus,
  onPomodoroAction,
}: ActiveTimerWidgetProps) {
  const { t } = useI18n();

  // Check if pomodoro is paused (not running but not in idle mode)
  const isPaused = !pomodoroState.isRunning && pomodoroState.mode !== 'idle';

  // Format remaining time
  const formatTime = (ms: number): string => {
    if (ms <= 0) {
      return '0:00';
    }
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const calculateProgress = (remaining: number, total: number): number => {
    if (total <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  };

  // Track current time for timer calculations
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show Focus Mode timer
  if (
    focusState.isActive &&
    focusState.endTime !== null &&
    focusState.duration !== null
  ) {
    const remaining = Math.max(0, focusState.endTime - now);
    const total = focusState.duration * 60 * 1000;
    const progress = calculateProgress(total - remaining, total);

    return (
      <div className="timer-widget timer-widget-focus">
        <div className="timer-header">
          <span className="timer-label">{t('focusModeActive')}</span>
          <span className="timer-mode-badge focus">{t('focusModeTitle')}</span>
        </div>
        <div className="timer-display">
          <svg className="timer-circle" viewBox="0 0 100 100">
            <circle
              className="timer-circle-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
            />
            <circle
              className="timer-circle-progress focus"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              strokeDasharray={`${progress * 2.83} 283`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="timer-time">{formatTime(remaining)}</div>
        </div>
        <button
          type="button"
          className="timer-action-btn danger"
          onClick={onCancelFocus}
        >
          {t('focusModeCancel')}
        </button>
      </div>
    );
  }

  // Show Pomodoro timer
  if (pomodoroState.isRunning || isPaused) {
    const remaining = pomodoroState.timeRemainingMs;
    // Use settings for total duration, fall back to defaults
    const workMs = (pomodoroSettings?.workDurationMinutes ?? 25) * 60 * 1000;
    const breakMs = (pomodoroSettings?.breakDurationMinutes ?? 5) * 60 * 1000;
    const longBreakMs =
      (pomodoroSettings?.longBreakDurationMinutes ?? 15) * 60 * 1000;
    const total =
      pomodoroState.mode === 'work'
        ? workMs
        : pomodoroState.mode === 'longBreak'
          ? longBreakMs
          : breakMs;
    const progress = calculateProgress(total - remaining, total);

    const modeLabel =
      pomodoroState.mode === 'work'
        ? t('pomodoroWork')
        : pomodoroState.mode === 'break'
          ? t('pomodoroBreak')
          : t('pomodoroLongBreak');

    const modeClass =
      pomodoroState.mode === 'work'
        ? 'work'
        : pomodoroState.mode === 'break'
          ? 'break'
          : 'long-break';

    return (
      <div className={`timer-widget timer-widget-pomodoro ${modeClass}`}>
        <div className="timer-header">
          <span className="timer-label">
            {t('pomodoroSession')} {pomodoroState.sessionCount + 1}
          </span>
          <span className={`timer-mode-badge ${modeClass}`}>{modeLabel}</span>
        </div>
        <div className="timer-display">
          <svg className="timer-circle" viewBox="0 0 100 100">
            <circle
              className="timer-circle-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
            />
            <circle
              className={`timer-circle-progress ${modeClass}`}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              strokeDasharray={`${progress * 2.83} 283`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="timer-time">{formatTime(remaining)}</div>
        </div>
        {pomodoroExternal ? (
          <p className="timer-external-note">{t('pomodoroExternalNote')}</p>
        ) : (
          <div className="timer-controls">
            {isPaused ? (
              <button
                type="button"
                className="timer-control-btn"
                onClick={() => onPomodoroAction('resume')}
                title={t('pomodoroResume')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="timer-control-btn"
                onClick={() => onPomodoroAction('pause')}
                title={t('pomodoroPause')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="timer-control-btn"
              onClick={() => onPomodoroAction('skip')}
              title={t('pomodoroSkip')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,4 15,12 5,20" />
                <rect x="15" y="4" width="4" height="16" />
              </svg>
            </button>
            <button
              type="button"
              className="timer-control-btn danger"
              onClick={() => onPomodoroAction('stop')}
              title={t('pomodoroStop')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

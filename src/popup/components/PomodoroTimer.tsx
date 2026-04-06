/**
 * Pomodoro timer display component
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import type { PomodoroState, PomodoroMode } from '@/shared/types';
import { createMessage } from '@/shared/types/messages';
import { useI18n } from '@/shared/hooks/useI18n';

interface PomodoroTimerProps {
  readonly pomodoroState: PomodoroState;
  readonly onStateChange: (state: PomodoroState) => void;
}

/**
 * Format remaining time as MM:SS
 */
function formatTime(ms: number): string {
  if (ms <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculate progress percentage (0-100)
 */
function calculateProgress(state: PomodoroState): number {
  if (!state.isRunning || state.endTime === null || state.startedAt === null) {
    return 0;
  }

  const totalDuration = state.endTime - state.startedAt;
  const elapsed = Date.now() - state.startedAt;
  const progress = (elapsed / totalDuration) * 100;

  return Math.min(100, Math.max(0, progress));
}

/**
 * Get color for current mode
 */
function getModeColor(mode: PomodoroMode): string {
  switch (mode) {
    case 'work':
      return 'var(--color-primary)';
    case 'break':
      return 'var(--color-success, #22c55e)';
    case 'longBreak':
      return 'var(--color-info, #3b82f6)';
    default:
      return 'var(--color-text-muted)';
  }
}

export function PomodoroTimer({
  pomodoroState,
  onStateChange,
}: PomodoroTimerProps) {
  const { t } = useI18n();
  const [timeRemaining, setTimeRemaining] = useState<number>(
    pomodoroState.timeRemainingMs
  );
  const [progress, setProgress] = useState<number>(0);

  const refreshState = useCallback(async () => {
    try {
      const message = createMessage({
        type: 'POMODORO_GET_STATE' as const,
      });
      const response: {
        success: boolean;
        data?: PomodoroState;
        error?: string;
      } = await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        onStateChange(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, [onStateChange]);

  // Update countdown every second when running
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- timer sync: setState for initial value and in interval callback are intentional */
    if (!pomodoroState.isRunning || pomodoroState.endTime === null) {
      setTimeRemaining(pomodoroState.timeRemainingMs);
      setProgress(
        pomodoroState.isRunning ? calculateProgress(pomodoroState) : 0
      );
      return;
    }

    const updateTimer = () => {
      const remaining = pomodoroState.endTime! - Date.now();
      setTimeRemaining(Math.max(0, remaining));
      setProgress(calculateProgress(pomodoroState));

      // If time is up, refresh state
      if (remaining <= 0) {
        void refreshState();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    /* eslint-enable react-hooks/set-state-in-effect */

    return () => clearInterval(interval);
  }, [pomodoroState, refreshState]);

  // Calculate circle properties for SVG
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const modeColor = getModeColor(pomodoroState.mode);

  // Get mode display text
  const getModeText = () => {
    switch (pomodoroState.mode) {
      case 'work':
        return t('pomodoroWork');
      case 'break':
        return t('pomodoroBreak');
      case 'longBreak':
        return t('pomodoroLongBreak');
      default:
        return t('pomodoroIdle');
    }
  };

  return (
    <div className="pomodoro-timer">
      <div className="pomodoro-timer-circle">
        <svg viewBox="0 0 100 100" className="pomodoro-timer-svg">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-surface-elevated)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={modeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            className="pomodoro-progress-ring"
          />
        </svg>
        <div className="pomodoro-timer-content">
          <span className="pomodoro-time-value">
            {formatTime(timeRemaining)}
          </span>
          <span className="pomodoro-mode-label" style={{ color: modeColor }}>
            {getModeText()}
          </span>
        </div>
      </div>

      {/* Session counter */}
      <div className="pomodoro-session-counter">
        <span className="pomodoro-session-label">{t('pomodoroSessions')}</span>
        <span className="pomodoro-session-value">
          {pomodoroState.sessionCount}
        </span>
      </div>
    </div>
  );
}

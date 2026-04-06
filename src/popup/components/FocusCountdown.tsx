/**
 * Focus mode countdown timer display
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import type { FocusModeState, FocusExtendMessage } from '@/shared/types';
import { createMessage } from '@/shared/types/messages';
import { useI18n } from '@/shared/hooks/useI18n';

interface FocusCountdownProps {
  readonly focusState: FocusModeState;
  readonly onStateChange: (state: FocusModeState) => void;
}

/**
 * Format remaining time as MM:SS or HH:MM:SS
 */
function formatTime(ms: number): string {
  if (ms <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculate progress percentage (0-100)
 */
function calculateProgress(state: FocusModeState): number {
  if (!state.isActive || state.endTime === null || state.startedAt === null) {
    return 0;
  }

  const totalDuration = state.endTime - state.startedAt;
  const elapsed = Date.now() - state.startedAt;
  const progress = (elapsed / totalDuration) * 100;

  return Math.min(100, Math.max(0, progress));
}

export function FocusCountdown({
  focusState,
  onStateChange,
}: FocusCountdownProps) {
  const { t } = useI18n();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isExtending, setIsExtending] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      const message = createMessage({
        type: 'FOCUS_GET_STATE' as const,
      });
      const response: {
        success: boolean;
        data?: FocusModeState;
        error?: string;
      } = await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        onStateChange(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, [onStateChange]);

  // Update countdown every second
  useEffect(() => {
    if (!focusState.isActive || focusState.endTime === null) {
      setTimeRemaining(0);
      setProgress(0);
      return;
    }

    const updateTimer = () => {
      const remaining = focusState.endTime! - Date.now();
      setTimeRemaining(Math.max(0, remaining));
      setProgress(calculateProgress(focusState));

      // If time is up, refresh state
      if (remaining <= 0) {
        void refreshState();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [focusState, refreshState]);

  const handleExtend = useCallback(
    async (minutes: number) => {
      setIsExtending(true);
      try {
        const message = createMessage<FocusExtendMessage>({
          type: 'FOCUS_EXTEND',
          payload: { additionalMinutes: minutes },
        });
        const response: {
          success: boolean;
          data?: FocusModeState;
          error?: string;
        } = await browser.runtime.sendMessage(message);
        if (response.success === true && response.data !== undefined) {
          onStateChange(response.data);
        }
      } catch {
        // Ignore errors
      } finally {
        setIsExtending(false);
      }
    },
    [onStateChange]
  );

  if (!focusState.isActive) {
    return null;
  }

  // Calculate circle properties for SVG
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="focus-countdown">
      <div className="focus-countdown-circle">
        <svg viewBox="0 0 100 100" className="focus-countdown-svg">
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
            stroke="var(--color-primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            className="focus-progress-ring"
          />
        </svg>
        <div className="focus-countdown-time">
          <span className="focus-time-value">{formatTime(timeRemaining)}</span>
          <span className="focus-time-label">{t('focusModeRemaining')}</span>
        </div>
      </div>

      <div className="focus-extend-options">
        <span className="focus-extend-label">{t('focusModeExtend')}</span>
        <div className="focus-extend-buttons">
          <button
            type="button"
            className="focus-extend-button"
            onClick={() => void handleExtend(15)}
            disabled={isExtending}
          >
            +15m
          </button>
          <button
            type="button"
            className="focus-extend-button"
            onClick={() => void handleExtend(30)}
            disabled={isExtending}
          >
            +30m
          </button>
        </div>
      </div>
    </div>
  );
}

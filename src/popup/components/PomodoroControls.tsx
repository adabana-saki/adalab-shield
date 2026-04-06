/**
 * Pomodoro timer controls component
 */

import { useState, useCallback } from 'react';
import browser from 'webextension-polyfill';
import type { PomodoroState, PomodoroStartMessage } from '@/shared/types';
import { createMessage } from '@/shared/types/messages';
import { useI18n } from '@/shared/hooks/useI18n';

interface PomodoroControlsProps {
  readonly pomodoroState: PomodoroState;
  readonly onStateChange: (state: PomodoroState) => void;
  readonly disabled?: boolean;
}

export function PomodoroControls({
  pomodoroState,
  onStateChange,
  disabled = false,
}: PomodoroControlsProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = useCallback(
    async (mode: 'work' | 'break' | 'longBreak') => {
      setIsLoading(true);
      try {
        const message = createMessage<PomodoroStartMessage>({
          type: 'POMODORO_START',
          payload: { mode },
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
      } finally {
        setIsLoading(false);
      }
    },
    [onStateChange]
  );

  const handlePause = useCallback(async () => {
    setIsLoading(true);
    try {
      const message = createMessage({
        type: 'POMODORO_PAUSE' as const,
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
    } finally {
      setIsLoading(false);
    }
  }, [onStateChange]);

  const handleResume = useCallback(async () => {
    setIsLoading(true);
    try {
      const message = createMessage({
        type: 'POMODORO_RESUME' as const,
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
    } finally {
      setIsLoading(false);
    }
  }, [onStateChange]);

  const handleStop = useCallback(async () => {
    setIsLoading(true);
    try {
      const message = createMessage({
        type: 'POMODORO_STOP' as const,
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
    } finally {
      setIsLoading(false);
    }
  }, [onStateChange]);

  const handleSkip = useCallback(async () => {
    setIsLoading(true);
    try {
      const message = createMessage({
        type: 'POMODORO_SKIP' as const,
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
    } finally {
      setIsLoading(false);
    }
  }, [onStateChange]);

  const isDisabled = disabled || isLoading;
  const isIdle = pomodoroState.mode === 'idle';
  const isRunning = pomodoroState.isRunning;

  return (
    <div className="pomodoro-controls">
      {/* Mode selection when idle */}
      {isIdle && (
        <div className="pomodoro-mode-selection">
          <button
            type="button"
            className="pomodoro-mode-button pomodoro-mode-work"
            onClick={() => void handleStart('work')}
            disabled={isDisabled}
          >
            {t('pomodoroStartWork')}
          </button>
          <button
            type="button"
            className="pomodoro-mode-button pomodoro-mode-break"
            onClick={() => void handleStart('break')}
            disabled={isDisabled}
          >
            {t('pomodoroStartBreak')}
          </button>
        </div>
      )}

      {/* Controls when a session is active or paused */}
      {!isIdle && (
        <div className="pomodoro-action-buttons">
          {/* Play/Pause button */}
          {isRunning ? (
            <button
              type="button"
              className="pomodoro-action-button pomodoro-pause"
              onClick={() => void handlePause()}
              disabled={isDisabled}
              aria-label={t('pomodoroPause')}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="pomodoro-action-button pomodoro-play"
              onClick={() => void handleResume()}
              disabled={isDisabled}
              aria-label={t('pomodoroResume')}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}

          {/* Skip button */}
          <button
            type="button"
            className="pomodoro-action-button pomodoro-skip"
            onClick={() => void handleSkip()}
            disabled={isDisabled}
            aria-label={t('pomodoroSkip')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Stop button */}
          <button
            type="button"
            className="pomodoro-action-button pomodoro-stop"
            onClick={() => void handleStop()}
            disabled={isDisabled}
            aria-label={t('pomodoroStop')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

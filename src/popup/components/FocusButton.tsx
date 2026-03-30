/**
 * Focus mode quick-start button component
 */

import { useState, useCallback } from 'react';
import browser from 'webextension-polyfill';
import type {
  FocusDuration,
  FocusModeState,
  FocusStartMessage,
} from '@/shared/types';
import { createMessage } from '@/shared/types/messages';
import { useI18n } from '@/shared/hooks/useI18n';

interface FocusButtonProps {
  readonly focusState: FocusModeState;
  readonly onStateChange: (state: FocusModeState) => void;
  readonly disabled?: boolean;
}

const DURATION_OPTIONS: FocusDuration[] = [30, 60, 120];

export function FocusButton({
  focusState,
  onStateChange,
  disabled,
}: FocusButtonProps) {
  const { t } = useI18n();
  const [selectedDuration, setSelectedDuration] = useState<FocusDuration>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartFocus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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

      if (response.success === true && response.data !== null) {
        onStateChange(response.data);
      } else {
        setError(response.error ?? 'Failed to start focus mode');
      }
    } catch {
      setError('Failed to communicate with extension');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDuration, onStateChange]);

  const handleCancelFocus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const message = createMessage({
        type: 'FOCUS_CANCEL' as const,
      });

      const response: {
        success: boolean;
        data?: FocusModeState;
        error?: string;
      } = await browser.runtime.sendMessage(message);

      if (response.success === true && response.data !== null) {
        onStateChange(response.data);
      } else {
        setError(response.error ?? 'Failed to cancel focus mode');
      }
    } catch {
      setError('Failed to communicate with extension');
    } finally {
      setIsLoading(false);
    }
  }, [onStateChange]);

  // If focus is active, show cancel option
  if (focusState.isActive) {
    return (
      <div className="focus-button-container focus-active">
        <div className="focus-active-indicator">
          <span className="focus-pulse" />
          <span className="focus-active-text">{t('focusModeActive')}</span>
        </div>
        <button
          type="button"
          className="focus-cancel-button"
          onClick={() => void handleCancelFocus()}
          disabled={isLoading || disabled}
        >
          {isLoading ? t('focusModeCancelling') : t('focusModeCancel')}
        </button>
        {error && <p className="focus-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="focus-button-container">
      <div className="focus-duration-selector">
        {DURATION_OPTIONS.map((duration) => (
          <button
            key={duration}
            type="button"
            className={`focus-duration-option ${selectedDuration === duration ? 'selected' : ''}`}
            onClick={() => setSelectedDuration(duration)}
            disabled={isLoading || disabled}
          >
            {duration === 120 ? '2h' : `${duration}m`}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="focus-start-button"
        onClick={() => void handleStartFocus()}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <span className="focus-button-loading">{t('focusModeStarting')}</span>
        ) : (
          <>
            <svg
              className="focus-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{t('focusModeStart')}</span>
          </>
        )}
      </button>

      {error && <p className="focus-error">{error}</p>}
    </div>
  );
}

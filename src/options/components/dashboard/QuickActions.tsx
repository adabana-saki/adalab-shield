/**
 * Quick actions component for dashboard
 */

import { useState } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import {
  createMessage,
  type FocusStartMessage,
  type FocusCancelMessage,
} from '@/shared/types/messages';
import type { FocusDuration, FocusModeState } from '@/shared/types';

interface QuickActionsProps {
  focusEnabled: boolean;
  focusState: FocusModeState;
  onFocusStateChange: (state: FocusModeState) => void;
}

export function QuickActions({
  focusEnabled,
  focusState,
  onFocusStateChange,
}: QuickActionsProps) {
  const { t } = useI18n();
  const [selectedDuration, setSelectedDuration] = useState<FocusDuration>(30);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartFocus = async () => {
    if (!focusEnabled || focusState.isActive) {
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

  const handleCancelFocus = async () => {
    if (!focusState.isActive) {
      return;
    }

    setIsLoading(true);
    try {
      const message = createMessage<FocusCancelMessage>({
        type: 'FOCUS_CANCEL',
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

  const formatRemainingTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (focusState.isActive && focusState.endTime !== null) {
    // eslint-disable-next-line react-hooks/purity -- countdown derived from current time each render
    const remaining = focusState.endTime - Date.now();
    return (
      <div className="quick-actions">
        <div className="quick-actions-active">
          <div className="quick-actions-timer">
            <span className="quick-actions-timer-label">
              {t('focusModeActive')}
            </span>
            <span className="quick-actions-timer-value">
              {formatRemainingTime(remaining > 0 ? remaining : 0)}
            </span>
          </div>
          <button
            type="button"
            className="quick-actions-cancel"
            onClick={() => void handleCancelFocus()}
            disabled={isLoading}
          >
            {t('focusModeCancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-actions">
      <h3 className="quick-actions-title">{t('dashboardQuickActions')}</h3>
      <div className="quick-actions-focus">
        <div className="quick-actions-duration">
          {([30, 60, 120] as FocusDuration[]).map((duration) => (
            <button
              key={duration}
              type="button"
              className={`quick-actions-duration-btn ${selectedDuration === duration ? 'active' : ''}`}
              onClick={() => setSelectedDuration(duration)}
              disabled={!focusEnabled}
            >
              {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="quick-actions-start"
          onClick={() => void handleStartFocus()}
          disabled={!focusEnabled || isLoading}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="5,3 19,12 5,21 5,3" />
          </svg>
          {t('dashboardStartFocus')}
        </button>
      </div>
      {!focusEnabled && (
        <p className="quick-actions-hint">{t('dashboardFocusDisabledHint')}</p>
      )}
    </div>
  );
}

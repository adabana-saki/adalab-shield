/**
 * Commitment Lock settings component for options page
 * Implements friction levels to prevent easy unlock of blocking rules
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type { CommitmentLockState } from '@/shared/types';
import {
  COMMITMENT_LOCK_LIMITS,
  COMMITMENT_UNLOCK_WINDOW_MS,
  DEFAULT_COMMITMENT_LOCK,
} from '@/shared/constants/defaults';
import { UnlockDialog } from './UnlockDialog';

export function CommitmentLockSettings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  // Get commitment lock settings with defaults
  const commitmentLockSettings =
    settings.commitmentLock ?? DEFAULT_COMMITMENT_LOCK;

  // Local state
  const [commitmentLockState, setCommitmentLockState] =
    useState<CommitmentLockState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  // After a successful unlock flow, weakening changes are allowed briefly
  const inUnlockWindow =
    commitmentLockState !== null &&
    commitmentLockState.lastUnlockAt !== null &&
    Date.now() - commitmentLockState.lastUnlockAt < COMMITMENT_UNLOCK_WINDOW_MS;

  const loadStates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load Commitment Lock state
      const lockResponse: { success: boolean; data?: CommitmentLockState } =
        await browser.runtime.sendMessage({
          type: 'COMMITMENT_LOCK_GET_STATE',
          timestamp: Date.now(),
        });

      if (lockResponse.success === true && lockResponse.data !== undefined) {
        setCommitmentLockState(lockResponse.data);
      }
    } catch (err) {
      console.error('Failed to load Commitment Lock state:', err);
      setError(t('commitmentLockErrorLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load states on mount
  useEffect(() => {
    void loadStates();
  }, [loadStates]);

  const handleToggleEnabled = useCallback(async () => {
    // Disabling requires completing the unlock flow first (that is the
    // whole point of Commitment Lock)
    if (commitmentLockSettings.enabled && !inUnlockWindow) {
      setShowUnlockDialog(true);
      return;
    }
    try {
      const enabling = !commitmentLockSettings.enabled;
      await updateSettings({
        commitmentLock: enabling
          ? {
              // 有効化時はシンプルな構成に固定する (待機＋意思入力＋確認)。
              // 旧バージョンの複雑な設定が残っていても解除を単純な手順に戻す。
              enabled: true,
              level: 1,
              timeLockEnabled: false,
              scheduleRestriction: false,
              nuclearModeEnabled: false,
              escalatingCooldown: false,
              challengesMustBeConsecutive: false,
            }
          : { enabled: false },
      });
    } catch (err) {
      console.error('Failed to toggle Commitment Lock:', err);
      setError(t('commitmentLockErrorUpdate'));
    }
  }, [commitmentLockSettings.enabled, inUnlockWindow, updateSettings, t]);

  const handleWaitSecondsChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (
        !isNaN(value) &&
        value >= COMMITMENT_LOCK_LIMITS.MIN_WAIT_SECONDS &&
        value <= COMMITMENT_LOCK_LIMITS.MAX_WAIT_SECONDS
      ) {
        try {
          await updateSettings({
            commitmentLock: {
              confirmationWaitSeconds: value,
            },
          });
        } catch (err) {
          console.error('Failed to update wait seconds:', err);
        }
      }
    },
    [updateSettings]
  );

  const handleCooldownChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (
        !isNaN(value) &&
        value >= COMMITMENT_LOCK_LIMITS.MIN_COOLDOWN_MINUTES &&
        value <= COMMITMENT_LOCK_LIMITS.MAX_COOLDOWN_MINUTES
      ) {
        try {
          await updateSettings({
            commitmentLock: {
              cooldownAfterUnlockMinutes: value,
            },
          });
        } catch (err) {
          console.error('Failed to update cooldown:', err);
        }
      }
    },
    [updateSettings]
  );

  const handleIntentionToggle = useCallback(async () => {
    try {
      await updateSettings({
        commitmentLock: {
          requireIntentionStatement:
            !commitmentLockSettings.requireIntentionStatement,
        },
      });
    } catch (err) {
      console.error('Failed to toggle intention requirement:', err);
    }
  }, [commitmentLockSettings.requireIntentionStatement, updateSettings]);

  const handleIntentionLengthChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (
        !isNaN(value) &&
        value >= COMMITMENT_LOCK_LIMITS.MIN_INTENTION_LENGTH &&
        value <= COMMITMENT_LOCK_LIMITS.MAX_INTENTION_LENGTH
      ) {
        try {
          await updateSettings({
            commitmentLock: {
              intentionMinLength: value,
            },
          });
        } catch (err) {
          console.error('Failed to update intention length:', err);
        }
      }
    },
    [updateSettings]
  );

  if (isLoading) {
    return (
      <div className="commitment-lock-settings">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="commitment-lock-settings">
      {error && (
        <div className="error-banner">
          <p className="error-message">{error}</p>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => setError(null)}
          >
            {t('dismiss')}
          </button>
        </div>
      )}

      {/* Enable toggle */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={commitmentLockSettings.enabled}
            onChange={() => void handleToggleEnabled()}
          />
          <span className="toggle-text">{t('commitmentLockEnabled')}</span>
        </label>
        <p className="setting-description">
          {t('commitmentLockEnabledDescription')}
        </p>
      </div>

      <div
        className={`settings-detail ${commitmentLockSettings.enabled ? '' : 'is-disabled'}`}
      >
        {/* Unlock flow entry point */}
        <div className="setting-row">
          {inUnlockWindow ? (
            <p className="setting-description unlock-window-note">
              {t('commitmentLockUnlockWindowActive')}
            </p>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => setShowUnlockDialog(true)}
              >
                {t('commitmentLockUnlockButton')}
              </button>
              <p className="setting-description">
                {t('commitmentLockUnlockButtonDescription')}
              </p>
            </>
          )}
        </div>

        {/* Current state display */}
        {commitmentLockState && (
          <div className="state-info-banner">
            <div className="state-row">
              <span>{t('commitmentLockTodayAttempts')}:</span>
              <strong>{commitmentLockState.todayAttempts}</strong>
            </div>
            {commitmentLockState.currentCooldownEndsAt &&
              commitmentLockState.currentCooldownEndsAt > Date.now() && (
                <div className="state-row cooldown-active">
                  <span>{t('commitmentLockCooldownActive')}</span>
                </div>
              )}
          </div>
        )}

        {/* Level 1+ Settings */}
        <div className="setting-section">
          <h3 className="subsection-title">
            {t('commitmentLockBasicSettings')}
          </h3>

          {/* Wait time */}
          <div className="setting-row">
            <label className="input-label">
              <span className="label-text">{t('commitmentLockWaitTime')}</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  min={COMMITMENT_LOCK_LIMITS.MIN_WAIT_SECONDS}
                  max={COMMITMENT_LOCK_LIMITS.MAX_WAIT_SECONDS}
                  value={commitmentLockSettings.confirmationWaitSeconds}
                  onChange={(e) => void handleWaitSecondsChange(e)}
                />
                <span className="unit">{t('seconds')}</span>
              </div>
            </label>
            <p className="setting-description">
              {t('commitmentLockWaitTimeDescription')}
            </p>
          </div>

          {/* Cooldown */}
          <div className="setting-row">
            <label className="input-label">
              <span className="label-text">{t('commitmentLockCooldown')}</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  min={COMMITMENT_LOCK_LIMITS.MIN_COOLDOWN_MINUTES}
                  max={COMMITMENT_LOCK_LIMITS.MAX_COOLDOWN_MINUTES}
                  value={commitmentLockSettings.cooldownAfterUnlockMinutes}
                  onChange={(e) => void handleCooldownChange(e)}
                />
                <span className="unit">{t('minutes')}</span>
              </div>
            </label>
            <p className="setting-description">
              {t('commitmentLockCooldownDescription')}
            </p>
          </div>

          {/* Intention statement */}
          <div className="setting-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={commitmentLockSettings.requireIntentionStatement}
                onChange={() => void handleIntentionToggle()}
              />
              <span className="toggle-text">
                {t('commitmentLockRequireIntention')}
              </span>
            </label>
            <p className="setting-description">
              {t('commitmentLockRequireIntentionDescription')}
            </p>
          </div>

          {commitmentLockSettings.requireIntentionStatement && (
            <div className="setting-row nested">
              <label className="input-label">
                <span className="label-text">
                  {t('commitmentLockIntentionMinLength')}
                </span>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min={COMMITMENT_LOCK_LIMITS.MIN_INTENTION_LENGTH}
                    max={COMMITMENT_LOCK_LIMITS.MAX_INTENTION_LENGTH}
                    value={commitmentLockSettings.intentionMinLength}
                    onChange={(e) => void handleIntentionLengthChange(e)}
                  />
                  <span className="unit">{t('characters')}</span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="info-section">
          <h3>{t('commitmentLockInfoTitle')}</h3>
          <ul>
            <li>{t('commitmentLockInfo1')}</li>
            <li>{t('commitmentLockInfo2')}</li>
            <li>{t('commitmentLockInfo3')}</li>
          </ul>
        </div>
      </div>

      {/* Unlock flow dialog (wait → intention → challenges → confirm) */}
      <UnlockDialog
        isOpen={showUnlockDialog}
        onClose={() => setShowUnlockDialog(false)}
        onUnlockSuccess={() => {
          setShowUnlockDialog(false);
          void loadStates();
        }}
      />
    </div>
  );
}

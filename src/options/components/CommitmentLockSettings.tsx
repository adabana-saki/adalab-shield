/**
 * Commitment Lock settings component for options page
 * Implements friction levels to prevent easy unlock of blocking rules
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  // When the user clicks the enabled toggle while locked, we open the unlock
  // dialog and remember that the real intent was to turn the lock OFF, so we
  // can do it automatically on success (otherwise it takes two clicks).
  const pendingDisableRef = useRef(false);

  // After a successful unlock flow, weakening changes are allowed briefly
  const inUnlockWindow =
    commitmentLockState !== null &&
    commitmentLockState.lastUnlockAt !== null &&
    // eslint-disable-next-line react-hooks/purity -- time-based UI flag; recomputing per render is intended
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load on mount
    void loadStates();
  }, [loadStates]);

  const handleToggleEnabled = useCallback(async () => {
    // Disabling requires completing the unlock flow first (that is the
    // whole point of Commitment Lock). Remember the intent so we can turn it
    // off automatically once the unlock succeeds (one click, not two).
    if (commitmentLockSettings.enabled && !inUnlockWindow) {
      pendingDisableRef.current = true;
      setShowUnlockDialog(true);
      return;
    }
    try {
      const enabling = !commitmentLockSettings.enabled;
      await updateSettings({
        commitmentLock: enabling
          ? {
              // 有効化時はシンプルな構成に固定する (短い待機＋確認だけ)。
              // 旧バージョンの複雑な設定が残っていても、毎回ここで軽量化する。
              enabled: true,
              level: 1,
              confirmationWaitSeconds: 10,
              cooldownAfterUnlockMinutes: 0,
              requireIntentionStatement: false,
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

        {/* Wait time — the only knob: how long the speed bump lasts. */}
        <div className="setting-section">
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

      {/* Unlock = a short countdown, then confirm (no multi-step flow).
          Mounted only while open so each attempt starts fresh. */}
      {showUnlockDialog && (
        <UnlockDialog
          isOpen={showUnlockDialog}
          onClose={() => {
            // User backed out: forget the pending disable intent.
            pendingDisableRef.current = false;
            setShowUnlockDialog(false);
          }}
          onUnlockSuccess={() => {
            setShowUnlockDialog(false);
            void (async () => {
              await loadStates();
              // If the unlock was triggered by clicking the OFF toggle, finish
              // the job: the unlock window is now open so the guard allows it.
              if (pendingDisableRef.current) {
                pendingDisableRef.current = false;
                try {
                  await updateSettings({ commitmentLock: { enabled: false } });
                } catch (err) {
                  console.error('Failed to disable Commitment Lock:', err);
                  setError(t('commitmentLockErrorUpdate'));
                }
              }
            })();
          }}
        />
      )}
    </div>
  );
}

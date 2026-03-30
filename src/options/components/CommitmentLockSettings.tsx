/**
 * Commitment Lock settings component for options page
 * Implements friction levels to prevent easy unlock of blocking rules
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type {
  CommitmentLockState,
  CommitmentLockLevel,
  PremiumState,
} from '@/shared/types';
import {
  COMMITMENT_LOCK_LIMITS,
  COMMITMENT_LOCK_COOLDOWN_ESCALATION,
  DEFAULT_COMMITMENT_LOCK,
} from '@/shared/constants/defaults';

export function CommitmentLockSettings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  // Get commitment lock settings with defaults
  const commitmentLockSettings =
    settings.commitmentLock ?? DEFAULT_COMMITMENT_LOCK;

  // Local state
  const [commitmentLockState, setCommitmentLockState] =
    useState<CommitmentLockState | null>(null);
  const [premiumState, setPremiumState] = useState<PremiumState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if premium features are available
  const isPremium = premiumState?.isPremium ?? false;
  const canUseLevel3 = isPremium;

  const loadStates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load Commitment Lock state
      const lockResponse: { success: boolean; data?: CommitmentLockState } =
        await browser.runtime.sendMessage({
          type: 'COMMITMENT_LOCK_GET_STATE',
          timestamp: Date.now(),
        });

      if (lockResponse.success === true && lockResponse.data !== null) {
        setCommitmentLockState(lockResponse.data);
      }

      // Load Premium state
      const premiumResponse: { success: boolean; data?: PremiumState } =
        await browser.runtime.sendMessage({
          type: 'PREMIUM_GET_STATE',
          timestamp: Date.now(),
        });

      if (premiumResponse.success === true && premiumResponse.data !== null) {
        setPremiumState(premiumResponse.data);
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
    try {
      await updateSettings({
        commitmentLock: {
          enabled: !commitmentLockSettings.enabled,
        },
      });
    } catch (err) {
      console.error('Failed to toggle Commitment Lock:', err);
      setError(t('commitmentLockErrorUpdate'));
    }
  }, [commitmentLockSettings.enabled, updateSettings, t]);

  const handleLevelChange = useCallback(
    async (level: CommitmentLockLevel) => {
      // Check if Level 3 requires premium
      if (level === 3 && !canUseLevel3) {
        setError(t('commitmentLockPremiumRequired'));
        return;
      }

      try {
        await updateSettings({
          commitmentLock: {
            level,
          },
        });
      } catch (err) {
        console.error('Failed to change level:', err);
        setError(t('commitmentLockErrorUpdate'));
      }
    },
    [canUseLevel3, updateSettings, t]
  );

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

  const handleChallengeCountChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (
        !isNaN(value) &&
        value >= COMMITMENT_LOCK_LIMITS.MIN_CHALLENGES &&
        value <= COMMITMENT_LOCK_LIMITS.MAX_CHALLENGES
      ) {
        try {
          await updateSettings({
            commitmentLock: {
              challengeCount: value,
            },
          });
        } catch (err) {
          console.error('Failed to update challenge count:', err);
        }
      }
    },
    [updateSettings]
  );

  const handleConsecutiveToggle = useCallback(async () => {
    try {
      await updateSettings({
        commitmentLock: {
          challengesMustBeConsecutive:
            !commitmentLockSettings.challengesMustBeConsecutive,
        },
      });
    } catch (err) {
      console.error('Failed to toggle consecutive requirement:', err);
    }
  }, [commitmentLockSettings.challengesMustBeConsecutive, updateSettings]);

  const handleEscalatingToggle = useCallback(async () => {
    try {
      await updateSettings({
        commitmentLock: {
          escalatingCooldown: !commitmentLockSettings.escalatingCooldown,
        },
      });
    } catch (err) {
      console.error('Failed to toggle escalating cooldown:', err);
    }
  }, [commitmentLockSettings.escalatingCooldown, updateSettings]);

  const handleTimeLockToggle = useCallback(async () => {
    if (!canUseLevel3) {
      setError(t('commitmentLockPremiumRequired'));
      return;
    }
    try {
      await updateSettings({
        commitmentLock: {
          timeLockEnabled: !commitmentLockSettings.timeLockEnabled,
        },
      });
    } catch (err) {
      console.error('Failed to toggle time lock:', err);
    }
  }, [canUseLevel3, commitmentLockSettings.timeLockEnabled, updateSettings, t]);

  const handleTimeLockHoursChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (
        !isNaN(value) &&
        value >= COMMITMENT_LOCK_LIMITS.MIN_TIME_LOCK_HOURS &&
        value <= COMMITMENT_LOCK_LIMITS.MAX_TIME_LOCK_HOURS
      ) {
        try {
          await updateSettings({
            commitmentLock: {
              timeLockHours: value,
            },
          });
        } catch (err) {
          console.error('Failed to update time lock hours:', err);
        }
      }
    },
    [updateSettings]
  );

  const handleWeeklyLimitChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (
        !isNaN(value) &&
        value >= COMMITMENT_LOCK_LIMITS.MIN_WEEKLY_UNLOCKS &&
        value <= COMMITMENT_LOCK_LIMITS.MAX_WEEKLY_UNLOCKS
      ) {
        try {
          await updateSettings({
            commitmentLock: {
              weeklyUnlockLimit: value,
            },
          });
        } catch (err) {
          console.error('Failed to update weekly limit:', err);
        }
      }
    },
    [updateSettings]
  );

  const handleScheduleRestrictionToggle = useCallback(async () => {
    if (!canUseLevel3) {
      setError(t('commitmentLockPremiumRequired'));
      return;
    }
    try {
      await updateSettings({
        commitmentLock: {
          scheduleRestriction: !commitmentLockSettings.scheduleRestriction,
        },
      });
    } catch (err) {
      console.error('Failed to toggle schedule restriction:', err);
    }
  }, [
    canUseLevel3,
    commitmentLockSettings.scheduleRestriction,
    updateSettings,
    t,
  ]);

  const handleAllowedHoursChange = useCallback(
    async (start: number, end: number) => {
      try {
        await updateSettings({
          commitmentLock: {
            allowedUnlockHours: { start, end },
          },
        });
      } catch (err) {
        console.error('Failed to update allowed hours:', err);
      }
    },
    [updateSettings]
  );

  const handleNuclearModeToggle = useCallback(async () => {
    if (!canUseLevel3) {
      setError(t('commitmentLockPremiumRequired'));
      return;
    }

    // Show confirmation dialog for nuclear mode
    if (!commitmentLockSettings.nuclearModeEnabled) {
      const confirmed = window.confirm(t('commitmentLockNuclearConfirm'));
      if (!confirmed) {
        return;
      }
    }

    try {
      await updateSettings({
        commitmentLock: {
          nuclearModeEnabled: !commitmentLockSettings.nuclearModeEnabled,
        },
      });
    } catch (err) {
      console.error('Failed to toggle nuclear mode:', err);
    }
  }, [
    canUseLevel3,
    commitmentLockSettings.nuclearModeEnabled,
    updateSettings,
    t,
  ]);

  // Format cooldown escalation display
  const formatEscalation = (): string => {
    const { baseMinutes, multipliers } = COMMITMENT_LOCK_COOLDOWN_ESCALATION;
    return multipliers
      .map((m) => `${baseMinutes * m}${t('minutes')}`)
      .join(' → ');
  };

  if (isLoading) {
    return (
      <div className="commitment-lock-settings">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="commitment-lock-settings">
      <h2 className="section-title">{t('commitmentLockTitle')}</h2>
      <p className="section-description">{t('commitmentLockDescription')}</p>

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

      {commitmentLockSettings.enabled && (
        <>
          {/* Current state display */}
          {commitmentLockState && (
            <div className="state-info-banner">
              <div className="state-row">
                <span>{t('commitmentLockTodayAttempts')}:</span>
                <strong>{commitmentLockState.todayAttempts}</strong>
              </div>
              <div className="state-row">
                <span>{t('commitmentLockWeeklyUnlocksRemaining')}:</span>
                <strong>{commitmentLockState.weeklyUnlocksRemaining}</strong>
              </div>
              {commitmentLockState.currentCooldownEndsAt &&
                commitmentLockState.currentCooldownEndsAt > Date.now() && (
                  <div className="state-row cooldown-active">
                    <span>{t('commitmentLockCooldownActive')}</span>
                  </div>
                )}
            </div>
          )}

          {/* Level selection */}
          <div className="setting-section">
            <h3 className="subsection-title">
              {t('commitmentLockLevelTitle')}
            </h3>

            <div className="level-options">
              {/* Level 1 */}
              <label
                className={`level-option ${commitmentLockSettings.level === 1 ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="commitment-level"
                  checked={commitmentLockSettings.level === 1}
                  onChange={() => void handleLevelChange(1)}
                />
                <div className="level-content">
                  <span className="level-badge level-1">
                    {t('commitmentLockLevel1')}
                  </span>
                  <span className="level-name">
                    {t('commitmentLockLevel1Name')}
                  </span>
                  <p className="level-description">
                    {t('commitmentLockLevel1Description')}
                  </p>
                </div>
              </label>

              {/* Level 2 */}
              <label
                className={`level-option ${commitmentLockSettings.level === 2 ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="commitment-level"
                  checked={commitmentLockSettings.level === 2}
                  onChange={() => void handleLevelChange(2)}
                />
                <div className="level-content">
                  <span className="level-badge level-2">
                    {t('commitmentLockLevel2')}
                  </span>
                  <span className="level-name">
                    {t('commitmentLockLevel2Name')}
                  </span>
                  <p className="level-description">
                    {t('commitmentLockLevel2Description')}
                  </p>
                </div>
              </label>

              {/* Level 3 (Premium) */}
              <label
                className={`level-option ${commitmentLockSettings.level === 3 ? 'selected' : ''} ${!canUseLevel3 ? 'disabled premium-required' : ''}`}
              >
                <input
                  type="radio"
                  name="commitment-level"
                  checked={commitmentLockSettings.level === 3}
                  onChange={() => void handleLevelChange(3)}
                  disabled={!canUseLevel3}
                />
                <div className="level-content">
                  <span className="level-badge level-3">
                    {t('commitmentLockLevel3')}
                    {!canUseLevel3 && (
                      <span className="premium-badge">PRO</span>
                    )}
                  </span>
                  <span className="level-name">
                    {t('commitmentLockLevel3Name')}
                  </span>
                  <p className="level-description">
                    {t('commitmentLockLevel3Description')}
                  </p>
                  {!canUseLevel3 && (
                    <button type="button" className="btn btn-premium btn-small">
                      {t('upgradeToPremium')}
                    </button>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Level 1+ Settings */}
          <div className="setting-section">
            <h3 className="subsection-title">
              {t('commitmentLockBasicSettings')}
            </h3>

            {/* Wait time */}
            <div className="setting-row">
              <label className="input-label">
                <span className="label-text">
                  {t('commitmentLockWaitTime')}
                </span>
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
                <span className="label-text">
                  {t('commitmentLockCooldown')}
                </span>
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

          {/* Level 2+ Settings */}
          {commitmentLockSettings.level >= 2 && (
            <div className="setting-section">
              <h3 className="subsection-title">
                {t('commitmentLockChallengeSettings')}
              </h3>

              {/* Challenge count */}
              <div className="setting-row">
                <label className="input-label">
                  <span className="label-text">
                    {t('commitmentLockChallengeCount')}
                  </span>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min={COMMITMENT_LOCK_LIMITS.MIN_CHALLENGES}
                      max={COMMITMENT_LOCK_LIMITS.MAX_CHALLENGES}
                      value={commitmentLockSettings.challengeCount}
                      onChange={(e) => void handleChallengeCountChange(e)}
                    />
                    <span className="unit">{t('questions')}</span>
                  </div>
                </label>
                <p className="setting-description">
                  {t('commitmentLockChallengeCountDescription')}
                </p>
              </div>

              {/* Consecutive requirement */}
              <div className="setting-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={commitmentLockSettings.challengesMustBeConsecutive}
                    onChange={() => void handleConsecutiveToggle()}
                  />
                  <span className="toggle-text">
                    {t('commitmentLockConsecutive')}
                  </span>
                </label>
                <p className="setting-description">
                  {t('commitmentLockConsecutiveDescription')}
                </p>
              </div>

              {/* Escalating cooldown */}
              <div className="setting-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={commitmentLockSettings.escalatingCooldown}
                    onChange={() => void handleEscalatingToggle()}
                  />
                  <span className="toggle-text">
                    {t('commitmentLockEscalating')}
                  </span>
                </label>
                <p className="setting-description">
                  {t('commitmentLockEscalatingDescription')}
                  <br />
                  <span className="escalation-preview">
                    {formatEscalation()}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Level 3 Settings (Premium) */}
          {commitmentLockSettings.level === 3 && canUseLevel3 && (
            <div className="setting-section premium-section">
              <h3 className="subsection-title">
                {t('commitmentLockPremiumSettings')}
                <span className="premium-badge">PRO</span>
              </h3>

              {/* Time lock */}
              <div className="setting-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={commitmentLockSettings.timeLockEnabled}
                    onChange={() => void handleTimeLockToggle()}
                  />
                  <span className="toggle-text">
                    {t('commitmentLockTimeLock')}
                  </span>
                </label>
                <p className="setting-description">
                  {t('commitmentLockTimeLockDescription')}
                </p>
              </div>

              {commitmentLockSettings.timeLockEnabled && (
                <div className="setting-row nested">
                  <label className="input-label">
                    <span className="label-text">
                      {t('commitmentLockTimeLockDuration')}
                    </span>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        min={COMMITMENT_LOCK_LIMITS.MIN_TIME_LOCK_HOURS}
                        max={COMMITMENT_LOCK_LIMITS.MAX_TIME_LOCK_HOURS}
                        value={commitmentLockSettings.timeLockHours}
                        onChange={(e) => void handleTimeLockHoursChange(e)}
                      />
                      <span className="unit">{t('hours')}</span>
                    </div>
                  </label>
                  <p className="setting-description">
                    {t('commitmentLockTimeLockDurationDescription')}
                  </p>
                </div>
              )}

              {/* Weekly unlock limit */}
              <div className="setting-row">
                <label className="input-label">
                  <span className="label-text">
                    {t('commitmentLockWeeklyLimit')}
                  </span>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min={COMMITMENT_LOCK_LIMITS.MIN_WEEKLY_UNLOCKS}
                      max={COMMITMENT_LOCK_LIMITS.MAX_WEEKLY_UNLOCKS}
                      value={commitmentLockSettings.weeklyUnlockLimit}
                      onChange={(e) => void handleWeeklyLimitChange(e)}
                    />
                    <span className="unit">{t('timesPerWeek')}</span>
                  </div>
                </label>
                <p className="setting-description">
                  {t('commitmentLockWeeklyLimitDescription')}
                </p>
              </div>

              {/* Schedule restriction */}
              <div className="setting-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={commitmentLockSettings.scheduleRestriction}
                    onChange={() => void handleScheduleRestrictionToggle()}
                  />
                  <span className="toggle-text">
                    {t('commitmentLockScheduleRestriction')}
                  </span>
                </label>
                <p className="setting-description">
                  {t('commitmentLockScheduleRestrictionDescription')}
                </p>
              </div>

              {commitmentLockSettings.scheduleRestriction && (
                <div className="setting-row nested">
                  <label className="input-label">
                    <span className="label-text">
                      {t('commitmentLockAllowedHours')}
                    </span>
                    <div className="time-range-input">
                      <select
                        value={
                          commitmentLockSettings.allowedUnlockHours?.start ?? 9
                        }
                        onChange={(e) =>
                          void handleAllowedHoursChange(
                            parseInt(e.target.value, 10),
                            commitmentLockSettings.allowedUnlockHours?.end ?? 18
                          )
                        }
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option
                            key={i}
                            value={i}
                          >{`${i.toString().padStart(2, '0')}:00`}</option>
                        ))}
                      </select>
                      <span className="range-separator">〜</span>
                      <select
                        value={
                          commitmentLockSettings.allowedUnlockHours?.end ?? 18
                        }
                        onChange={(e) =>
                          void handleAllowedHoursChange(
                            commitmentLockSettings.allowedUnlockHours?.start ??
                              9,
                            parseInt(e.target.value, 10)
                          )
                        }
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option
                            key={i}
                            value={i}
                          >{`${i.toString().padStart(2, '0')}:00`}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>
              )}

              {/* Nuclear mode - most dangerous option */}
              <div className="setting-row nuclear-option">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={commitmentLockSettings.nuclearModeEnabled}
                    onChange={() => void handleNuclearModeToggle()}
                  />
                  <span className="toggle-text danger">
                    {t('commitmentLockNuclear')}
                  </span>
                </label>
                <p className="setting-description danger-description">
                  {t('commitmentLockNuclearDescription')}
                </p>
                {commitmentLockSettings.nuclearModeEnabled && (
                  <div className="nuclear-warning">
                    <span className="warning-icon">⚠️</span>
                    <span>{t('commitmentLockNuclearWarning')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info section */}
          <div className="info-section">
            <h3>{t('commitmentLockInfoTitle')}</h3>
            <ul>
              <li>{t('commitmentLockInfo1')}</li>
              <li>{t('commitmentLockInfo2')}</li>
              <li>{t('commitmentLockInfo3')}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Streak settings component for options page
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type { StreakData } from '@/shared/types';
import { createMessage } from '@/shared/types/messages';
import { DEFAULT_STREAK_DATA, STREAK_MILESTONES } from '@/shared/constants';

export function StreakSettings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreakData = useCallback(async () => {
    try {
      const message = createMessage({ type: 'STREAK_GET_DATA' as const });
      const response: { success: boolean; data?: StreakData; error?: string } =
        await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        setStreakData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStreakData();
  }, [fetchStreakData]);

  const handleToggleEnabled = async () => {
    await updateSettings({
      streak: {
        enabled: !settings.streak.enabled,
      },
    });
  };

  const handleGoalTypeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const goalType = e.target.value as 'focus_time' | 'blocks' | 'no_access';
    await updateSettings({
      streak: {
        goalType,
      },
    });
  };

  const handleMinFocusMinutesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const minFocusMinutes = parseInt(e.target.value, 10);
    if (!isNaN(minFocusMinutes) && minFocusMinutes >= 1) {
      await updateSettings({
        streak: {
          minFocusMinutes,
        },
      });
    }
  };

  const handleMinBlocksChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const minBlocks = parseInt(e.target.value, 10);
    if (!isNaN(minBlocks) && minBlocks >= 1) {
      await updateSettings({
        streak: {
          minBlocks,
        },
      });
    }
  };

  const handleToggleNotifications = async () => {
    await updateSettings({
      streak: {
        showNotifications: !settings.streak.showNotifications,
      },
    });
  };

  const handleResetStreak = async () => {
    if (!confirm(t('streakResetConfirm'))) {
      return;
    }

    try {
      const message = createMessage({ type: 'STREAK_RESET' as const });
      const response: { success: boolean; data?: StreakData; error?: string } =
        await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        setStreakData(response.data);
      }
    } catch (error) {
      console.error('Failed to reset streak:', error);
    }
  };

  // Find next milestone
  const nextMilestone =
    STREAK_MILESTONES.find((m) => m > streakData.currentStreak) ?? null;
  const progressToNext = nextMilestone
    ? Math.min(100, (streakData.currentStreak / nextMilestone) * 100)
    : 100;

  return (
    <div className="streak-settings">
      <h2 className="section-title">{t('streakTitle')}</h2>
      <p className="section-description">{t('streakDescription')}</p>

      {/* Enable toggle */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.streak.enabled}
            onChange={() => void handleToggleEnabled()}
          />
          <span className="toggle-text">{t('streakEnabled')}</span>
        </label>
      </div>

      {settings.streak.enabled && (
        <>
          {/* Current streak display */}
          {!isLoading && (
            <div className="streak-overview">
              <div className="streak-card streak-card-current">
                <span className="streak-card-value">
                  {streakData.currentStreak}
                </span>
                <span className="streak-card-label">{t('streakCurrent')}</span>
              </div>
              <div className="streak-card">
                <span className="streak-card-value">
                  {streakData.longestStreak}
                </span>
                <span className="streak-card-label">{t('streakLongest')}</span>
              </div>
              <div className="streak-card">
                <span className="streak-card-value">
                  {streakData.totalFocusDays}
                </span>
                <span className="streak-card-label">
                  {t('streakTotalDays')}
                </span>
              </div>
            </div>
          )}

          {/* Progress to next milestone */}
          {nextMilestone && streakData.currentStreak > 0 && (
            <div className="streak-progress-section">
              <div className="streak-progress-header">
                <span>
                  {t('streakNextMilestone')}: {nextMilestone} {t('days')}
                </span>
                <span>{Math.round(progressToNext)}%</span>
              </div>
              <div className="streak-progress-bar-large">
                <div
                  className="streak-progress-fill-large"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}

          {/* Achieved milestones */}
          {streakData.achievedMilestones.length > 0 && (
            <div className="setting-row">
              <span className="label-text">{t('streakMilestones')}</span>
              <div className="streak-milestone-list">
                {streakData.achievedMilestones.map((milestone) => (
                  <span key={milestone} className="streak-milestone-item">
                    {milestone} {t('days')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Goal type selection */}
          <div className="setting-row">
            <label className="select-label">
              <span className="label-text">{t('streakGoalType')}</span>
              <select
                value={settings.streak.goalType}
                onChange={(e) => void handleGoalTypeChange(e)}
              >
                <option value="focus_time">{t('streakGoalFocusTime')}</option>
                <option value="blocks">{t('streakGoalBlocks')}</option>
                <option value="no_access">{t('streakGoalNoAccess')}</option>
              </select>
            </label>
            <p className="setting-description">
              {t('streakGoalTypeDescription')}
            </p>
          </div>

          {/* Minimum focus minutes (for focus_time goal) */}
          {settings.streak.goalType === 'focus_time' && (
            <div className="setting-row">
              <label className="input-label">
                <span className="label-text">{t('streakMinFocusMinutes')}</span>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={settings.streak.minFocusMinutes}
                  onChange={(e) => void handleMinFocusMinutesChange(e)}
                />
              </label>
              <p className="setting-description">
                {t('streakMinFocusMinutesDescription')}
              </p>
            </div>
          )}

          {/* Minimum blocks (for blocks goal) */}
          {settings.streak.goalType === 'blocks' && (
            <div className="setting-row">
              <label className="input-label">
                <span className="label-text">{t('streakMinBlocks')}</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.streak.minBlocks}
                  onChange={(e) => void handleMinBlocksChange(e)}
                />
              </label>
              <p className="setting-description">
                {t('streakMinBlocksDescription')}
              </p>
            </div>
          )}

          {/* Notifications toggle */}
          <div className="setting-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.streak.showNotifications}
                onChange={() => void handleToggleNotifications()}
              />
              <span className="toggle-text">{t('streakNotifications')}</span>
            </label>
            <p className="setting-description">
              {t('streakNotificationsDescription')}
            </p>
          </div>

          {/* Reset streak button */}
          <div className="actions-row">
            <button
              className="btn-danger"
              onClick={() => void handleResetStreak()}
            >
              {t('streakReset')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Statistics display component
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type {
  BlockingStats,
  TimeLimitsState,
  Settings,
  Platform,
  StreakData,
} from '@/shared/types';
import { StreakDisplay } from './StreakDisplay';

/** Platform display names mapping */
const PLATFORM_NAMES: Record<Platform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube_full: 'YouTube (Full)',
  instagram_full: 'Instagram (Full)',
  tiktok_full: 'TikTok (Full)',
  twitter: 'X (Twitter)',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  threads: 'Threads',
  snapchat: 'Snapchat',
  reddit: 'Reddit',
  discord: 'Discord',
  pinterest: 'Pinterest',
  twitch: 'Twitch',
};

interface StatsProps {
  stats: BlockingStats;
  timeLimitsState?: TimeLimitsState;
  streakData?: StreakData;
  settings?: Settings;
}

export function Stats({
  stats,
  timeLimitsState,
  streakData,
  settings,
}: StatsProps) {
  const { t, formatNumber } = useI18n();

  const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getUsagePercent = (platform: Platform): number => {
    if (!timeLimitsState || !settings?.timeLimits.enabled) {
      return 0;
    }

    const usage = timeLimitsState.usage.find((u) => u.platform === platform);
    const limit = settings.timeLimits.limits.find(
      (l) => l.platform === platform && l.enabled
    );

    if (!usage || !limit) {
      return 0;
    }

    const limitMs = limit.dailyLimitMinutes * 60 * 1000;
    return Math.min(100, (usage.usedTodayMs / limitMs) * 100);
  };

  const getUsageColor = (percent: number, warningThreshold: number): string => {
    if (percent >= 100) {
      return '#ef4444';
    } // red
    if (percent >= warningThreshold) {
      return '#f59e0b';
    } // yellow/orange
    return '#22c55e'; // green
  };

  const hasTimeUsage =
    timeLimitsState &&
    settings?.timeLimits.enabled &&
    timeLimitsState.usage.length > 0;

  return (
    <div className="stats-container">
      {/* Streak display */}
      {streakData && settings?.streak.enabled && (
        <StreakDisplay streakData={streakData} />
      )}

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{formatNumber(stats.blockedToday)}</div>
          <div className="stat-label">{t('popupStatsToday')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{formatNumber(stats.blockedTotal)}</div>
          <div className="stat-label">{t('popupStatsTotal')}</div>
        </div>
      </div>

      {hasTimeUsage && (
        <div className="time-usage-section">
          <h3 className="time-usage-title">{t('timeLimitsTodaysUsage')}</h3>
          <div className="time-usage-list">
            {timeLimitsState.usage.map((usage) => {
              const limit = settings.timeLimits.limits.find(
                (l) => l.platform === usage.platform && l.enabled
              );
              const percent = getUsagePercent(usage.platform);
              const warningThreshold =
                settings.timeLimits.warningThresholdPercent;

              return (
                <div key={usage.platform} className="time-usage-item">
                  <div className="time-usage-header">
                    <span className="platform-name">
                      {PLATFORM_NAMES[usage.platform] ?? usage.platform}
                    </span>
                    <span className="usage-time">
                      {formatDuration(usage.usedTodayMs)}
                      {limit && (
                        <span className="usage-limit">
                          {' / '}
                          {formatDuration(limit.dailyLimitMinutes * 60 * 1000)}
                        </span>
                      )}
                    </span>
                  </div>
                  {limit && (
                    <div className="usage-progress-bar">
                      <div
                        className="usage-progress-fill"
                        style={{
                          width: `${Math.min(100, percent)}%`,
                          backgroundColor: getUsageColor(
                            percent,
                            warningThreshold
                          ),
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

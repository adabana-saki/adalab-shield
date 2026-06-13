/**
 * Compact stats row for popup
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { BlockingStats } from '@/shared/types';

interface CompactStatsProps {
  stats: BlockingStats;
  todayUsageMs?: number;
}

/**
 * Format duration in milliseconds to human readable string
 */
function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalMinutes === 0) {
    return '0m';
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function CompactStats({ stats, todayUsageMs }: CompactStatsProps) {
  const { t, formatNumber } = useI18n();

  return (
    <div className="compact-stats">
      <div className="compact-stat">
        <span className="compact-stat-value">
          {formatNumber(stats.blockedToday)}
        </span>
        <span className="compact-stat-label">{t('popupStatsToday')}</span>
      </div>
      {todayUsageMs !== undefined && todayUsageMs > 0 && (
        <div className="compact-stat time-usage">
          <span className="compact-stat-icon clock">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          <span className="compact-stat-value">
            {formatDuration(todayUsageMs)}
          </span>
          <span className="compact-stat-label">
            {t('popupStatsTodayUsage')}
          </span>
        </div>
      )}
      <div className="compact-stat">
        <span className="compact-stat-value">
          {formatNumber(stats.blockedTotal)}
        </span>
        <span className="compact-stat-label">{t('popupStatsTotal')}</span>
      </div>
    </div>
  );
}

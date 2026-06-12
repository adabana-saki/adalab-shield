/**
 * Activity heatmap component showing weekly viewing patterns
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { DailyTimeRecord } from '@/shared/types';
import { getLocalDateString } from '@/shared/utils/date';

interface ActivityHeatmapProps {
  history: readonly DailyTimeRecord[];
}

/**
 * Get the last N days as ISO date strings
 */
function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(getLocalDateString(date));
  }

  return dates;
}

/**
 * Get day of week abbreviation
 */
function getDayAbbr(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
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

/**
 * Calculate intensity level (0-4) based on usage time
 */
function calculateIntensity(ms: number, maxMs: number): number {
  if (ms === 0) {
    return 0;
  }
  if (maxMs === 0) {
    return 0;
  }

  const ratio = ms / maxMs;
  if (ratio <= 0.25) {
    return 1;
  }
  if (ratio <= 0.5) {
    return 2;
  }
  if (ratio <= 0.75) {
    return 3;
  }
  return 4;
}

export function ActivityHeatmap({ history }: ActivityHeatmapProps) {
  const { t } = useI18n();

  const last7Days = getLastNDays(7);
  const maxMs = Math.max(...history.map((r) => r.totalMs), 1);

  return (
    <div className="activity-heatmap dashboard-card">
      <h3 className="activity-heatmap-title">{t('dashboardWeeklyActivity')}</h3>

      <div className="activity-heatmap-grid">
        {last7Days.map((date) => {
          const record = history.find((r) => r.date === date);
          const totalMs = record?.totalMs ?? 0;
          const intensity = calculateIntensity(totalMs, maxMs);

          return (
            <div key={date} className="activity-heatmap-day">
              <div
                className={`activity-heatmap-cell intensity-${intensity}`}
                title={`${getDayAbbr(date)}: ${formatDuration(totalMs)}`}
              />
              <span className="activity-heatmap-label">{getDayAbbr(date)}</span>
            </div>
          );
        })}
      </div>

      <div className="activity-heatmap-legend">
        <span className="activity-heatmap-legend-label">
          {t('heatmapLegendLow') || 'Less'}
        </span>
        <div className="activity-heatmap-legend-cells">
          <div className="activity-heatmap-cell intensity-0" />
          <div className="activity-heatmap-cell intensity-1" />
          <div className="activity-heatmap-cell intensity-2" />
          <div className="activity-heatmap-cell intensity-3" />
          <div className="activity-heatmap-cell intensity-4" />
        </div>
        <span className="activity-heatmap-legend-label">
          {t('heatmapLegendHigh') || 'More'}
        </span>
      </div>
    </div>
  );
}

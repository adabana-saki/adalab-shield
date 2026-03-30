/**
 * Schedule status badge for popup
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { isScheduleActive, formatTime } from '@/shared/utils/schedule';
import type { ScheduleConfig } from '@/shared/types';

interface ScheduleBadgeProps {
  schedule: ScheduleConfig;
}

export function ScheduleBadge({ schedule }: ScheduleBadgeProps) {
  const { t } = useI18n();
  const isActive = schedule.enabled && isScheduleActive(schedule);

  if (!schedule.enabled) {
    return (
      <div className="schedule-badge inactive">
        <span className="schedule-badge-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </span>
        <span className="schedule-badge-text">{t('scheduleDisabled')}</span>
      </div>
    );
  }

  const firstRange = schedule.timeRanges[0];
  const timeRangeText = firstRange
    ? `${formatTime(firstRange.startHour, firstRange.startMinute)} - ${formatTime(firstRange.endHour, firstRange.endMinute)}`
    : '';

  return (
    <div className={`schedule-badge ${isActive ? 'active' : 'inactive'}`}>
      <span className="schedule-badge-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      </span>
      <span className="schedule-badge-text">
        {isActive ? t('scheduleActive') : t('scheduleInactive')}
        {timeRangeText && ` (${timeRangeText})`}
      </span>
    </div>
  );
}

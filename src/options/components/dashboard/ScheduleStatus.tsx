/**
 * Schedule status component showing current blocking schedule
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { isScheduleActive, formatTime } from '@/shared/utils/schedule';
import type { ScheduleConfig } from '@/shared/types';

interface ScheduleStatusProps {
  schedule: ScheduleConfig;
  onEditClick: () => void;
}

export function ScheduleStatus({ schedule, onEditClick }: ScheduleStatusProps) {
  const { t } = useI18n();
  const isActive = schedule.enabled && isScheduleActive(schedule);

  const getScheduleSummary = (): string => {
    if (!schedule.enabled) {
      return t('scheduleDisabled');
    }

    const activeDays = schedule.activeDays
      .map((day) => t(`dayShort${day}`))
      .join(', ');

    if (schedule.timeRanges.length === 0) {
      return activeDays;
    }

    const firstRange = schedule.timeRanges[0];
    if (!firstRange) {
      return activeDays;
    }
    const timeRange = `${formatTime(firstRange.startHour, firstRange.startMinute)} - ${formatTime(firstRange.endHour, firstRange.endMinute)}`;

    return `${activeDays} (${timeRange})`;
  };

  return (
    <div className="schedule-status">
      <div className="schedule-status-header">
        <div className="schedule-status-info">
          <h3 className="schedule-status-title">{t('scheduleTitle')}</h3>
          <span
            className={`schedule-status-badge ${isActive ? 'active' : 'inactive'}`}
          >
            {isActive ? t('scheduleActive') : t('scheduleInactive')}
          </span>
        </div>
        <button
          type="button"
          className="schedule-status-edit"
          onClick={onEditClick}
        >
          {t('dashboardEdit')}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </div>
      <p className="schedule-status-summary">{getScheduleSummary()}</p>
    </div>
  );
}

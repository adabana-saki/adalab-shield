/**
 * Schedule widget for popup
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { useSettings } from '@/shared/hooks/useSettings';
import type { DayOfWeek } from '@/shared/types';

const DAYS_OF_WEEK: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

const DAY_KEYS: Record<DayOfWeek, string> = {
  0: 'scheduleDaySun',
  1: 'scheduleDayMon',
  2: 'scheduleDayTue',
  3: 'scheduleDayWed',
  4: 'scheduleDayThu',
  5: 'scheduleDayFri',
  6: 'scheduleDaySat',
};

export function ScheduleWidget() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();

  const schedule = settings.schedule;

  const handleToggleSchedule = async () => {
    await updateSettings({
      schedule: {
        enabled: !schedule.enabled,
      },
    });
  };

  const handleToggleDay = async (day: DayOfWeek) => {
    const currentDays = [...schedule.activeDays];
    const index = currentDays.indexOf(day);

    if (index >= 0) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(day);
      currentDays.sort((a, b) => a - b);
    }

    await updateSettings({
      schedule: {
        activeDays: currentDays as readonly DayOfWeek[],
      },
    });
  };

  // Format time range for display
  const formatTimeRange = () => {
    if (schedule.timeRanges.length === 0) {
      return '';
    }
    const range = schedule.timeRanges[0];
    if (!range) {
      return '';
    }
    const start = `${range.startHour.toString().padStart(2, '0')}:${range.startMinute.toString().padStart(2, '0')}`;
    const end = `${range.endHour.toString().padStart(2, '0')}:${range.endMinute.toString().padStart(2, '0')}`;
    return `${start} - ${end}`;
  };

  return (
    <div className="schedule-widget">
      {/* Schedule toggle */}
      <div className="schedule-widget-header">
        <div className="schedule-widget-status">
          <span className="schedule-widget-label">
            {t('popupScheduleStatus')}
          </span>
          <span
            className={`schedule-widget-badge ${schedule.enabled ? 'active' : 'inactive'}`}
          >
            {schedule.enabled ? t('popupScheduleOn') : t('popupScheduleOff')}
          </span>
        </div>
        <button
          type="button"
          className={`schedule-toggle-button ${schedule.enabled ? 'enabled' : ''}`}
          onClick={() => void handleToggleSchedule()}
          aria-label={t('popupQuickScheduleToggle')}
        >
          <span className="schedule-toggle-knob" />
        </button>
      </div>

      {schedule.enabled && (
        <>
          {/* Time range display */}
          <div className="schedule-widget-time">{formatTimeRange()}</div>

          {/* Day selector */}
          <div className="schedule-widget-days">
            {DAYS_OF_WEEK.map((day) => {
              const dayKey = DAY_KEYS[day];
              const isSelected = schedule.activeDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={`schedule-day-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => void handleToggleDay(day)}
                >
                  {t(dayKey)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

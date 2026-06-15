/**
 * Schedule configuration component for time-based blocking
 */

import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/shared/hooks/useI18n';
import { useSettings } from '@/shared/hooks/useSettings';
import type { DayOfWeek, TimeRange } from '@/shared/types';
import { isScheduleActive } from '@/shared/utils/schedule';

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

/**
 * Format time for display (HH:MM format)
 */
function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Parse time string (HH:MM) to hour and minute
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = timeStr.split(':');
  return {
    hour: parseInt(hourStr ?? '0', 10),
    minute: parseInt(minuteStr ?? '0', 10),
  };
}

/** One-click schedule presets (active days + a single time range). */
const SCHEDULE_PRESETS: {
  id: string;
  labelKey: string;
  activeDays: DayOfWeek[];
  range: TimeRange;
}[] = [
  {
    id: 'work',
    labelKey: 'schedulePresetWork',
    activeDays: [1, 2, 3, 4, 5],
    range: { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  },
  {
    id: 'evening',
    labelKey: 'schedulePresetEvening',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    range: { startHour: 18, startMinute: 0, endHour: 23, endMinute: 0 },
  },
  {
    id: 'bedtime',
    labelKey: 'schedulePresetBedtime',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    range: { startHour: 21, startMinute: 0, endHour: 23, endMinute: 59 },
  },
  {
    id: 'allDay',
    labelKey: 'schedulePresetAllDay',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    range: { startHour: 0, startMinute: 0, endHour: 23, endMinute: 59 },
  },
];

export function Schedule() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();
  const [isActive, setIsActive] = useState(false);

  const schedule = useMemo(
    () =>
      settings.schedule ?? { enabled: false, activeDays: [], timeRanges: [] },
    [settings.schedule]
  );
  const timeRanges = schedule.timeRanges ?? [];

  // Update active status every minute
  useEffect(() => {
    const checkStatus = () => {
      setIsActive(isScheduleActive(schedule));
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [schedule]);

  const handleToggleEnabled = async () => {
    await updateSettings({
      schedule: {
        enabled: !schedule.enabled,
      },
    });
  };

  const handleApplyPreset = async (
    preset: (typeof SCHEDULE_PRESETS)[number]
  ) => {
    await updateSettings({
      schedule: {
        enabled: true,
        activeDays: preset.activeDays as readonly DayOfWeek[],
        timeRanges: [preset.range],
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

  const handleAddTimeRange = async () => {
    const newRange: TimeRange = {
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
    };

    await updateSettings({
      schedule: {
        timeRanges: [...timeRanges, newRange],
      },
    });
  };

  const handleRemoveTimeRange = async (index: number) => {
    const newRanges = timeRanges.filter((_, i) => i !== index);
    await updateSettings({
      schedule: {
        timeRanges: newRanges,
      },
    });
  };

  const handleUpdateTimeRange = async (
    index: number,
    field: 'start' | 'end',
    timeStr: string
  ) => {
    const { hour, minute } = parseTime(timeStr);
    const newRanges = timeRanges.map((range, i) => {
      if (i !== index) {
        return range;
      }

      if (field === 'start') {
        return {
          ...range,
          startHour: hour,
          startMinute: minute,
        };
      } else {
        return {
          ...range,
          endHour: hour,
          endMinute: minute,
        };
      }
    });

    await updateSettings({
      schedule: {
        timeRanges: newRanges,
      },
    });
  };

  const statusText = schedule.enabled
    ? isActive
      ? t('scheduleStatusActive')
      : t('scheduleStatusInactive')
    : t('scheduleStatusInactive');

  return (
    <div className="schedule-section">
      {/* Enable toggle */}
      <div className="schedule-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={() => void handleToggleEnabled()}
          />
          <span className="toggle-text">{t('scheduleEnabled')}</span>
        </label>
      </div>

      {schedule.enabled ? (
        <div className={`schedule-status ${isActive ? 'active' : 'inactive'}`}>
          {t('scheduleStatus').replace('$STATUS$', statusText)}
        </div>
      ) : (
        <p className="section-hint">{t('settingsInactiveHint')}</p>
      )}

      {/* Config stays visible and editable even when off, so it can be set up
          in advance; the toggle above just activates it. */}
      <>
        {/* Quick presets */}
        <div className="schedule-presets">
          <h3>{t('schedulePresets')}</h3>
          <div className="schedule-preset-buttons">
            {SCHEDULE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="schedule-preset-btn"
                onClick={() => void handleApplyPreset(preset)}
              >
                {t(preset.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Active days */}
        <div className="schedule-days">
          <h3>{t('scheduleActiveDays')}</h3>
          <div className="day-checkboxes">
            {DAYS_OF_WEEK.map((day) => {
              const dayKey = DAY_KEYS[day];
              return (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={schedule.activeDays.includes(day)}
                    onChange={() => void handleToggleDay(day)}
                  />
                  <span>{t(dayKey)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Time ranges */}
        <div className="schedule-time-ranges">
          <h3>{t('scheduleTimeRanges')}</h3>
          <div className="time-ranges-list">
            {timeRanges.map((range, index) => (
              <div key={index} className="time-range-item">
                <label className="time-input-group">
                  <span>{t('scheduleFrom')}</span>
                  <input
                    type="time"
                    value={formatTime(range.startHour, range.startMinute)}
                    onChange={(e) =>
                      void handleUpdateTimeRange(index, 'start', e.target.value)
                    }
                    className="time-input"
                  />
                </label>
                <label className="time-input-group">
                  <span>{t('scheduleTo')}</span>
                  <input
                    type="time"
                    value={formatTime(range.endHour, range.endMinute)}
                    onChange={(e) =>
                      void handleUpdateTimeRange(index, 'end', e.target.value)
                    }
                    className="time-input"
                  />
                </label>
                {timeRanges.length > 1 && (
                  <button
                    onClick={() => void handleRemoveTimeRange(index)}
                    className="remove-time-range-button"
                    aria-label={t('scheduleRemoveTimeRange')}
                  >
                    {t('scheduleRemoveTimeRange')}
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => void handleAddTimeRange()}
            className="add-time-range-button"
          >
            {t('scheduleAddTimeRange')}
          </button>
        </div>
      </>
    </div>
  );
}

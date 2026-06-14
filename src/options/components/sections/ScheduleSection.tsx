/**
 * Schedule settings section - Schedule config and Time Limits
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SectionHeader } from '../common/SectionHeader';
import { Schedule } from '../Schedule';
import { TimeLimitsConfig } from '../TimeLimitsConfig';

type ScheduleSubSection = 'scheduleConfig' | 'timeLimits';

interface ScheduleSectionProps {
  subSection: ScheduleSubSection;
}

export function ScheduleSection({ subSection }: ScheduleSectionProps) {
  const { t } = useI18n();

  if (subSection === 'timeLimits') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('timeLimitsTitle')}
          description={t('timeLimitsDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          }
        />
        <p className="section-hint">{t('timeLimitsHint')}</p>
        <TimeLimitsConfig />
      </div>
    );
  }

  // Default: scheduleConfig
  return (
    <div className="settings-section">
      <SectionHeader
        title={t('optionsTabSchedule')}
        description={t('scheduleDescription')}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        }
      />
      <p className="section-hint">{t('scheduleHint')}</p>
      <Schedule />
    </div>
  );
}

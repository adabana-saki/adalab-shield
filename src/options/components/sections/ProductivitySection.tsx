/**
 * Productivity settings section - Focus Mode, Pomodoro, Streak, adalab sync
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SectionHeader } from '../common/SectionHeader';
import { FocusModeSettings } from '../FocusModeSettings';
import { PomodoroSettings } from '../PomodoroSettings';
import { StreakSettings } from '../StreakSettings';
import { AdalabSettings } from '../AdalabSettings';

type ProductivitySubSection =
  | 'focusMode'
  | 'pomodoro'
  | 'streak'
  | 'adalabSync';

interface ProductivitySectionProps {
  subSection: ProductivitySubSection;
}

export function ProductivitySection({ subSection }: ProductivitySectionProps) {
  const { t } = useI18n();

  if (subSection === 'pomodoro') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('pomodoroTitle')}
          description={t('pomodoroDescription')}
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
        <PomodoroSettings />
      </div>
    );
  }

  if (subSection === 'streak') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('optionsTabStreak')}
          description={t('streakDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          }
        />
        <StreakSettings />
      </div>
    );
  }

  if (subSection === 'adalabSync') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('adalabSyncTitle')}
          description={t('adalabSyncDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <AdalabSettings />
      </div>
    );
  }

  // Default: focusMode
  return (
    <div className="settings-section">
      <SectionHeader
        title={t('focusModeTitle')}
        description={t('focusModeDescription')}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      />
      <FocusModeSettings />
    </div>
  );
}

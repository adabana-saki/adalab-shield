/**
 * Schedule setup step for onboarding
 */

import { useI18n } from '@/shared/hooks/useI18n';

interface ScheduleStepProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ScheduleStep({ enabled, onToggle }: ScheduleStepProps) {
  const { t } = useI18n();

  return (
    <div className="onboarding-step schedule-step">
      <h2 className="onboarding-title">{t('onboardingScheduleTitle')}</h2>
      <p className="onboarding-subtitle">{t('onboardingScheduleSubtitle')}</p>

      <div className="schedule-options">
        <label className={`schedule-option ${enabled ? 'selected' : ''}`}>
          <input
            type="radio"
            name="schedule"
            checked={enabled}
            onChange={() => onToggle(true)}
          />
          <div className="schedule-option-content">
            <span className="schedule-option-icon">
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
            </span>
            <div className="schedule-option-text">
              <span className="schedule-option-title">
                {t('onboardingScheduleWorkHours')}
              </span>
              <span className="schedule-option-desc">
                {t('onboardingScheduleWorkHoursDesc')}
              </span>
            </div>
          </div>
          <div className="schedule-option-check">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </label>

        <label className={`schedule-option ${!enabled ? 'selected' : ''}`}>
          <input
            type="radio"
            name="schedule"
            checked={!enabled}
            onChange={() => onToggle(false)}
          />
          <div className="schedule-option-content">
            <span className="schedule-option-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div className="schedule-option-text">
              <span className="schedule-option-title">
                {t('onboardingScheduleAlways')}
              </span>
              <span className="schedule-option-desc">
                {t('onboardingScheduleAlwaysDesc')}
              </span>
            </div>
          </div>
          <div className="schedule-option-check">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </label>
      </div>

      <p className="onboarding-hint">{t('onboardingScheduleHint')}</p>
    </div>
  );
}

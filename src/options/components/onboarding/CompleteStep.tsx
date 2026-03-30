/**
 * Complete step for onboarding
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { PlatformSettings } from '@/shared/types';

interface CompleteStepProps {
  selectedPlatforms: Partial<PlatformSettings>;
  scheduleEnabled: boolean;
}

export function CompleteStep({
  selectedPlatforms,
  scheduleEnabled,
}: CompleteStepProps) {
  const { t } = useI18n();

  const activePlatforms = Object.entries(selectedPlatforms)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);

  return (
    <div className="onboarding-step complete-step">
      <div className="complete-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="onboarding-title">{t('onboardingCompleteTitle')}</h2>
      <p className="onboarding-subtitle">{t('onboardingCompleteSubtitle')}</p>

      <div className="complete-summary">
        <div className="complete-summary-item">
          <span className="complete-summary-label">
            {t('onboardingCompletePlatforms')}
          </span>
          <div className="complete-summary-value">
            {activePlatforms.length > 0 ? (
              activePlatforms.map((platform) => (
                <span key={platform} className="complete-badge">
                  {t(
                    `popupPlatform${platform.charAt(0).toUpperCase() + platform.slice(1)}`
                  )}
                </span>
              ))
            ) : (
              <span className="complete-empty">
                {t('onboardingNoPlatforms')}
              </span>
            )}
          </div>
        </div>
        <div className="complete-summary-item">
          <span className="complete-summary-label">
            {t('onboardingCompleteSchedule')}
          </span>
          <span className="complete-summary-value">
            {scheduleEnabled
              ? t('onboardingScheduleWorkHours')
              : t('onboardingScheduleAlways')}
          </span>
        </div>
      </div>

      <div className="complete-tip">
        <span className="complete-tip-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
        <p className="complete-tip-text">{t('onboardingCompleteTip')}</p>
      </div>
    </div>
  );
}

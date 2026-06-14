/**
 * Welcome step for onboarding
 */

import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';

export function WelcomeStep() {
  const { t } = useI18n();

  return (
    <div className="onboarding-step welcome-step">
      <div className="welcome-icon">
        <img
          src={browser.runtime.getURL('icons/icon-128.png')}
          alt=""
          width={64}
          height={64}
        />
      </div>
      <h1 className="onboarding-title">{t('onboardingWelcomeTitle')}</h1>
      <p className="onboarding-subtitle">{t('onboardingWelcomeSubtitle')}</p>

      <div className="welcome-features">
        <div className="welcome-feature">
          <span className="welcome-feature-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </span>
          <span className="welcome-feature-text">
            {t('onboardingFeature1')}
          </span>
        </div>
        <div className="welcome-feature">
          <span className="welcome-feature-icon">
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
          <span className="welcome-feature-text">
            {t('onboardingFeature2')}
          </span>
        </div>
        <div className="welcome-feature">
          <span className="welcome-feature-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          <span className="welcome-feature-text">
            {t('onboardingFeature3')}
          </span>
        </div>
      </div>
    </div>
  );
}

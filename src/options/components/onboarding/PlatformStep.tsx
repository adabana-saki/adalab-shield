/**
 * Platform selection step for onboarding
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { Platform, PlatformSettings } from '@/shared/types';

interface PlatformStepProps {
  selectedPlatforms: Partial<PlatformSettings>;
  onPlatformToggle: (platform: Platform, enabled: boolean) => void;
}

const PLATFORMS: { key: Platform; labelKey: string; descriptionKey: string }[] =
  [
    {
      key: 'youtube',
      labelKey: 'popupPlatformYouTube',
      descriptionKey: 'onboardingYouTubeDesc',
    },
    {
      key: 'tiktok',
      labelKey: 'popupPlatformTikTok',
      descriptionKey: 'onboardingTikTokDesc',
    },
    {
      key: 'instagram',
      labelKey: 'popupPlatformInstagram',
      descriptionKey: 'onboardingInstagramDesc',
    },
  ];

export function PlatformStep({
  selectedPlatforms,
  onPlatformToggle,
}: PlatformStepProps) {
  const { t } = useI18n();

  return (
    <div className="onboarding-step platform-step">
      <h2 className="onboarding-title">{t('onboardingPlatformTitle')}</h2>
      <p className="onboarding-subtitle">{t('onboardingPlatformSubtitle')}</p>

      <div className="platform-cards">
        {PLATFORMS.map((platform) => (
          <label
            key={platform.key}
            className={`platform-card ${selectedPlatforms[platform.key] ? 'selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedPlatforms[platform.key] ?? false}
              onChange={(e) => onPlatformToggle(platform.key, e.target.checked)}
            />
            <div className="platform-card-content">
              <span className="platform-card-name">{t(platform.labelKey)}</span>
              <span className="platform-card-desc">
                {t(platform.descriptionKey)}
              </span>
            </div>
            <div className="platform-card-check">
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
        ))}
      </div>

      <p className="onboarding-hint">{t('onboardingPlatformHint')}</p>
    </div>
  );
}

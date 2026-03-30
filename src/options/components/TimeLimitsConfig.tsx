/**
 * Time Limits Configuration component for options page
 * Allows users to set daily time limits for each platform
 */

import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type { Platform, SiteTimeLimit } from '@/shared/types';

/** Platform display configuration - all platforms */
const PLATFORM_CONFIG: { platform: Platform; labelKey: string }[] = [
  // Short video platforms
  { platform: 'youtube', labelKey: 'platformYouTube' },
  { platform: 'tiktok', labelKey: 'platformTikTok' },
  { platform: 'instagram', labelKey: 'platformInstagram' },
  // Full site platforms
  { platform: 'youtube_full', labelKey: 'platformYouTubeFull' },
  { platform: 'instagram_full', labelKey: 'platformInstagramFull' },
  { platform: 'tiktok_full', labelKey: 'platformTikTokFull' },
  // SNS platforms
  { platform: 'twitter', labelKey: 'platformTwitter' },
  { platform: 'facebook', labelKey: 'platformFacebook' },
  { platform: 'reddit', labelKey: 'platformReddit' },
  { platform: 'linkedin', labelKey: 'platformLinkedIn' },
  { platform: 'threads', labelKey: 'platformThreads' },
  { platform: 'snapchat', labelKey: 'platformSnapchat' },
  { platform: 'discord', labelKey: 'platformDiscord' },
  { platform: 'pinterest', labelKey: 'platformPinterest' },
  { platform: 'twitch', labelKey: 'platformTwitch' },
];

/** Available time limit options in minutes */
const TIME_LIMIT_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

export function TimeLimitsConfig() {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  const handleToggleEnabled = async () => {
    await updateSettings({
      timeLimits: {
        enabled: !settings.timeLimits.enabled,
      },
    });
  };

  const handleToggleBlockWhenReached = async () => {
    await updateSettings({
      timeLimits: {
        blockWhenLimitReached: !settings.timeLimits.blockWhenLimitReached,
      },
    });
  };

  const handleWarningThresholdChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = parseInt(e.target.value, 10);
    await updateSettings({
      timeLimits: {
        warningThresholdPercent: value,
      },
    });
  };

  const handlePlatformToggle = async (platform: Platform) => {
    const currentLimits = settings.timeLimits.limits;
    const existingLimit = currentLimits.find((l) => l.platform === platform);

    let newLimits: SiteTimeLimit[];

    if (existingLimit) {
      newLimits = currentLimits.map((l) =>
        l.platform === platform ? { ...l, enabled: !l.enabled } : l
      );
    } else {
      // Create new limit with default 30 minutes
      newLimits = [
        ...currentLimits,
        { platform, dailyLimitMinutes: 30, enabled: true },
      ] as SiteTimeLimit[];
    }

    await updateSettings({
      timeLimits: {
        limits: newLimits,
      },
    });
  };

  const handleLimitChange = async (platform: Platform, minutes: number) => {
    const currentLimits = settings.timeLimits.limits;
    const existingLimit = currentLimits.find((l) => l.platform === platform);

    let newLimits: SiteTimeLimit[];

    if (existingLimit) {
      newLimits = currentLimits.map((l) =>
        l.platform === platform ? { ...l, dailyLimitMinutes: minutes } : l
      );
    } else {
      newLimits = [
        ...currentLimits,
        { platform, dailyLimitMinutes: minutes, enabled: true },
      ] as SiteTimeLimit[];
    }

    await updateSettings({
      timeLimits: {
        limits: newLimits,
      },
    });
  };

  const getLimit = (platform: Platform): SiteTimeLimit | undefined => {
    return settings.timeLimits.limits.find((l) => l.platform === platform);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} ${t('minutes')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${t('hours')}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="time-limits-config">
      <h2 className="section-title">{t('timeLimitsTitle')}</h2>
      <p className="section-description">{t('timeLimitsDescription')}</p>

      {/* Main enable toggle */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.timeLimits.enabled}
            onChange={() => void handleToggleEnabled()}
          />
          <span className="toggle-text">{t('timeLimitsEnabled')}</span>
        </label>
        <p className="setting-description">
          {t('timeLimitsEnabledDescription')}
        </p>
      </div>

      {settings.timeLimits.enabled && (
        <>
          {/* Warning threshold */}
          <div className="setting-row">
            <label className="select-label">
              <span className="label-text">
                {t('timeLimitsWarningThreshold')}
              </span>
              <select
                value={settings.timeLimits.warningThresholdPercent}
                onChange={(e) => void handleWarningThresholdChange(e)}
              >
                <option value={50}>50%</option>
                <option value={60}>60%</option>
                <option value={70}>70%</option>
                <option value={80}>80%</option>
                <option value={90}>90%</option>
              </select>
            </label>
            <p className="setting-description">
              {t('timeLimitsWarningThresholdDescription')}
            </p>
          </div>

          {/* Block when limit reached */}
          <div className="setting-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.timeLimits.blockWhenLimitReached}
                onChange={() => void handleToggleBlockWhenReached()}
              />
              <span className="toggle-text">
                {t('timeLimitsBlockWhenReached')}
              </span>
            </label>
            <p className="setting-description">
              {t('timeLimitsBlockWhenReachedDescription')}
            </p>
          </div>

          {/* Platform limits */}
          <div className="platform-limits">
            <h3 className="subsection-title">
              {t('timeLimitsPlatformLimits')}
            </h3>

            {PLATFORM_CONFIG.map(({ platform, labelKey }) => {
              const limit = getLimit(platform);
              const isEnabled = limit?.enabled ?? false;
              const minutes = limit?.dailyLimitMinutes ?? 30;

              return (
                <div key={platform} className="platform-limit-row">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => void handlePlatformToggle(platform)}
                    />
                    <span className="toggle-text platform-name">
                      {t(labelKey)}
                    </span>
                  </label>

                  {isEnabled && (
                    <select
                      value={minutes}
                      onChange={(e) =>
                        void handleLimitChange(
                          platform,
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="limit-select"
                    >
                      {TIME_LIMIT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {formatDuration(option)}
                        </option>
                      ))}
                    </select>
                  )}

                  {!isEnabled && (
                    <span className="limit-disabled">
                      {t('timeLimitsNoLimit')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

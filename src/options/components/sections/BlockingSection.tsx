/**
 * Blocking settings section - Platforms, Custom Domains
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { Settings, Platform } from '@/shared/types';
import { SectionHeader } from '../common/SectionHeader';
import { ToggleRow } from '../common/ToggleRow';
import { CustomDomains } from '../CustomDomains';
import { TimeLimitsConfig } from '../TimeLimitsConfig';

type BlockingSubSection = 'platforms' | 'customDomains' | 'timeLimits';

interface BlockingSectionProps {
  settings: Settings;
  subSection: BlockingSubSection;
  onTogglePlatform: (platform: Platform) => void;
}

export function BlockingSection({
  settings,
  subSection,
  onTogglePlatform,
}: BlockingSectionProps) {
  const { t } = useI18n();

  if (subSection === 'customDomains') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('optionsTabCustomDomains')}
          description={t('customDomainsDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />
        <CustomDomains />
      </div>
    );
  }

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
        <TimeLimitsConfig />
      </div>
    );
  }

  // Default: platforms
  return (
    <div className="settings-section">
      <SectionHeader
        title={t('optionsTabPlatforms')}
        description={t('optionsPlatformsDescription')}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        }
      />

      {/* Short Video Platforms */}
      <div className="settings-group">
        <h3 className="settings-group-title">{t('shortVideoSection')}</h3>
        <div className="settings-group-content">
          <ToggleRow
            label={t('popupPlatformYouTube')}
            description={t('platformYouTubeDescription')}
            checked={settings.platforms.youtube}
            onChange={() => onTogglePlatform('youtube')}
          />
          <ToggleRow
            label={t('popupPlatformTikTok')}
            description={t('platformTikTokDescription')}
            checked={settings.platforms.tiktok}
            onChange={() => onTogglePlatform('tiktok')}
          />
          <ToggleRow
            label={t('popupPlatformInstagram')}
            description={t('platformInstagramDescription')}
            checked={settings.platforms.instagram}
            onChange={() => onTogglePlatform('instagram')}
          />
        </div>
      </div>

      {/* Full Site Blocking */}
      <div className="settings-group">
        <h3 className="settings-group-title">{t('fullSiteBlockingSection')}</h3>
        <div className="settings-group-content">
          <ToggleRow
            label={t('platformYouTubeFull')}
            description={t('platformYouTubeFullDescription')}
            checked={settings.platforms.youtube_full}
            onChange={() => onTogglePlatform('youtube_full')}
          />
          <ToggleRow
            label={t('platformInstagramFull')}
            description={t('platformInstagramFullDescription')}
            checked={settings.platforms.instagram_full}
            onChange={() => onTogglePlatform('instagram_full')}
          />
          <ToggleRow
            label={t('platformTikTokFull')}
            description={t('platformTikTokFullDescription')}
            checked={settings.platforms.tiktok_full}
            onChange={() => onTogglePlatform('tiktok_full')}
          />
        </div>
      </div>

      {/* SNS Platforms */}
      <div className="settings-group">
        <h3 className="settings-group-title">{t('popupSectionSNS')}</h3>
        <div className="settings-group-content">
          <ToggleRow
            label={t('popupPlatformTwitter')}
            checked={settings.platforms.twitter}
            onChange={() => onTogglePlatform('twitter')}
          />
          <ToggleRow
            label={t('popupPlatformFacebook')}
            checked={settings.platforms.facebook}
            onChange={() => onTogglePlatform('facebook')}
          />
          <ToggleRow
            label={t('popupPlatformDiscord')}
            checked={settings.platforms.discord}
            onChange={() => onTogglePlatform('discord')}
          />
          <ToggleRow
            label={t('popupPlatformReddit')}
            checked={settings.platforms.reddit}
            onChange={() => onTogglePlatform('reddit')}
          />
          <ToggleRow
            label={t('popupPlatformTwitch')}
            checked={settings.platforms.twitch}
            onChange={() => onTogglePlatform('twitch')}
          />
          <ToggleRow
            label={t('popupPlatformLinkedIn')}
            checked={settings.platforms.linkedin}
            onChange={() => onTogglePlatform('linkedin')}
          />
          <ToggleRow
            label={t('popupPlatformThreads')}
            checked={settings.platforms.threads}
            onChange={() => onTogglePlatform('threads')}
          />
          <ToggleRow
            label={t('popupPlatformPinterest')}
            checked={settings.platforms.pinterest}
            onChange={() => onTogglePlatform('pinterest')}
          />
          <ToggleRow
            label={t('popupPlatformSnapchat')}
            checked={settings.platforms.snapchat}
            onChange={() => onTogglePlatform('snapchat')}
          />
        </div>
      </div>
    </div>
  );
}

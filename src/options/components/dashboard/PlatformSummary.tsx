/**
 * Platform summary component showing active platforms
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { PlatformSettings, Platform } from '@/shared/types';

interface PlatformSummaryProps {
  platforms: PlatformSettings;
  onEditClick: () => void;
}

const PLATFORM_INFO: { key: Platform; emoji: string; labelKey: string }[] = [
  { key: 'youtube', emoji: '', labelKey: 'popupPlatformYouTube' },
  { key: 'tiktok', emoji: '', labelKey: 'popupPlatformTikTok' },
  { key: 'instagram', emoji: '', labelKey: 'popupPlatformInstagram' },
  { key: 'youtube_full', emoji: '', labelKey: 'popupPlatformYouTubeFull' },
  { key: 'twitter', emoji: '', labelKey: 'popupPlatformTwitter' },
  { key: 'facebook', emoji: '', labelKey: 'popupPlatformFacebook' },
  { key: 'linkedin', emoji: '', labelKey: 'popupPlatformLinkedIn' },
  { key: 'threads', emoji: '', labelKey: 'popupPlatformThreads' },
  { key: 'snapchat', emoji: '', labelKey: 'popupPlatformSnapchat' },
  { key: 'reddit', emoji: '', labelKey: 'popupPlatformReddit' },
];

export function PlatformSummary({
  platforms,
  onEditClick,
}: PlatformSummaryProps) {
  const { t } = useI18n();

  const activePlatforms = PLATFORM_INFO.filter((p) => platforms[p.key]);
  const inactivePlatforms = PLATFORM_INFO.filter((p) => !platforms[p.key]);

  return (
    <div className="platform-summary">
      <div className="platform-summary-header">
        <h3 className="platform-summary-title">
          {t('dashboardActivePlatforms')}
        </h3>
        <button
          type="button"
          className="platform-summary-edit"
          onClick={onEditClick}
        >
          {t('dashboardEdit')}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </div>

      {activePlatforms.length === 0 ? (
        <p className="platform-summary-empty">{t('dashboardNoPlatforms')}</p>
      ) : (
        <div className="platform-summary-list">
          {activePlatforms.map((p) => (
            <span key={p.key} className="platform-badge platform-badge-active">
              {t(p.labelKey)}
            </span>
          ))}
          {inactivePlatforms.length > 0 && (
            <span className="platform-badge platform-badge-more">
              +{inactivePlatforms.length} {t('dashboardMore')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

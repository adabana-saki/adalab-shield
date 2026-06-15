/**
 * Blocked-by-platform breakdown card.
 * Visualizes the per-platform block counts the extension already tracks
 * (settings.stats.byPlatform) as a ranked horizontal bar chart.
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { BlockingStats, Platform } from '@/shared/types';

interface BlockedBreakdownProps {
  stats: BlockingStats;
  onViewReports?: () => void;
}

const PLATFORM_META: { platform: Platform; labelKey: string; color: string }[] =
  [
    { platform: 'youtube', labelKey: 'popupPlatformYouTube', color: '#FF0000' },
    { platform: 'tiktok', labelKey: 'popupPlatformTikTok', color: '#25F4EE' },
    {
      platform: 'instagram',
      labelKey: 'popupPlatformInstagram',
      color: '#E1306C',
    },
    {
      platform: 'youtube_full',
      labelKey: 'popupPlatformYouTubeFull',
      color: '#CC0000',
    },
    {
      platform: 'instagram_full',
      labelKey: 'platformInstagramFull',
      color: '#C13584',
    },
    {
      platform: 'tiktok_full',
      labelKey: 'platformTikTokFull',
      color: '#69C9D0',
    },
    { platform: 'twitter', labelKey: 'popupPlatformTwitter', color: '#1DA1F2' },
    {
      platform: 'facebook',
      labelKey: 'popupPlatformFacebook',
      color: '#4267B2',
    },
    {
      platform: 'linkedin',
      labelKey: 'popupPlatformLinkedIn',
      color: '#0A66C2',
    },
    { platform: 'threads', labelKey: 'popupPlatformThreads', color: '#000000' },
    {
      platform: 'snapchat',
      labelKey: 'popupPlatformSnapchat',
      color: '#FFFC00',
    },
    { platform: 'reddit', labelKey: 'popupPlatformReddit', color: '#FF4500' },
    { platform: 'discord', labelKey: 'popupPlatformDiscord', color: '#5865F2' },
    {
      platform: 'pinterest',
      labelKey: 'popupPlatformPinterest',
      color: '#E60023',
    },
    { platform: 'twitch', labelKey: 'popupPlatformTwitch', color: '#9146FF' },
  ];

export function BlockedBreakdown({
  stats,
  onViewReports,
}: BlockedBreakdownProps) {
  const { t, formatNumber } = useI18n();

  const rows = PLATFORM_META.map((meta) => ({
    ...meta,
    count: stats.byPlatform[meta.platform] ?? 0,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const max = rows.length > 0 ? rows[0]!.count : 0;

  return (
    <div className="dashboard-card blocked-breakdown">
      <div className="blocked-breakdown-header">
        <h3 className="blocked-breakdown-title">
          {t('dashboardBlockedBreakdown')}
        </h3>
        {onViewReports && rows.length > 0 && (
          <button
            type="button"
            className="platform-summary-edit"
            onClick={onViewReports}
          >
            {t('viewDetails')}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="blocked-breakdown-empty">
          {t('dashboardBlockedBreakdownEmpty')}
        </p>
      ) : (
        <ul className="blocked-breakdown-list">
          {rows.map((row) => (
            <li key={row.platform} className="blocked-breakdown-row">
              <span className="blocked-breakdown-label">{t(row.labelKey)}</span>
              <span className="blocked-breakdown-track">
                <span
                  className="blocked-breakdown-bar"
                  style={{
                    width: `${max > 0 ? Math.max((row.count / max) * 100, 4) : 0}%`,
                    backgroundColor: row.color,
                  }}
                />
              </span>
              <span className="blocked-breakdown-count">
                {formatNumber(row.count)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

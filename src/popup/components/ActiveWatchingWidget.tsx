/**
 * Active watching widget - shows realtime viewing status
 */

import { useState, useEffect } from 'react';
import { useI18n } from '@/shared/hooks/useI18n';
import type { SiteTimeUsage, Platform } from '@/shared/types';

interface ActiveWatchingWidgetProps {
  activeUsage: SiteTimeUsage | null;
}

/**
 * Format duration in milliseconds to human readable string (mm:ss or hh:mm:ss)
 */
function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get platform display name translation key
 */
function getPlatformLabelKey(platform: Platform): string {
  const platformKeyMap: Record<Platform, string> = {
    youtube: 'platformYouTube',
    tiktok: 'platformTikTok',
    instagram: 'platformInstagram',
    youtube_full: 'platformYouTubeFull',
    tiktok_full: 'platformTikTokFull',
    instagram_full: 'platformInstagramFull',
    twitter: 'platformTwitter',
    facebook: 'platformFacebook',
    linkedin: 'platformLinkedIn',
    threads: 'platformThreads',
    snapchat: 'platformSnapchat',
    reddit: 'platformReddit',
    discord: 'platformDiscord',
    pinterest: 'platformPinterest',
    twitch: 'platformTwitch',
  };

  return platformKeyMap[platform] ?? platform;
}

/**
 * Threshold in ms to consider a platform as "actively watching"
 * 60 seconds = 60000ms
 */
const ACTIVE_THRESHOLD_MS = 60000;

export function ActiveWatchingWidget({
  activeUsage,
}: ActiveWatchingWidgetProps) {
  const { t } = useI18n();
  const [elapsedMs, setElapsedMs] = useState(
    () => activeUsage?.usedTodayMs ?? 0
  );

  useEffect(() => {
    if (
      activeUsage?.lastActiveAt === null ||
      activeUsage?.lastActiveAt === undefined
    ) {
      return;
    }

    // Update elapsed time every second
    const updateElapsed = () => {
      if (
        activeUsage.lastActiveAt !== null &&
        activeUsage.lastActiveAt !== undefined
      ) {
        // Calculate time since session started (approximation)
        // We use usedTodayMs as the base and don't add real-time delta here
        // since the parent component polls every second
        setElapsedMs(activeUsage.usedTodayMs);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeUsage]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const timeSinceLastActive =
    activeUsage?.lastActiveAt !== null &&
    activeUsage?.lastActiveAt !== undefined
      ? now - activeUsage.lastActiveAt
      : Infinity;

  // Don't render if no active usage or not recently active
  if (
    activeUsage?.lastActiveAt === null ||
    activeUsage?.lastActiveAt === undefined
  ) {
    return null;
  }

  if (timeSinceLastActive > ACTIVE_THRESHOLD_MS) {
    return null;
  }

  return (
    <div className="active-watching-widget">
      <div className="active-watching-header">
        <span className="pulse-dot" />
        <span className="active-watching-label">{t('watchingNow')}</span>
      </div>
      <div className="active-watching-content">
        <span className="active-watching-platform">
          {t(getPlatformLabelKey(activeUsage.platform))}
        </span>
        <span className="active-watching-time">
          {formatElapsedTime(elapsedMs)}
        </span>
      </div>
    </div>
  );
}

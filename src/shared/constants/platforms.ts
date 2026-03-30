/**
 * Platform detection patterns and configurations
 * Security: All patterns are readonly and validated at compile time
 */

import type {
  Platform,
  PlatformRules,
  ShortVideoPlatform,
  SNSPlatform,
} from '@/shared/types';

/**
 * List of short video platforms
 */
export const SHORT_VIDEO_PLATFORMS: readonly ShortVideoPlatform[] = [
  'youtube',
  'tiktok',
  'instagram',
] as const;

/**
 * List of SNS platforms
 */
export const SNS_PLATFORMS: readonly SNSPlatform[] = [
  'twitter',
  'facebook',
  'linkedin',
  'threads',
  'snapchat',
  'reddit',
  'discord',
  'pinterest',
  'twitch',
] as const;

/**
 * YouTube Shorts detection configuration
 */
export const YOUTUBE_CONFIG: PlatformRules = {
  platform: 'youtube',
  hosts: ['www.youtube.com', 'youtube.com', 'm.youtube.com'],
  urlRules: [
    {
      type: 'url',
      pattern: '^\\/shorts\\/[\\w-]+',
      action: 'redirect',
      priority: 100,
    },
  ],
  selectorRules: [
    {
      type: 'selector',
      selector: 'ytd-reel-video-renderer',
      action: 'hide',
      priority: 90,
    },
    {
      type: 'selector',
      selector: 'ytd-rich-item-renderer[is-shorts]',
      action: 'hide',
      priority: 90,
    },
    {
      type: 'selector',
      selector: 'ytd-rich-shelf-renderer[is-shorts]',
      action: 'hide',
      priority: 85,
    },
    {
      type: 'selector',
      selector: 'ytd-video-renderer[is-shorts]',
      action: 'hide',
      priority: 85,
    },
    {
      type: 'selector',
      selector: 'ytd-grid-video-renderer[is-shorts]',
      action: 'hide',
      priority: 85,
    },
    {
      type: 'selector',
      selector: '[overlay-style="SHORTS"]',
      action: 'hide',
      priority: 80,
      parentSelector: 'ytd-rich-item-renderer',
    },
  ],
  attributeRules: [
    {
      type: 'attribute',
      selector: 'a[href]',
      attribute: 'href',
      pattern: '^\\/shorts\\/',
      action: 'hide',
      priority: 70,
    },
  ],
} as const;

/**
 * TikTok detection configuration
 */
export const TIKTOK_CONFIG: PlatformRules = {
  platform: 'tiktok',
  hosts: ['www.tiktok.com', 'tiktok.com'],
  urlRules: [
    {
      type: 'url',
      pattern: '^\\/@[\\w.-]+\\/video\\/\\d+',
      action: 'hide',
      priority: 100,
    },
    {
      type: 'url',
      pattern: '^\\/foryou',
      action: 'hide',
      priority: 95,
    },
  ],
  selectorRules: [
    {
      type: 'selector',
      selector: '[data-e2e="recommend-list-item-container"]',
      action: 'hide',
      priority: 90,
    },
    {
      type: 'selector',
      selector: '[class*="DivItemContainer"]',
      action: 'hide',
      priority: 85,
    },
  ],
  attributeRules: [],
} as const;

/**
 * Instagram Reels detection configuration
 */
export const INSTAGRAM_CONFIG: PlatformRules = {
  platform: 'instagram',
  hosts: ['www.instagram.com', 'instagram.com'],
  urlRules: [
    {
      type: 'url',
      pattern: '^\\/reels\\/',
      action: 'hide',
      priority: 100,
    },
    {
      type: 'url',
      pattern: '^\\/reel\\/',
      action: 'hide',
      priority: 100,
    },
  ],
  selectorRules: [
    {
      type: 'selector',
      selector: 'a[href*="/reels/"]',
      action: 'hide',
      priority: 90,
      parentSelector: 'article',
    },
    {
      type: 'selector',
      selector: 'a[href*="/reel/"]',
      action: 'hide',
      priority: 90,
      parentSelector: 'article',
    },
  ],
  attributeRules: [],
} as const;

/**
 * Twitter/X detection configuration (full site block)
 */
export const TWITTER_CONFIG: PlatformRules = {
  platform: 'twitter',
  hosts: [
    'twitter.com',
    'www.twitter.com',
    'x.com',
    'www.x.com',
    'mobile.twitter.com',
    'mobile.x.com',
  ],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * Facebook detection configuration (full site block)
 */
export const FACEBOOK_CONFIG: PlatformRules = {
  platform: 'facebook',
  hosts: [
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'web.facebook.com',
  ],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * LinkedIn detection configuration (full site block)
 */
export const LINKEDIN_CONFIG: PlatformRules = {
  platform: 'linkedin',
  hosts: ['linkedin.com', 'www.linkedin.com'],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * Threads detection configuration (full site block)
 */
export const THREADS_CONFIG: PlatformRules = {
  platform: 'threads',
  hosts: ['threads.net', 'www.threads.net'],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * Snapchat detection configuration (full site block)
 */
export const SNAPCHAT_CONFIG: PlatformRules = {
  platform: 'snapchat',
  hosts: ['snapchat.com', 'www.snapchat.com', 'web.snapchat.com'],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * Reddit detection configuration (full site block)
 */
export const REDDIT_CONFIG: PlatformRules = {
  platform: 'reddit',
  hosts: ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com'],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * Discord detection configuration (full site block)
 */
export const DISCORD_CONFIG: PlatformRules = {
  platform: 'discord',
  hosts: [
    'discord.com',
    'www.discord.com',
    'discordapp.com',
    'www.discordapp.com',
  ],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * Pinterest detection configuration (full site block)
 */
export const PINTEREST_CONFIG: PlatformRules = {
  platform: 'pinterest',
  hosts: [
    'pinterest.com',
    'www.pinterest.com',
    'jp.pinterest.com',
    'pinterest.jp',
  ],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * Twitch detection configuration (full site block)
 */
export const TWITCH_CONFIG: PlatformRules = {
  platform: 'twitch',
  hosts: ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'],
  urlRules: [],
  selectorRules: [],
  attributeRules: [],
} as const;

/**
 * All platform configurations
 */
export const PLATFORM_CONFIGS: Readonly<Record<Platform, PlatformRules>> = {
  // Short video platforms
  youtube: YOUTUBE_CONFIG,
  tiktok: TIKTOK_CONFIG,
  instagram: INSTAGRAM_CONFIG,
  // Full site blockers (uses same config as parent platform)
  youtube_full: YOUTUBE_CONFIG,
  instagram_full: INSTAGRAM_CONFIG,
  tiktok_full: TIKTOK_CONFIG,
  // SNS platforms
  twitter: TWITTER_CONFIG,
  facebook: FACEBOOK_CONFIG,
  linkedin: LINKEDIN_CONFIG,
  threads: THREADS_CONFIG,
  snapchat: SNAPCHAT_CONFIG,
  reddit: REDDIT_CONFIG,
  discord: DISCORD_CONFIG,
  pinterest: PINTEREST_CONFIG,
  twitch: TWITCH_CONFIG,
} as const;

/**
 * Get platform config by hostname
 */
export function getPlatformByHostname(
  hostname: string
): PlatformRules | undefined {
  for (const config of Object.values(PLATFORM_CONFIGS)) {
    if (config.hosts.includes(hostname)) {
      return config;
    }
  }
  return undefined;
}

/**
 * Check if hostname belongs to a supported platform
 */
export function isSupportedHostname(hostname: string): boolean {
  return getPlatformByHostname(hostname) !== undefined;
}

/**
 * Get all supported hostnames
 */
export function getAllSupportedHostnames(): readonly string[] {
  return Object.values(PLATFORM_CONFIGS).flatMap((config) => config.hosts);
}

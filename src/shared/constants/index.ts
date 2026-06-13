/**
 * Central export for all constants
 */

// Platform configurations
export {
  SHORT_VIDEO_PLATFORMS,
  SNS_PLATFORMS,
  YOUTUBE_CONFIG,
  TIKTOK_CONFIG,
  INSTAGRAM_CONFIG,
  TWITTER_CONFIG,
  FACEBOOK_CONFIG,
  LINKEDIN_CONFIG,
  THREADS_CONFIG,
  SNAPCHAT_CONFIG,
  REDDIT_CONFIG,
  DISCORD_CONFIG,
  PINTEREST_CONFIG,
  TWITCH_CONFIG,
  PLATFORM_CONFIGS,
  getPlatformByHostname,
  isSupportedHostname,
  getAllSupportedHostnames,
} from './platforms';

// Default settings
export {
  SETTINGS_VERSION,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_STATS,
  DEFAULT_PREFERENCES,
  DEFAULT_SCHEDULE,
  DEFAULT_BLOCK_PAGE,
  DEFAULT_FOCUS_MODE,
  DEFAULT_FOCUS_STATE,
  DEFAULT_POMODORO,
  DEFAULT_POMODORO_STATE,
  DEFAULT_TIME_LIMITS,
  DEFAULT_TIME_LIMITS_STATE,
  DEFAULT_TIME_TRACKING,
  DEFAULT_TIME_TRACKING_STATE,
  DEFAULT_CHALLENGE,
  DEFAULT_CHALLENGE_STATE,
  CHALLENGE_BYPASS_DURATION_SECONDS,
  CHALLENGE_EXPIRATION_SECONDS,
  DEFAULT_LOCKDOWN,
  DEFAULT_LOCKDOWN_STATE,
  DEFAULT_SETTINGS,
  LIMITS,
  PERFORMANCE,
} from './defaults';

// Locales
export type { SupportedLocale, LocaleInfo } from './locales';
export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getLocaleInfo,
  isSupportedLocale,
  getLocales,
  normalizeLocale,
} from './locales';

// Storage keys
export type { StorageKey } from './storage-keys';
export { STORAGE_KEYS, getAllStorageKeys } from './storage-keys';

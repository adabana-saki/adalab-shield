/**
 * Core settings types for ShortShield
 * All types use readonly properties for immutability
 */

/**
 * Branded type for type-safe identifiers
 */
export type ChannelId = string & { readonly __brand: 'ChannelId' };
export type VideoId = string & { readonly __brand: 'VideoId' };
export type CustomDomainId = string & { readonly __brand: 'CustomDomainId' };

/**
 * Short-form video platforms
 */
export type ShortVideoPlatform = 'youtube' | 'tiktok' | 'instagram';

/**
 * Full site blocking platforms
 */
export type FullSitePlatform =
  | 'youtube_full'
  | 'instagram_full'
  | 'tiktok_full';

/**
 * Major SNS platforms for quick-block
 */
export type SNSPlatform =
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'threads'
  | 'snapchat'
  | 'reddit'
  | 'discord'
  | 'pinterest'
  | 'twitch';

/**
 * All supported platforms for blocking
 */
export type Platform = ShortVideoPlatform | FullSitePlatform | SNSPlatform;

/**
 * Short video platform settings
 */
export interface ShortVideoPlatformSettings {
  readonly youtube: boolean;
  readonly tiktok: boolean;
  readonly instagram: boolean;
}

/**
 * Full site platform settings
 */
export interface FullSitePlatformSettings {
  readonly youtube_full: boolean;
  readonly instagram_full: boolean;
  readonly tiktok_full: boolean;
}

/**
 * SNS platform settings
 */
export interface SNSPlatformSettings {
  readonly twitter: boolean;
  readonly facebook: boolean;
  readonly linkedin: boolean;
  readonly threads: boolean;
  readonly snapchat: boolean;
  readonly reddit: boolean;
  readonly discord: boolean;
  readonly pinterest: boolean;
  readonly twitch: boolean;
}

/**
 * Platform-specific settings (all platforms)
 */
export interface PlatformSettings
  extends
    ShortVideoPlatformSettings,
    FullSitePlatformSettings,
    SNSPlatformSettings {}

/**
 * Blocking statistics
 */
export interface BlockingStats {
  readonly blockedToday: number;
  readonly blockedTotal: number;
  readonly lastResetDate: string; // ISO date string YYYY-MM-DD
  readonly byPlatform: Readonly<Record<Platform, number>>;
}

/**
 * Popup view options
 */
export type PopupView = 'platforms' | 'schedule' | 'stats' | 'focus';

/**
 * Supported languages
 */
export type SupportedLanguage =
  | 'auto'
  | 'en'
  | 'ja'
  | 'de'
  | 'es'
  | 'fr'
  | 'ko'
  | 'pt_BR'
  | 'zh_CN'
  | 'zh_TW';

/**
 * User preferences
 */
export interface UserPreferences {
  readonly showStats: boolean;
  readonly showNotifications: boolean;
  readonly redirectShortsToRegular: boolean;
  readonly popupDefaultView: PopupView;
  readonly language: SupportedLanguage;
}

/**
 * Day of week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Time range for schedule
 */
export interface TimeRange {
  readonly startHour: number; // 0-23
  readonly startMinute: number; // 0-59
  readonly endHour: number; // 0-23
  readonly endMinute: number; // 0-59
}

/**
 * Schedule configuration for time-based blocking
 */
export interface ScheduleConfig {
  readonly enabled: boolean;
  readonly activeDays: readonly DayOfWeek[]; // Days when schedule is active
  readonly timeRanges: readonly TimeRange[]; // Time ranges when blocking is active
}

/**
 * Block page theme options
 */
export type BlockPageTheme = 'dark' | 'light' | 'system';

/**
 * Block page customization settings
 */
export interface BlockPageSettings {
  readonly title: string;
  readonly message: string;
  readonly showMotivationalQuote: boolean;
  readonly customQuotes: readonly string[];
  readonly theme: BlockPageTheme;
  readonly primaryColor: string;
  readonly showBypassButton: boolean;
}

/**
 * Custom blocked domain entry
 */
export interface CustomBlockedDomain {
  readonly id: CustomDomainId;
  readonly domain: string;
  readonly createdAt: number;
  readonly description?: string;
}

/**
 * Focus mode duration options (in minutes)
 */
export type FocusDuration = 30 | 60 | 120;

/**
 * Focus mode settings
 */
export interface FocusModeSettings {
  readonly enabled: boolean;
  readonly softLock: boolean; // If false, focus mode cannot be cancelled early
  readonly defaultDuration: FocusDuration;
  readonly enableNotifications: boolean;
}

/**
 * Focus mode runtime state
 */
export interface FocusModeState {
  readonly isActive: boolean;
  readonly endTime: number | null; // Unix timestamp when focus ends
  readonly duration: FocusDuration | null;
  readonly startedAt: number | null; // Unix timestamp when focus started
}

/**
 * Pomodoro timer mode
 */
export type PomodoroMode = 'work' | 'break' | 'longBreak' | 'idle';

/**
 * Pomodoro timer settings
 */
export interface PomodoroSettings {
  readonly enabled: boolean;
  readonly workDurationMinutes: number; // Default: 25
  readonly breakDurationMinutes: number; // Default: 5
  readonly longBreakDurationMinutes: number; // Default: 15
  readonly sessionsBeforeLongBreak: number; // Default: 4
  readonly autoStartBreaks: boolean;
  readonly autoStartWork: boolean;
  readonly soundEnabled: boolean;
}

/**
 * Pomodoro timer runtime state
 */
export interface PomodoroState {
  readonly isRunning: boolean;
  readonly mode: PomodoroMode;
  readonly timeRemainingMs: number;
  readonly sessionCount: number; // Completed work sessions
  readonly startedAt: number | null;
  readonly endTime: number | null;
}

/**
 * Individual site time limit configuration
 */
export interface SiteTimeLimit {
  readonly platform: Platform;
  readonly dailyLimitMinutes: number;
  readonly enabled: boolean;
}

/**
 * Site time usage tracking data
 */
export interface SiteTimeUsage {
  readonly platform: Platform;
  readonly usedTodayMs: number;
  readonly lastActiveAt: number | null;
  readonly date: string; // ISO date string YYYY-MM-DD
}

/**
 * Time limits settings for all platforms
 */
export interface TimeLimitsSettings {
  readonly enabled: boolean;
  readonly limits: readonly SiteTimeLimit[];
  readonly warningThresholdPercent: number; // Show warning at this % (e.g., 80%)
  readonly blockWhenLimitReached: boolean; // Block content when time limit reached
}

/**
 * Time limits runtime state - tracks usage across all platforms
 */
export interface TimeLimitsState {
  readonly usage: readonly SiteTimeUsage[];
  readonly lastResetDate: string; // ISO date string YYYY-MM-DD
}

/**
 * Daily time record for historical tracking
 */
export interface DailyTimeRecord {
  readonly date: string; // ISO date string YYYY-MM-DD
  readonly byPlatform: Readonly<Partial<Record<Platform, number>>>; // ms per platform
  readonly totalMs: number;
}

/**
 * Time tracking settings
 */
export interface TimeTrackingSettings {
  readonly enabled: boolean;
  readonly retentionDays: number; // How many days to keep history (default: 90)
}

/**
 * Time tracking history state
 */
export interface TimeTrackingState {
  readonly history: readonly DailyTimeRecord[];
  readonly lastUpdated: number | null; // Unix timestamp
}

/**
 * Challenge difficulty levels
 */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Challenge types
 */
export type ChallengeType = 'math' | 'typing' | 'pattern';

/**
 * Challenge mode settings
 */
export interface ChallengeSettings {
  readonly enabled: boolean;
  readonly difficulty: ChallengeDifficulty;
  readonly challengeType: ChallengeType;
  readonly cooldownSeconds: number; // Cooldown between bypass attempts
  readonly disableBypassEntirely: boolean; // If true, no bypass is possible
}

/**
 * Challenge data structure
 */
export interface ChallengeData {
  readonly type: ChallengeType;
  readonly difficulty: ChallengeDifficulty;
  readonly question: string;
  readonly answer: string;
  readonly expiresAt: number; // Unix timestamp
}

/**
 * Challenge state
 */
export interface ChallengeState {
  readonly lastBypassAt: number | null; // Unix timestamp of last successful bypass
  readonly failedAttempts: number;
  readonly currentChallenge: ChallengeData | null;
}

/**
 * Lockdown mode settings
 */
export interface LockdownSettings {
  readonly enabled: boolean;
  readonly pinHash: string | null; // SHA-256 hash of PIN (null if not set)
  readonly emergencyBypassMinutes: number; // Time delay for emergency bypass (default: 30)
}

/**
 * Lockdown mode state
 */
export interface LockdownState {
  readonly isActive: boolean;
  readonly activatedAt: number | null; // Unix timestamp when lockdown started
  readonly emergencyBypassRequestedAt: number | null; // Unix timestamp when emergency bypass was requested
}

// Re-export CommitmentLock types for convenience
export type {
  CommitmentLockSettings,
  CommitmentLockState,
  CommitmentLockLevel,
  UnlockAttempt,
  UnlockHistory,
  UnlockCheckResult,
  UnlockFlowStep,
  UnlockFlowState,
  UnlockFailureReason,
  PremiumState,
  PremiumFeature,
  CommitmentLockStats,
} from './commitmentLock';

// Import CommitmentLockSettings for use in Settings interface
import type { CommitmentLockSettings } from './commitmentLock';

/**
 * Main settings interface
 */
export interface Settings {
  readonly enabled: boolean;
  readonly platforms: PlatformSettings;
  readonly customDomains: readonly CustomBlockedDomain[];
  /** Hosts the user always allows — exempt from all blocking */
  readonly allowlist: readonly string[];
  readonly schedule: ScheduleConfig;
  readonly stats: BlockingStats;
  readonly preferences: UserPreferences;
  readonly blockPage: BlockPageSettings;
  readonly focusMode: FocusModeSettings;
  readonly pomodoro: PomodoroSettings;
  readonly timeLimits: TimeLimitsSettings;
  readonly timeTracking: TimeTrackingSettings;
  readonly challenge: ChallengeSettings;
  readonly lockdown: LockdownSettings;
  readonly commitmentLock: CommitmentLockSettings;
  readonly adalabSync: AdalabSyncSettings;
  /** Unix ms until which all blocking is temporarily paused (snooze), or null */
  readonly snoozeUntil: number | null;
  readonly onboardingCompleted: boolean; // Whether user has completed initial setup
  readonly version: number; // Schema version for migrations
}

/**
 * adalab study integration settings
 */
export interface AdalabSyncSettings {
  /** Sync the adalab study pomodoro into blocking (work = block, break = unblock) */
  readonly enabled: boolean;
}

/**
 * Partial settings for updates
 */
export type SettingsUpdate = Partial<{
  enabled: boolean;
  platforms: Partial<PlatformSettings>;
  preferences: Partial<UserPreferences>;
  customDomains: readonly CustomBlockedDomain[];
  allowlist: readonly string[];
  schedule: Partial<ScheduleConfig>;
  stats: Partial<BlockingStats>; // Internal use only for stat resets
  blockPage: Partial<BlockPageSettings>;
  focusMode: Partial<FocusModeSettings>;
  pomodoro: Partial<PomodoroSettings>;
  timeLimits: Partial<TimeLimitsSettings>;
  timeTracking: Partial<TimeTrackingSettings>;
  challenge: Partial<ChallengeSettings>;
  lockdown: Partial<LockdownSettings>;
  commitmentLock: Partial<CommitmentLockSettings>;
  adalabSync: Partial<AdalabSyncSettings>;
  snoozeUntil: number | null;
  onboardingCompleted: boolean;
}>;

/**
 * Type guard for Settings validation
 */
export function isValidSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.enabled === 'boolean' &&
    typeof obj.platforms === 'object' &&
    obj.platforms !== null &&
    typeof obj.version === 'number'
  );
}

/**
 * Type guard for CustomBlockedDomain validation
 */
export function isValidCustomBlockedDomain(
  value: unknown
): value is CustomBlockedDomain {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.domain === 'string' &&
    obj.domain.length > 0 &&
    typeof obj.createdAt === 'number'
  );
}

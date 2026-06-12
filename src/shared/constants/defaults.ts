/**
 * Default settings and configurations
 */

import type {
  Settings,
  PlatformSettings,
  BlockingStats,
  UserPreferences,
  ScheduleConfig,
  BlockPageSettings,
  FocusModeSettings,
  FocusModeState,
  PomodoroSettings,
  PomodoroState,
  TimeLimitsSettings,
  TimeLimitsState,
  TimeTrackingSettings,
  TimeTrackingState,
  StreakSettings,
  StreakData,
  ChallengeSettings,
  ChallengeState,
  LockdownSettings,
  LockdownState,
} from '@/shared/types';
import type {
  CommitmentLockSettings,
  CommitmentLockState,
  UnlockHistory,
  PremiumState,
} from '@/shared/types/commitmentLock';
import { getLocalDateString } from '@/shared/utils/date';

/**
 * Current settings schema version
 * Increment when making breaking changes to settings structure
 */
export const SETTINGS_VERSION = 1;

/**
 * Default platform settings
 * Short video platforms enabled by default, SNS platforms disabled
 */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  // Short video platforms - enabled by default
  youtube: true,
  tiktok: true,
  instagram: true,
  // Full site blocking - disabled by default
  youtube_full: false,
  instagram_full: false,
  tiktok_full: false,
  // SNS platforms - disabled by default
  twitter: false,
  facebook: false,
  linkedin: false,
  threads: false,
  snapchat: false,
  reddit: false,
  discord: false,
  pinterest: false,
  twitch: false,
} as const;

/**
 * Default blocking statistics
 */
export const DEFAULT_STATS: BlockingStats = {
  blockedToday: 0,
  blockedTotal: 0,
  lastResetDate: getLocalDateString(),
  byPlatform: {
    youtube: 0,
    tiktok: 0,
    instagram: 0,
    youtube_full: 0,
    instagram_full: 0,
    tiktok_full: 0,
    twitter: 0,
    facebook: 0,
    linkedin: 0,
    threads: 0,
    snapchat: 0,
    reddit: 0,
    discord: 0,
    pinterest: 0,
    twitch: 0,
  },
} as const;

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  showStats: true,
  showNotifications: false,
  redirectShortsToRegular: false,
  popupDefaultView: 'schedule',
  language: 'auto',
} as const;

/**
 * Default schedule configuration (disabled by default)
 */
export const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: false,
  activeDays: [1, 2, 3, 4, 5], // Monday to Friday
  timeRanges: [
    {
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
    },
  ],
} as const;

/**
 * Default block page settings
 */
export const DEFAULT_BLOCK_PAGE: BlockPageSettings = {
  title: '',
  message: '',
  showMotivationalQuote: true,
  customQuotes: [],
  theme: 'system',
  primaryColor: '#3b82f6',
  showBypassButton: false,
} as const;

/**
 * Default focus mode settings
 */
export const DEFAULT_FOCUS_MODE: FocusModeSettings = {
  enabled: true,
  softLock: true, // Allow early cancellation by default
  defaultDuration: 30, // 30 minutes default
  enableNotifications: true,
} as const;

/**
 * Default focus mode state (inactive)
 */
export const DEFAULT_FOCUS_STATE: FocusModeState = {
  isActive: false,
  endTime: null,
  duration: null,
  startedAt: null,
} as const;

/**
 * Default Pomodoro timer settings
 */
export const DEFAULT_POMODORO: PomodoroSettings = {
  enabled: true,
  workDurationMinutes: 25,
  breakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
} as const;

/**
 * Default Pomodoro state (idle)
 */
export const DEFAULT_POMODORO_STATE: PomodoroState = {
  isRunning: false,
  mode: 'idle',
  timeRemainingMs: 0,
  sessionCount: 0,
  startedAt: null,
  endTime: null,
} as const;

/**
 * Default time limits settings
 */
export const DEFAULT_TIME_LIMITS: TimeLimitsSettings = {
  enabled: false,
  limits: [
    { platform: 'youtube', dailyLimitMinutes: 60, enabled: false },
    { platform: 'tiktok', dailyLimitMinutes: 30, enabled: false },
    { platform: 'instagram', dailyLimitMinutes: 30, enabled: false },
    { platform: 'twitter', dailyLimitMinutes: 30, enabled: false },
    { platform: 'facebook', dailyLimitMinutes: 30, enabled: false },
    { platform: 'reddit', dailyLimitMinutes: 30, enabled: false },
    { platform: 'discord', dailyLimitMinutes: 60, enabled: false },
    { platform: 'twitch', dailyLimitMinutes: 60, enabled: false },
  ],
  warningThresholdPercent: 80,
  blockWhenLimitReached: true,
} as const;

/**
 * Default time limits state (no usage)
 */
export const DEFAULT_TIME_LIMITS_STATE: TimeLimitsState = {
  usage: [],
  lastResetDate: getLocalDateString(),
} as const;

/**
 * Default time tracking settings
 */
export const DEFAULT_TIME_TRACKING: TimeTrackingSettings = {
  enabled: true,
  retentionDays: 90, // Keep 90 days of history
} as const;

/**
 * Default time tracking state (no history)
 */
export const DEFAULT_TIME_TRACKING_STATE: TimeTrackingState = {
  history: [],
  lastUpdated: null,
} as const;

/**
 * Default streak settings
 */
export const DEFAULT_STREAK: StreakSettings = {
  enabled: true,
  goalType: 'focus_time', // Count days with focus sessions
  minFocusMinutes: 30, // At least 30 minutes of focus time
  minBlocks: 10, // At least 10 blocks for 'blocks' goal type
  showNotifications: true,
} as const;

/**
 * Default streak data (no streak)
 */
export const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalFocusDays: 0,
  achievedMilestones: [],
} as const;

/**
 * Streak milestones (days)
 */
export const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;

/**
 * Default challenge settings
 */
export const DEFAULT_CHALLENGE: ChallengeSettings = {
  enabled: false, // Disabled by default
  difficulty: 'medium',
  challengeType: 'math',
  cooldownSeconds: 300, // 5 minutes cooldown between bypass attempts
  disableBypassEntirely: false,
} as const;

/**
 * Default challenge state (no active challenge)
 */
export const DEFAULT_CHALLENGE_STATE: ChallengeState = {
  lastBypassAt: null,
  failedAttempts: 0,
  currentChallenge: null,
} as const;

/**
 * Challenge bypass duration in seconds (5 minutes)
 */
export const CHALLENGE_BYPASS_DURATION_SECONDS = 300;

/**
 * Challenge expiration time in seconds (2 minutes)
 */
export const CHALLENGE_EXPIRATION_SECONDS = 120;

/**
 * Default lockdown settings
 */
export const DEFAULT_LOCKDOWN: LockdownSettings = {
  enabled: true, // Feature is available by default
  pinHash: null, // No PIN set initially
  emergencyBypassMinutes: 30, // 30 minutes wait for emergency bypass
} as const;

/**
 * Default lockdown state (not active)
 */
export const DEFAULT_LOCKDOWN_STATE: LockdownState = {
  isActive: false,
  activatedAt: null,
  emergencyBypassRequestedAt: null,
} as const;

/**
 * Default Commitment Lock settings
 */
export const DEFAULT_COMMITMENT_LOCK: CommitmentLockSettings = {
  enabled: false, // Disabled by default, user must opt-in
  level: 1, // Start with moderate friction

  // Level 1+ settings
  confirmationWaitSeconds: 30, // 30 seconds wait
  cooldownAfterUnlockMinutes: 5, // 5 minutes cooldown after unlock
  requireIntentionStatement: true, // Require intention by default
  intentionMinLength: 20, // Minimum 20 characters

  // Level 2+ settings
  challengeCount: 3, // 3 challenges to solve
  challengesMustBeConsecutive: true, // Must solve all without errors
  escalatingCooldown: true, // Cooldown increases with failures
  dailyAttemptWarningThreshold: 3, // Warn after 3 attempts per day

  // Level 3 (Premium) settings
  timeLockEnabled: false, // Time lock disabled by default
  timeLockHours: 24, // 24 hours default time lock
  weeklyUnlockLimit: 1, // 1 unlock per week (7 days)
  scheduleRestriction: false, // No schedule restriction by default
  allowedUnlockHours: undefined, // No specific hours
  nuclearModeEnabled: false, // Nuclear mode disabled by default
} as const;

/**
 * Default Commitment Lock state (no activity)
 */
export const DEFAULT_COMMITMENT_LOCK_STATE: CommitmentLockState = {
  lastUnlockAt: null,
  lastAttemptAt: null,
  todayAttempts: 0,
  todaySuccesses: 0,
  weekAttempts: 0,
  weekSuccesses: 0,
  weeklyUnlocksRemaining: 1,
  currentCooldownEndsAt: null,
  timeLockEndsAt: null,
  consecutiveFailures: 0,
  lastDailyResetDate: getLocalDateString(),
  lastWeeklyResetDate: getLocalDateString(getMonday(new Date())),
  inProgressChallenge: null,
} as const;

/**
 * Default unlock history
 */
export const DEFAULT_UNLOCK_HISTORY: UnlockHistory = {
  attempts: [],
  lastCleanupDate: getLocalDateString(),
  maxAttempts: 1000, // Keep last 1000 attempts
} as const;

/**
 * Default premium state (not subscribed)
 */
export const DEFAULT_PREMIUM_STATE: PremiumState = {
  isPremium: false,
  subscriptionType: 'none',
  expiresAt: null,
  features: [],
} as const;

/**
 * After completing the Commitment Lock unlock flow, weakening settings
 * changes are allowed for this long (the "unlock window").
 */
export const COMMITMENT_UNLOCK_WINDOW_MS = 5 * 60 * 1000;

/**
 * Escalating cooldown multipliers for failed unlock attempts
 * Cooldown = base * multiplier[consecutiveFailures]
 */
export const COMMITMENT_LOCK_COOLDOWN_ESCALATION = {
  /** Base cooldown in minutes */
  baseMinutes: 5,
  /** Multipliers for consecutive failures (5, 10, 20, 40, 80 minutes) */
  multipliers: [1, 2, 4, 8, 16] as const,
  /** Maximum multiplier index */
  maxMultiplierIndex: 4,
} as const;

/**
 * Commitment Lock limits
 */
export const COMMITMENT_LOCK_LIMITS = {
  /** Minimum wait time in seconds */
  MIN_WAIT_SECONDS: 30,
  /** Maximum wait time in seconds */
  MAX_WAIT_SECONDS: 300,
  /** Minimum cooldown in minutes */
  MIN_COOLDOWN_MINUTES: 5,
  /** Maximum cooldown in minutes */
  MAX_COOLDOWN_MINUTES: 60,
  /** Minimum intention length */
  MIN_INTENTION_LENGTH: 10,
  /** Maximum intention length */
  MAX_INTENTION_LENGTH: 100,
  /** Minimum challenges */
  MIN_CHALLENGES: 1,
  /** Maximum challenges */
  MAX_CHALLENGES: 5,
  /** Minimum time lock hours */
  MIN_TIME_LOCK_HOURS: 1,
  /** Maximum time lock hours (1 week) */
  MAX_TIME_LOCK_HOURS: 168,
  /** Minimum weekly unlock limit */
  MIN_WEEKLY_UNLOCKS: 1,
  /** Maximum weekly unlock limit */
  MAX_WEEKLY_UNLOCKS: 3,
  /** Days between emergency unlocks (Level 3) */
  EMERGENCY_UNLOCK_INTERVAL_DAYS: 7,
} as const;

/**
 * Helper function to get Monday of the week
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Default adalab study integration settings
 */
export const DEFAULT_ADALAB_SYNC = {
  enabled: true,
} as const;

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  platforms: DEFAULT_PLATFORM_SETTINGS,
  customDomains: [],
  schedule: DEFAULT_SCHEDULE,
  stats: DEFAULT_STATS,
  preferences: DEFAULT_PREFERENCES,
  blockPage: DEFAULT_BLOCK_PAGE,
  focusMode: DEFAULT_FOCUS_MODE,
  pomodoro: DEFAULT_POMODORO,
  timeLimits: DEFAULT_TIME_LIMITS,
  timeTracking: DEFAULT_TIME_TRACKING,
  streak: DEFAULT_STREAK,
  challenge: DEFAULT_CHALLENGE,
  lockdown: DEFAULT_LOCKDOWN,
  commitmentLock: DEFAULT_COMMITMENT_LOCK,
  adalabSync: DEFAULT_ADALAB_SYNC,
  onboardingCompleted: false,
  version: SETTINGS_VERSION,
} as const;

/**
 * Maximum limits for safety
 */
export const LIMITS = {
  /** Maximum custom rules */
  MAX_CUSTOM_RULES: 100,
  /** Maximum custom blocked domains */
  MAX_CUSTOM_DOMAINS: 100,
  /** Maximum URL length to process */
  MAX_URL_LENGTH: 2048,
  /** Maximum selector length */
  MAX_SELECTOR_LENGTH: 500,
  /** Import file size limit in bytes (1MB) */
  MAX_IMPORT_SIZE: 1024 * 1024,
} as const;

/**
 * Performance settings
 */
export const PERFORMANCE = {
  /** Debounce time for mutation observer (ms) */
  MUTATION_DEBOUNCE_MS: 50,
  /** Maximum mutations to process per batch */
  MAX_MUTATIONS_PER_BATCH: 100,
  /** Interval for stats reset check (ms) */
  STATS_CHECK_INTERVAL_MS: 60000,
  /** Throttle time for storage writes (ms) */
  STORAGE_THROTTLE_MS: 1000,
} as const;

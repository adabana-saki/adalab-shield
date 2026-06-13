/**
 * Storage key constants
 * Centralized keys to prevent typos and ensure consistency
 */

/**
 * Storage keys for extension data
 */
export const STORAGE_KEYS = {
  /** Main settings storage key */
  SETTINGS: 'shortshield_settings',
  /** Custom rules storage key */
  CUSTOM_RULES: 'shortshield_custom_rules',
  /** Migration version key */
  MIGRATION_VERSION: 'shortshield_migration_version',
  /** Focus mode state key */
  FOCUS_STATE: 'shortshield_focus_state',
  /** Pomodoro timer state key */
  POMODORO_STATE: 'shortshield_pomodoro_state',
  /** Time limits usage state key */
  TIME_LIMITS_STATE: 'shortshield_time_limits_state',
  /** Time tracking history state key */
  TIME_TRACKING_STATE: 'shortshield_time_tracking_state',
  /** Challenge mode state key */
  CHALLENGE_STATE: 'shortshield_challenge_state',
  /** Lockdown mode state key */
  LOCKDOWN_STATE: 'shortshield_lockdown_state',
  /** Commitment Lock state key */
  COMMITMENT_LOCK_STATE: 'shortshield_commitment_lock_state',
  /** Commitment Lock unlock history key */
  COMMITMENT_LOCK_HISTORY: 'shortshield_commitment_lock_history',
  /** Premium subscription state key */
  PREMIUM_STATE: 'shortshield_premium_state',
  /** adalab study sync metadata (external timer flag + current task) */
  ADALAB_META: 'shortshield_adalab_meta',
} as const;

/**
 * Storage key type
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Get all storage keys as array
 */
export function getAllStorageKeys(): readonly StorageKey[] {
  return Object.values(STORAGE_KEYS);
}

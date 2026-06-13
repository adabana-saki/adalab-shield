/**
 * Storage abstraction with validation
 * Security: Validates all data before read/write
 */

import browser from 'webextension-polyfill';
import { STORAGE_KEYS, DEFAULT_SETTINGS, LIMITS } from '@/shared/constants';
import type { Settings, SettingsUpdate, CustomRule } from '@/shared/types';
import { isValidSettings } from '@/shared/types';
import { createLogger } from './logger';

const logger = createLogger('storage');

/**
 * Throttle state for write operations
 */
const writeThrottles: Map<string, NodeJS.Timeout> = new Map();
const pendingWrites: Map<string, unknown> = new Map();

/**
 * Read settings from storage
 */
export async function getSettings(): Promise<Settings> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    const stored = result[STORAGE_KEYS.SETTINGS];

    if (stored === undefined || stored === null) {
      logger.debug('No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    if (!isValidSettings(stored)) {
      logger.warn('Invalid stored settings, using defaults');
      return DEFAULT_SETTINGS;
    }

    // Merge with defaults to handle schema updates
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      platforms: {
        ...DEFAULT_SETTINGS.platforms,
        ...stored.platforms,
      },
      preferences: {
        ...DEFAULT_SETTINGS.preferences,
        ...stored.preferences,
      },
      customDomains: stored.customDomains ?? DEFAULT_SETTINGS.customDomains,
      schedule: {
        ...DEFAULT_SETTINGS.schedule,
        ...(stored.schedule ?? {}),
      },
      commitmentLock: {
        ...DEFAULT_SETTINGS.commitmentLock,
        ...(stored.commitmentLock ?? {}),
      },
      adalabSync: {
        ...DEFAULT_SETTINGS.adalabSync,
        ...(stored.adalabSync ?? {}),
      },
    };
  } catch (error) {
    logger.error('Failed to read settings', { error: String(error) });
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to storage with throttling
 */
export async function saveSettings(settings: Settings): Promise<void> {
  // Validate before saving
  if (!isValidSettings(settings)) {
    throw new Error('Invalid settings data');
  }

  await throttledWrite(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Update partial settings
 */
export async function updateSettings(
  update: SettingsUpdate
): Promise<Settings> {
  const current = await getSettings();
  const updated: Settings = {
    ...current,
    enabled: update.enabled ?? current.enabled,
    platforms: {
      ...current.platforms,
      ...(update.platforms ?? {}),
    },
    preferences: {
      ...current.preferences,
      ...(update.preferences ?? {}),
    },
    stats: {
      ...current.stats,
      ...(update.stats ?? {}),
    },
    customDomains: update.customDomains ?? current.customDomains,
    schedule: update.schedule
      ? { ...current.schedule, ...update.schedule }
      : current.schedule,
    blockPage: update.blockPage
      ? { ...current.blockPage, ...update.blockPage }
      : current.blockPage,
    focusMode: update.focusMode
      ? { ...current.focusMode, ...update.focusMode }
      : current.focusMode,
    pomodoro: update.pomodoro
      ? { ...current.pomodoro, ...update.pomodoro }
      : current.pomodoro,
    timeLimits: update.timeLimits
      ? { ...current.timeLimits, ...update.timeLimits }
      : current.timeLimits,
    timeTracking: update.timeTracking
      ? { ...current.timeTracking, ...update.timeTracking }
      : current.timeTracking,
    challenge: update.challenge
      ? { ...current.challenge, ...update.challenge }
      : current.challenge,
    lockdown: update.lockdown
      ? { ...current.lockdown, ...update.lockdown }
      : current.lockdown,
    commitmentLock: update.commitmentLock
      ? { ...current.commitmentLock, ...update.commitmentLock }
      : current.commitmentLock,
    adalabSync: update.adalabSync
      ? { ...current.adalabSync, ...update.adalabSync }
      : current.adalabSync,
    onboardingCompleted:
      update.onboardingCompleted ?? current.onboardingCompleted,
    version: current.version,
  };

  await saveSettings(updated);
  return updated;
}

/**
 * Get custom rules from storage
 */
export async function getCustomRules(): Promise<readonly CustomRule[]> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.CUSTOM_RULES);
    const stored = result[STORAGE_KEYS.CUSTOM_RULES];

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored as readonly CustomRule[];
  } catch (error) {
    logger.error('Failed to read custom rules', { error: String(error) });
    return [];
  }
}

/**
 * Save custom rules to storage
 */
export async function saveCustomRules(
  rules: readonly CustomRule[]
): Promise<void> {
  if (rules.length > LIMITS.MAX_CUSTOM_RULES) {
    throw new Error(`Maximum ${LIMITS.MAX_CUSTOM_RULES} custom rules allowed`);
  }

  await throttledWrite(STORAGE_KEYS.CUSTOM_RULES, rules);
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{
  bytesUsed: number;
  quotaBytes: number;
}> {
  try {
    // Chrome-specific API
    if (
      'getBytesInUse' in browser.storage.local &&
      typeof browser.storage.local.getBytesInUse === 'function'
    ) {
      const bytesUsed = await browser.storage.local.getBytesInUse(null);
      return {
        bytesUsed,
        quotaBytes: 5 * 1024 * 1024, // 5MB default
      };
    }

    return {
      bytesUsed: 0,
      quotaBytes: 5 * 1024 * 1024,
    };
  } catch {
    return {
      bytesUsed: 0,
      quotaBytes: 5 * 1024 * 1024,
    };
  }
}

/**
 * Clear all extension data
 */
export async function clearAllData(): Promise<void> {
  await browser.storage.local.clear();
  logger.info('All extension data cleared');
}

/**
 * Throttled write to prevent excessive storage operations
 */
async function throttledWrite(key: string, data: unknown): Promise<void> {
  // Cancel pending write for this key
  const existingTimeout = writeThrottles.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Store pending data
  pendingWrites.set(key, data);

  // Schedule write
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const timeout = setTimeout(async () => {
      try {
        const dataToWrite = pendingWrites.get(key);
        pendingWrites.delete(key);
        writeThrottles.delete(key);

        await browser.storage.local.set({ [key]: dataToWrite });
        logger.debug('Storage write complete', { key });
        resolve();
      } catch (error) {
        logger.error('Storage write failed', { key, error: String(error) });
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(error);
      }
    }, 100); // 100ms throttle

    writeThrottles.set(key, timeout);
  });
}

/**
 * Export all data for backup
 */
export async function exportData(): Promise<Record<string, unknown>> {
  const result = await browser.storage.local.get(null);

  // Remove internal keys
  const exportable = { ...result };
  delete exportable[STORAGE_KEYS.MIGRATION_VERSION];

  return {
    version: 1,
    timestamp: Date.now(),
    data: exportable,
  };
}

/**
 * Import data from backup
 */
export async function importData(backup: unknown): Promise<void> {
  if (typeof backup !== 'object' || backup === null) {
    throw new Error('Invalid backup format');
  }

  const obj = backup as Record<string, unknown>;

  if (typeof obj.version !== 'number' || typeof obj.data !== 'object') {
    throw new Error('Invalid backup structure');
  }

  const data = obj.data as Record<string, unknown>;

  // Validate settings if present
  if (
    data[STORAGE_KEYS.SETTINGS] !== undefined &&
    data[STORAGE_KEYS.SETTINGS] !== null &&
    !isValidSettings(data[STORAGE_KEYS.SETTINGS])
  ) {
    throw new Error('Invalid settings in backup');
  }

  // Import data
  await browser.storage.local.set(data);
  logger.info('Data imported successfully');
}

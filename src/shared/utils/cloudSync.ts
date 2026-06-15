/**
 * Cloud sync via browser.storage.sync.
 *
 * storage.sync roams data across the user's signed-in browsers, but it has
 * tight quotas (~8KB per item) and is the wrong place for security/stateful
 * data. So we sync only the *configuration* subset — never stats, history, or
 * the lock/security state — and we do it explicitly (save / restore buttons)
 * rather than auto-merging, which would let one device silently unlock another.
 */

import browser from 'webextension-polyfill';
import { STORAGE_KEYS } from '@/shared/constants';
import type { Settings } from '@/shared/types';
import { createLogger } from './logger';

const logger = createLogger('cloud-sync');

/** Key the config payload lives under in storage.sync. */
const SYNC_KEY = STORAGE_KEYS.SETTINGS;

export interface CloudSyncPayload {
  readonly savedAt: number;
  readonly settings: Partial<Settings>;
}

/**
 * The configuration fields safe to roam between devices. Deliberately excludes
 * stats, time-tracking history, lockdown (PIN) and commitment-lock state.
 */
export function pickSyncableConfig(settings: Settings): Partial<Settings> {
  return {
    enabled: settings.enabled,
    platforms: { ...settings.platforms },
    preferences: { ...settings.preferences },
    customDomains: [...settings.customDomains],
    allowlist: [...settings.allowlist],
    schedule: { ...settings.schedule },
    blockPage: { ...settings.blockPage },
    focusMode: { ...settings.focusMode },
    pomodoro: { ...settings.pomodoro },
    timeLimits: { ...settings.timeLimits },
    challenge: { ...settings.challenge },
    adalabSync: { ...settings.adalabSync },
    version: settings.version,
  };
}

/**
 * True if storage.sync is usable in this browser.
 */
export function isCloudSyncAvailable(): boolean {
  try {
    return typeof browser.storage.sync?.set === 'function';
  } catch {
    return false;
  }
}

/**
 * Write the config subset to storage.sync.
 */
export async function saveConfigToCloud(settings: Settings): Promise<void> {
  const payload: CloudSyncPayload = {
    savedAt: Date.now(),
    settings: pickSyncableConfig(settings),
  };
  await browser.storage.sync.set({ [SYNC_KEY]: payload });
  logger.info('Config saved to cloud', { savedAt: payload.savedAt });
}

/**
 * Read the config subset previously saved to storage.sync (or null).
 */
export async function loadConfigFromCloud(): Promise<CloudSyncPayload | null> {
  const result = await browser.storage.sync.get(SYNC_KEY);
  const stored = result[SYNC_KEY];
  if (
    typeof stored !== 'object' ||
    stored === null ||
    typeof (stored as CloudSyncPayload).savedAt !== 'number' ||
    typeof (stored as CloudSyncPayload).settings !== 'object'
  ) {
    return null;
  }
  return stored as CloudSyncPayload;
}

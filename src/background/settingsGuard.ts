/**
 * Settings guard - enforces Lockdown / Commitment Lock on the settings
 * write path. Without this, the lock features would not protect anything:
 * the popup toggle could disable all blocking with one tap.
 */

import { getSettings } from './storage';
import { getLockdownState } from './timers';
import { getCommitmentLockState } from './commitmentLock';
import type { Settings, SettingsUpdate, Platform } from '@/shared/types';
import { COMMITMENT_UNLOCK_WINDOW_MS } from '@/shared/constants/defaults';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('settingsGuard');

export type GuardResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: 'lockdown' | 'commitment' };

export const GUARD_ERRORS = {
  lockdown: 'SETTINGS_LOCKED_LOCKDOWN',
  commitment: 'SETTINGS_LOCKED_COMMITMENT',
} as const;

/**
 * Does this update weaken the blocking protection?
 * (Strengthening changes are always allowed, even while locked.)
 */
function isWeakeningUpdate(current: Settings, update: SettingsUpdate): boolean {
  // Turning the whole extension off
  if (update.enabled === false && current.enabled) {
    return true;
  }

  // Turning any platform block off
  if (update.platforms) {
    for (const [key, value] of Object.entries(update.platforms)) {
      if (value === false && current.platforms[key as Platform]) {
        return true;
      }
    }
  }

  // Removing custom blocked domains
  if (
    update.customDomains !== undefined &&
    update.customDomains.length < current.customDomains.length
  ) {
    return true;
  }

  // Weakening the lock features themselves
  if (update.challenge?.enabled === false && current.challenge.enabled) {
    return true;
  }
  if (update.lockdown?.enabled === false && current.lockdown.enabled) {
    return true;
  }
  if (update.commitmentLock) {
    const cl = update.commitmentLock;
    if (cl.enabled === false && current.commitmentLock.enabled) {
      return true;
    }
    if (cl.level !== undefined && cl.level < current.commitmentLock.level) {
      return true;
    }
    if (
      cl.nuclearModeEnabled === false &&
      current.commitmentLock.nuclearModeEnabled
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check whether a settings update is currently permitted.
 */
export async function checkSettingsGuard(
  update: SettingsUpdate
): Promise<GuardResult> {
  const current = await getSettings();

  if (!isWeakeningUpdate(current, update)) {
    return { allowed: true };
  }

  // Lockdown active: weakening changes require deactivating lockdown
  // with the PIN first (LockdownSettings provides that flow).
  try {
    const lockdown = await getLockdownState();
    if (lockdown.isActive) {
      logger.info('Weakening update rejected: lockdown active');
      return { allowed: false, reason: 'lockdown' };
    }
  } catch {
    // If lockdown state is unreadable, fail open for this layer
  }

  // Commitment Lock: weakening changes are only allowed inside the
  // unlock window after completing the unlock flow.
  if (current.commitmentLock.enabled) {
    try {
      const state = await getCommitmentLockState();
      const inUnlockWindow =
        state.lastUnlockAt !== null &&
        Date.now() - state.lastUnlockAt < COMMITMENT_UNLOCK_WINDOW_MS;
      if (!inUnlockWindow) {
        logger.info('Weakening update rejected: commitment lock');
        return { allowed: false, reason: 'commitment' };
      }
    } catch {
      // If state is unreadable, fail open for this layer
    }
  }

  return { allowed: true };
}

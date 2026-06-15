/**
 * Service Worker entry point
 * Handles extension lifecycle and message routing
 */

import browser from 'webextension-polyfill';
import { setupMessageListener } from './messaging';
import { initializeTimers } from './timers';
import { updateDnrRules } from './dnr';
import { createLogger } from '@/shared/utils/logger';
import { getSettings, updateSettings } from '@/shared/utils/storage';
import { STORAGE_KEYS } from '@/shared/constants';
import { getLocalDateString } from '@/shared/utils/date';

const logger = createLogger('background');

/** Periodic refresh alarm (daily reset + schedule-boundary DNR recompute) */
const PERIODIC_REFRESH_ALARM = 'shortshield_periodic_refresh';

/**
 * Check and reset daily stats if needed
 */
async function checkDailyReset(): Promise<void> {
  try {
    const settings = await getSettings();
    const today = getLocalDateString();

    if (settings.stats.lastResetDate !== today) {
      logger.info('Resetting daily stats', {
        previousDate: settings.stats.lastResetDate,
        newDate: today,
      });

      await updateSettings({
        stats: {
          ...settings.stats,
          blockedToday: 0,
          lastResetDate: today,
        },
      });
    }
  } catch (error) {
    logger.error('Failed to check daily reset', { error: String(error) });
  }
}

/**
 * Initialize the extension
 */
async function initialize(): Promise<void> {
  logger.info('ShortShield initializing...');

  try {
    // Set up message listener
    setupMessageListener();

    // Initialize timer/alarm listeners
    initializeTimers();

    // Check for daily stats reset
    await checkDailyReset();

    // Network-layer blocking rules (recomputed whenever settings, the
    // pomodoro state or the focus state change)
    await updateDnrRules();
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }
      if (
        changes[STORAGE_KEYS.SETTINGS] !== undefined ||
        changes[STORAGE_KEYS.POMODORO_STATE] !== undefined ||
        changes[STORAGE_KEYS.FOCUS_STATE] !== undefined
      ) {
        void updateDnrRules();
      }
    });

    // Periodic refresh via alarms (NOT setInterval: the MV3 service worker
    // is killed after ~30s idle, so an interval silently stops and
    // schedule-based blocking would never switch at its boundaries)
    await browser.alarms.create(PERIODIC_REFRESH_ALARM, {
      periodInMinutes: 1,
    });
    browser.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === PERIODIC_REFRESH_ALARM) {
        void checkDailyReset();
        void updateDnrRules();
      }
    });

    // Keyboard shortcuts (manifest "commands"). _execute_action opens the
    // popup automatically; we only handle the custom toggle here.
    if (browser.commands?.onCommand !== undefined) {
      browser.commands.onCommand.addListener((command) => {
        if (command !== 'toggle-blocking') {
          return;
        }
        void (async () => {
          try {
            const current = await getSettings();
            await updateSettings({ enabled: !current.enabled });
            logger.info('Blocking toggled via shortcut', {
              enabled: !current.enabled,
            });
          } catch (error) {
            // e.g. blocked by an active commitment lock — leave state as-is.
            logger.warn('Toggle shortcut ignored', { error: String(error) });
          }
        })();
      });
    }

    logger.info('ShortShield initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize', { error: String(error) });
  }
}

/**
 * Handle extension installation or update
 */
browser.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed/updated', {
    reason: details.reason,
    previousVersion: details.previousVersion,
  });

  if (details.reason === 'install') {
    // First installation - settings are created by default
    logger.info('First installation complete');
  } else if (details.reason === 'update') {
    // Update - might need migration in the future
    logger.info('Extension updated', {
      from: details.previousVersion,
    });
  }
});

/**
 * Handle service worker startup
 */
browser.runtime.onStartup.addListener(() => {
  logger.info('Browser startup - reinitializing');
  void initialize();
});

// Initialize immediately
void initialize();

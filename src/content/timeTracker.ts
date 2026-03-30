/**
 * Time tracker for content script
 * Tracks active time spent on a page and reports to background script
 */

import browser from 'webextension-polyfill';
import { createMessage } from '@/shared/types';
import type {
  Platform,
  TimeCheckLimitResult,
  TimeTrackActivityMessage,
  TimeCheckLimitMessage,
} from '@/shared/types';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('timeTracker');

/** Interval for sending time updates (in ms) */
const UPDATE_INTERVAL_MS = 10000; // 10 seconds

/** Inactivity threshold before pausing tracking (in ms) */
const INACTIVITY_THRESHOLD_MS = 60000; // 1 minute

/** Activity events to track */
const ACTIVITY_EVENTS = [
  'mousemove',
  'keydown',
  'scroll',
  'click',
  'touchstart',
] as const;

interface TimeTrackerState {
  platform: Platform;
  isTracking: boolean;
  isVisible: boolean;
  lastActivityTime: number;
  sessionStartTime: number | null;
  accumulatedTimeMs: number;
  updateIntervalId: number | null;
  limitReached: boolean;
  onLimitReached: (() => void) | null;
}

const state: TimeTrackerState = {
  platform: 'youtube',
  isTracking: false,
  isVisible: true,
  lastActivityTime: Date.now(),
  sessionStartTime: null,
  accumulatedTimeMs: 0,
  updateIntervalId: null,
  limitReached: false,
  onLimitReached: null,
};

/**
 * Handle user activity
 */
function handleActivity(): void {
  state.lastActivityTime = Date.now();

  // If we were paused due to inactivity, resume tracking
  if (state.isTracking && state.sessionStartTime === null && state.isVisible) {
    state.sessionStartTime = Date.now();
  }
}

/**
 * Handle visibility change
 */
function handleVisibilityChange(): void {
  const isVisible = document.visibilityState === 'visible';

  if (isVisible && !state.isVisible) {
    // Page became visible - start tracking
    state.isVisible = true;
    if (state.isTracking && state.sessionStartTime === null) {
      state.sessionStartTime = Date.now();
      state.lastActivityTime = Date.now();
    }
  } else if (!isVisible && state.isVisible) {
    // Page became hidden - pause tracking
    state.isVisible = false;
    if (state.sessionStartTime !== null) {
      const elapsed = Date.now() - state.sessionStartTime;
      state.accumulatedTimeMs += elapsed;
      state.sessionStartTime = null;
    }
  }
}

/**
 * Check for inactivity
 */
function checkInactivity(): void {
  if (!state.isTracking || state.sessionStartTime === null) {
    return;
  }

  const inactiveTime = Date.now() - state.lastActivityTime;
  if (inactiveTime >= INACTIVITY_THRESHOLD_MS) {
    // User is inactive - pause tracking
    const activeTime = state.lastActivityTime - state.sessionStartTime;
    if (activeTime > 0) {
      state.accumulatedTimeMs += activeTime;
    }
    state.sessionStartTime = null;
  }
}

/**
 * Send accumulated time to background script
 */
async function sendTimeUpdate(): Promise<void> {
  if (state.limitReached) {
    return;
  }

  // Check for inactivity first
  checkInactivity();

  // Calculate current active time
  let totalTime = state.accumulatedTimeMs;
  if (state.sessionStartTime !== null) {
    totalTime += Date.now() - state.sessionStartTime;
  }

  // Only send if we have accumulated some time
  if (totalTime <= 0) {
    return;
  }

  try {
    const message = createMessage<TimeTrackActivityMessage>({
      type: 'TIME_TRACK_ACTIVITY',
      payload: {
        platform: state.platform,
        durationMs: totalTime,
      },
    });

    await browser.runtime.sendMessage(message);

    // Reset accumulated time after successful send
    state.accumulatedTimeMs = 0;
    if (state.sessionStartTime !== null) {
      state.sessionStartTime = Date.now();
    }

    // Check if limit is reached
    await checkTimeLimit();
  } catch (error) {
    logger.error('Failed to send time update', { error: String(error) });
  }
}

/**
 * Check if time limit is reached
 */
async function checkTimeLimit(): Promise<void> {
  try {
    const message = createMessage<TimeCheckLimitMessage>({
      type: 'TIME_CHECK_LIMIT',
      payload: {
        platform: state.platform,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const response = (await browser.runtime.sendMessage(message)) as {
      success: boolean;
      data?: { limitReached: boolean };
    };

    if (response.success && response.data) {
      const result = response.data;

      if (result.limitReached && !state.limitReached) {
        state.limitReached = true;
        logger.info('Time limit reached', { platform: state.platform });

        // Trigger callback if set
        if (state.onLimitReached) {
          state.onLimitReached();
        }
      }
    }
  } catch (error) {
    logger.error('Failed to check time limit', { error: String(error) });
  }
}

/**
 * Start tracking time for a platform
 */
export function startTimeTracking(
  platform: Platform,
  onLimitReached?: () => void
): void {
  if (state.isTracking) {
    stopTimeTracking();
  }

  state.platform = platform;
  state.isTracking = true;
  state.isVisible = document.visibilityState === 'visible';
  state.lastActivityTime = Date.now();
  state.sessionStartTime = state.isVisible ? Date.now() : null;
  state.accumulatedTimeMs = 0;
  state.limitReached = false;
  state.onLimitReached = onLimitReached ?? null;

  // Add event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  for (const event of ACTIVITY_EVENTS) {
    document.addEventListener(event, handleActivity, { passive: true });
  }

  // Start update interval
  state.updateIntervalId = window.setInterval(() => {
    void sendTimeUpdate();
  }, UPDATE_INTERVAL_MS);

  // Initial limit check
  void checkTimeLimit();

  logger.debug('Started time tracking', { platform });
}

/**
 * Stop tracking time
 */
export function stopTimeTracking(): void {
  if (!state.isTracking) {
    return;
  }

  // Send final time update
  void sendTimeUpdate();

  // Remove event listeners
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  for (const event of ACTIVITY_EVENTS) {
    document.removeEventListener(event, handleActivity);
  }

  // Clear interval
  if (state.updateIntervalId !== null) {
    window.clearInterval(state.updateIntervalId);
    state.updateIntervalId = null;
  }

  state.isTracking = false;
  state.sessionStartTime = null;
  state.accumulatedTimeMs = 0;
  state.onLimitReached = null;

  logger.debug('Stopped time tracking', { platform: state.platform });
}

/**
 * Check if time limit has been reached
 */
export function isLimitReached(): boolean {
  return state.limitReached;
}

/**
 * Force a time limit check
 */
export async function forceCheckLimit(): Promise<TimeCheckLimitResult | null> {
  try {
    const message = createMessage<TimeCheckLimitMessage>({
      type: 'TIME_CHECK_LIMIT',
      payload: {
        platform: state.platform,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const response = (await browser.runtime.sendMessage(message)) as {
      success: boolean;
      data?: TimeCheckLimitResult;
    };

    if (response.success && response.data) {
      const result = response.data;

      if (result.limitReached && !state.limitReached) {
        state.limitReached = true;
        if (state.onLimitReached) {
          state.onLimitReached();
        }
      }

      return result;
    }

    return null;
  } catch (error) {
    logger.error('Failed to force check limit', { error: String(error) });
    return null;
  }
}

/**
 * Get current tracking state (for debugging)
 */
export function getTrackingState(): Readonly<{
  platform: Platform;
  isTracking: boolean;
  isVisible: boolean;
  limitReached: boolean;
  currentSessionMs: number;
}> {
  let currentSessionMs = state.accumulatedTimeMs;
  if (state.sessionStartTime !== null) {
    currentSessionMs += Date.now() - state.sessionStartTime;
  }

  return {
    platform: state.platform,
    isTracking: state.isTracking,
    isVisible: state.isVisible,
    limitReached: state.limitReached,
    currentSessionMs,
  };
}

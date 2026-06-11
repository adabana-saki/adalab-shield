/**
 * Timer management using browser.alarms API
 * Handles focus mode, pomodoro timer, and other time-based features
 */

import browser from 'webextension-polyfill';
import type {
  FocusModeState,
  FocusDuration,
  PomodoroState,
  PomodoroMode,
  TimeLimitsState,
  SiteTimeUsage,
  Platform,
  TimeCheckLimitResult,
  TimeTrackingState,
  DailyTimeRecord,
  StreakData,
  ChallengeState,
  ChallengeData,
  ChallengeSubmitResult,
} from '@/shared/types';
import {
  STORAGE_KEYS,
  DEFAULT_FOCUS_STATE,
  DEFAULT_POMODORO_STATE,
  DEFAULT_TIME_LIMITS_STATE,
  DEFAULT_TIME_TRACKING_STATE,
  DEFAULT_STREAK_DATA,
  STREAK_MILESTONES,
  DEFAULT_CHALLENGE_STATE,
  CHALLENGE_BYPASS_DURATION_SECONDS,
} from '@/shared/constants';
import {
  generateChallenge,
  verifyChallengeAnswer,
  isChallengeValid,
} from '@/shared/utils/challenges';
import { createLogger } from '@/shared/utils/logger';
import { getSettings, updateSettings } from './storage';

const logger = createLogger('timers');

/**
 * Alarm names
 */
export const ALARM_NAMES = {
  FOCUS_END: 'shortshield_focus_end',
  POMODORO_TICK: 'shortshield_pomodoro_tick',
  POMODORO_END: 'shortshield_pomodoro_end',
  TIME_LIMITS_RESET: 'shortshield_time_limits_reset',
  STREAK_CHECK: 'shortshield_streak_check',
} as const;

/**
 * Get current focus mode state from storage
 */
export async function getFocusState(): Promise<FocusModeState> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.FOCUS_STATE);
    const state = result[STORAGE_KEYS.FOCUS_STATE] as
      | FocusModeState
      | undefined;

    if (!state) {
      return DEFAULT_FOCUS_STATE;
    }

    // Check if focus has expired
    if (
      state.isActive &&
      state.endTime !== null &&
      Date.now() >= state.endTime
    ) {
      logger.info('Focus session expired, resetting state');
      await saveFocusState(DEFAULT_FOCUS_STATE);
      return DEFAULT_FOCUS_STATE;
    }

    return state;
  } catch (error) {
    logger.error('Failed to get focus state', { error });
    return DEFAULT_FOCUS_STATE;
  }
}

/**
 * Save focus mode state to storage
 */
export async function saveFocusState(state: FocusModeState): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.FOCUS_STATE]: state,
    });
    logger.debug('Focus state saved', { isActive: state.isActive });
  } catch (error) {
    logger.error('Failed to save focus state', { error });
    throw error;
  }
}

/**
 * Start a focus mode session
 */
export async function startFocusMode(
  duration: FocusDuration
): Promise<FocusModeState> {
  const settings = await getSettings();

  if (!settings.focusMode.enabled) {
    throw new Error('Focus mode is disabled');
  }

  const currentState = await getFocusState();
  if (currentState.isActive) {
    throw new Error('Focus mode is already active');
  }

  const now = Date.now();
  const endTime = now + duration * 60 * 1000; // Convert minutes to milliseconds

  const newState: FocusModeState = {
    isActive: true,
    endTime,
    duration,
    startedAt: now,
  };

  // Create alarm for focus end
  await browser.alarms.create(ALARM_NAMES.FOCUS_END, {
    when: endTime,
  });

  await saveFocusState(newState);

  // Show notification if enabled
  if (settings.focusMode.enableNotifications) {
    await showFocusNotification('focusStarted', duration);
  }

  logger.info('Focus mode started', { duration, endTime });
  return newState;
}

/**
 * Cancel focus mode session
 */
export async function cancelFocusMode(): Promise<FocusModeState> {
  const settings = await getSettings();
  const currentState = await getFocusState();

  if (!currentState.isActive) {
    return currentState;
  }

  // Check if cancellation is allowed
  if (!settings.focusMode.softLock) {
    throw new Error('Focus mode cannot be cancelled (soft lock disabled)');
  }

  // Clear the alarm
  await browser.alarms.clear(ALARM_NAMES.FOCUS_END);

  await saveFocusState(DEFAULT_FOCUS_STATE);

  if (settings.focusMode.enableNotifications) {
    await showFocusNotification('focusCancelled');
  }

  logger.info('Focus mode cancelled');
  return DEFAULT_FOCUS_STATE;
}

/**
 * Extend focus mode by additional minutes
 */
export async function extendFocusMode(
  additionalMinutes: number
): Promise<FocusModeState> {
  const currentState = await getFocusState();

  if (!currentState.isActive || currentState.endTime === null) {
    throw new Error('No active focus session to extend');
  }

  const newEndTime = currentState.endTime + additionalMinutes * 60 * 1000;

  const newState: FocusModeState = {
    ...currentState,
    endTime: newEndTime,
  };

  // Update alarm
  await browser.alarms.clear(ALARM_NAMES.FOCUS_END);
  await browser.alarms.create(ALARM_NAMES.FOCUS_END, {
    when: newEndTime,
  });

  await saveFocusState(newState);

  logger.info('Focus mode extended', { additionalMinutes, newEndTime });
  return newState;
}

/**
 * Handle alarm events
 */
export async function handleAlarm(alarm: browser.Alarms.Alarm): Promise<void> {
  logger.debug('Alarm triggered', { name: alarm.name });

  switch (alarm.name) {
    case ALARM_NAMES.FOCUS_END:
      await handleFocusEnd();
      break;
    case ALARM_NAMES.POMODORO_END:
      await handlePomodoroEnd();
      break;
    case ALARM_NAMES.TIME_LIMITS_RESET:
      await handleTimeLimitsReset();
      break;
    case ALARM_NAMES.STREAK_CHECK:
      await handleStreakCheck();
      break;
    default:
      logger.warn('Unknown alarm', { name: alarm.name });
  }
}

/**
 * Handle focus mode end
 */
async function handleFocusEnd(): Promise<void> {
  const settings = await getSettings();

  await saveFocusState(DEFAULT_FOCUS_STATE);

  if (settings.focusMode.enableNotifications) {
    await showFocusNotification('focusCompleted');
  }

  logger.info('Focus mode ended');
}

/**
 * Show focus mode notification
 */
async function showFocusNotification(
  type: 'focusStarted' | 'focusCompleted' | 'focusCancelled',
  duration?: number
): Promise<void> {
  try {
    const titles: Record<typeof type, string> = {
      focusStarted: 'Focus Mode Started',
      focusCompleted: 'Focus Session Complete!',
      focusCancelled: 'Focus Mode Cancelled',
    };

    const messages: Record<typeof type, string> = {
      focusStarted: `Stay focused for ${duration ?? 0} minutes. You can do it!`,
      focusCompleted: 'Great job! You completed your focus session.',
      focusCancelled: 'Focus mode has been cancelled.',
    };

    await browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('icons/icon-128.png'),
      title: titles[type],
      message: messages[type],
    });
  } catch (error) {
    // Notifications might not be available in all contexts
    logger.debug('Could not show notification', { error });
  }
}

// =============================================================================
// POMODORO TIMER
// =============================================================================

/**
 * Get current pomodoro state from storage
 */
export async function getPomodoroState(): Promise<PomodoroState> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.POMODORO_STATE);
    const state = result[STORAGE_KEYS.POMODORO_STATE] as
      | PomodoroState
      | undefined;

    if (!state) {
      return DEFAULT_POMODORO_STATE;
    }

    // Check if timer has expired
    if (
      state.isRunning &&
      state.endTime !== null &&
      Date.now() >= state.endTime
    ) {
      logger.info('Pomodoro session expired, handling completion');
      return await handlePomodoroComplete(state);
    }

    // Update timeRemainingMs for active timers
    if (state.isRunning && state.endTime !== null) {
      const remaining = Math.max(0, state.endTime - Date.now());
      return { ...state, timeRemainingMs: remaining };
    }

    return state;
  } catch (error) {
    logger.error('Failed to get pomodoro state', { error });
    return DEFAULT_POMODORO_STATE;
  }
}

/**
 * Save pomodoro state to storage
 */
export async function savePomodoroState(state: PomodoroState): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.POMODORO_STATE]: state,
    });
    logger.debug('Pomodoro state saved', {
      mode: state.mode,
      isRunning: state.isRunning,
    });
  } catch (error) {
    logger.error('Failed to save pomodoro state', { error });
    throw error;
  }
}

/**
 * Get duration for a pomodoro mode
 */
async function getPomodoroDuration(mode: PomodoroMode): Promise<number> {
  const settings = await getSettings();
  switch (mode) {
    case 'work':
      return settings.pomodoro.workDurationMinutes * 60 * 1000;
    case 'break':
      return settings.pomodoro.breakDurationMinutes * 60 * 1000;
    case 'longBreak':
      return settings.pomodoro.longBreakDurationMinutes * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Start a pomodoro session
 */
export async function startPomodoro(
  mode: 'work' | 'break' | 'longBreak'
): Promise<PomodoroState> {
  const settings = await getSettings();

  if (!settings.pomodoro.enabled) {
    throw new Error('Pomodoro timer is disabled');
  }

  const currentState = await getPomodoroState();

  // Don't allow starting if already running
  if (currentState.isRunning) {
    throw new Error('Pomodoro timer is already running');
  }

  const durationMs = await getPomodoroDuration(mode);
  const now = Date.now();
  const endTime = now + durationMs;

  const newState: PomodoroState = {
    isRunning: true,
    mode,
    timeRemainingMs: durationMs,
    sessionCount: currentState.sessionCount,
    startedAt: now,
    endTime,
  };

  // Create alarm for pomodoro end
  await browser.alarms.create(ALARM_NAMES.POMODORO_END, {
    when: endTime,
  });

  await savePomodoroState(newState);

  if (settings.pomodoro.soundEnabled) {
    await showPomodoroNotification('started', mode);
  }

  logger.info('Pomodoro started', { mode, durationMs });
  return newState;
}

/**
 * Pause the pomodoro timer
 */
export async function pausePomodoro(): Promise<PomodoroState> {
  const currentState = await getPomodoroState();

  if (!currentState.isRunning) {
    throw new Error('Pomodoro timer is not running');
  }

  // Calculate remaining time
  const timeRemainingMs = currentState.endTime
    ? Math.max(0, currentState.endTime - Date.now())
    : currentState.timeRemainingMs;

  const newState: PomodoroState = {
    ...currentState,
    isRunning: false,
    timeRemainingMs,
    endTime: null,
  };

  // Clear the alarm
  await browser.alarms.clear(ALARM_NAMES.POMODORO_END);

  await savePomodoroState(newState);

  logger.info('Pomodoro paused', { timeRemainingMs });
  return newState;
}

/**
 * Resume the pomodoro timer
 */
export async function resumePomodoro(): Promise<PomodoroState> {
  const currentState = await getPomodoroState();

  if (currentState.isRunning) {
    throw new Error('Pomodoro timer is already running');
  }

  if (currentState.mode === 'idle') {
    throw new Error('No pomodoro session to resume');
  }

  const now = Date.now();
  const endTime = now + currentState.timeRemainingMs;

  const newState: PomodoroState = {
    ...currentState,
    isRunning: true,
    endTime,
  };

  // Create alarm for pomodoro end
  await browser.alarms.create(ALARM_NAMES.POMODORO_END, {
    when: endTime,
  });

  await savePomodoroState(newState);

  logger.info('Pomodoro resumed', {
    timeRemainingMs: currentState.timeRemainingMs,
  });
  return newState;
}

/**
 * Stop the pomodoro timer and reset
 */
export async function stopPomodoro(): Promise<PomodoroState> {
  // Clear any alarms
  await browser.alarms.clear(ALARM_NAMES.POMODORO_END);

  await savePomodoroState(DEFAULT_POMODORO_STATE);

  logger.info('Pomodoro stopped');
  return DEFAULT_POMODORO_STATE;
}

/**
 * Skip to the next pomodoro session
 */
export async function skipPomodoro(): Promise<PomodoroState> {
  const settings = await getSettings();
  const currentState = await getPomodoroState();

  // Clear any existing alarm
  await browser.alarms.clear(ALARM_NAMES.POMODORO_END);

  let nextMode: PomodoroMode;
  let newSessionCount = currentState.sessionCount;

  switch (currentState.mode) {
    case 'work':
      // Increment session count
      newSessionCount++;
      // Check if it's time for a long break
      if (newSessionCount >= settings.pomodoro.sessionsBeforeLongBreak) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'break';
      }
      break;
    case 'break':
      nextMode = 'work';
      break;
    case 'longBreak':
      // Reset session count after long break
      newSessionCount = 0;
      nextMode = 'work';
      break;
    default:
      // If idle, start work
      nextMode = 'work';
      break;
  }

  // Update session count first
  const intermediateState: PomodoroState = {
    ...DEFAULT_POMODORO_STATE,
    sessionCount: newSessionCount,
  };
  await savePomodoroState(intermediateState);

  // Auto-start if enabled
  const shouldAutoStart =
    nextMode === 'break' || nextMode === 'longBreak'
      ? settings.pomodoro.autoStartBreaks
      : settings.pomodoro.autoStartWork;

  if (shouldAutoStart) {
    return await startPomodoro(nextMode);
  }

  // Otherwise, set to idle with the new mode ready
  const idleState: PomodoroState = {
    isRunning: false,
    mode: nextMode,
    timeRemainingMs: await getPomodoroDuration(nextMode),
    sessionCount: newSessionCount,
    startedAt: null,
    endTime: null,
  };

  await savePomodoroState(idleState);

  logger.info('Pomodoro skipped', { nextMode, sessionCount: newSessionCount });
  return idleState;
}

/**
 * Mirror an external pomodoro timer (adalab study web app).
 * The external app is the source of truth: work keeps blocking active,
 * break/longBreak unblock content, idle resets to the default state.
 */
export async function syncExternalPomodoro(payload: {
  readonly phase: 'work' | 'short_break' | 'long_break' | 'idle';
  readonly running: boolean;
  readonly endTime: number | null;
}): Promise<PomodoroState> {
  const currentState = await getPomodoroState();

  if (!payload.running || payload.phase === 'idle') {
    await browser.alarms.clear(ALARM_NAMES.POMODORO_END);
    const idleState: PomodoroState = {
      ...DEFAULT_POMODORO_STATE,
      sessionCount: currentState.sessionCount,
    };
    await savePomodoroState(idleState);
    logger.info('External pomodoro sync: idle');
    return idleState;
  }

  const mode: PomodoroMode =
    payload.phase === 'work'
      ? 'work'
      : payload.phase === 'short_break'
        ? 'break'
        : 'longBreak';

  const now = Date.now();
  const endTime = payload.endTime ?? now;
  const timeRemainingMs = Math.max(0, endTime - now);

  const newState: PomodoroState = {
    isRunning: true,
    mode,
    timeRemainingMs,
    sessionCount: currentState.sessionCount,
    startedAt: now,
    endTime,
  };

  // Keep the end alarm so the phase resolves even if the adalab tab closes
  await browser.alarms.create(ALARM_NAMES.POMODORO_END, { when: endTime });
  await savePomodoroState(newState);

  logger.info('External pomodoro sync', { mode, timeRemainingMs });
  return newState;
}

/**
 * Handle pomodoro timer completion
 */
async function handlePomodoroComplete(
  state: PomodoroState
): Promise<PomodoroState> {
  const settings = await getSettings();

  let nextMode: PomodoroMode;
  let newSessionCount = state.sessionCount;

  switch (state.mode) {
    case 'work':
      newSessionCount++;
      if (newSessionCount >= settings.pomodoro.sessionsBeforeLongBreak) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'break';
      }
      break;
    case 'break':
      nextMode = 'work';
      break;
    case 'longBreak':
      newSessionCount = 0;
      nextMode = 'work';
      break;
    default:
      nextMode = 'idle';
      break;
  }

  // Show notification
  if (settings.pomodoro.soundEnabled) {
    await showPomodoroNotification('completed', state.mode);
  }

  // Auto-start next session if enabled
  const shouldAutoStart =
    nextMode === 'break' || nextMode === 'longBreak'
      ? settings.pomodoro.autoStartBreaks
      : settings.pomodoro.autoStartWork;

  if (shouldAutoStart && nextMode !== 'idle') {
    // Update session count before starting
    const tempState: PomodoroState = {
      ...DEFAULT_POMODORO_STATE,
      sessionCount: newSessionCount,
    };
    await savePomodoroState(tempState);
    return await startPomodoro(nextMode);
  }

  // Set next mode as ready but not running
  const nextDuration = await getPomodoroDuration(nextMode);
  const newState: PomodoroState = {
    isRunning: false,
    mode: nextMode,
    timeRemainingMs: nextDuration,
    sessionCount: newSessionCount,
    startedAt: null,
    endTime: null,
  };

  await savePomodoroState(newState);
  return newState;
}

/**
 * Handle pomodoro alarm
 */
async function handlePomodoroEnd(): Promise<void> {
  const state = await getPomodoroState();

  if (state.isRunning && state.mode !== 'idle') {
    await handlePomodoroComplete(state);
    logger.info('Pomodoro timer completed via alarm');
  }
}

/**
 * Show pomodoro notification
 */
async function showPomodoroNotification(
  type: 'started' | 'completed',
  mode: PomodoroMode
): Promise<void> {
  try {
    const modeNames: Record<PomodoroMode, string> = {
      work: 'Work',
      break: 'Break',
      longBreak: 'Long Break',
      idle: 'Idle',
    };

    const modeName = modeNames[mode];

    const titles: Record<typeof type, string> = {
      started: `${modeName} Started`,
      completed: `${modeName} Complete!`,
    };

    const messages: Record<typeof type, string> = {
      started:
        mode === 'work' ? 'Time to focus!' : 'Take a break, you earned it!',
      completed:
        mode === 'work'
          ? 'Great work! Time for a break.'
          : 'Break over! Ready to focus?',
    };

    await browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('icons/icon-128.png'),
      title: titles[type],
      message: messages[type],
    });
  } catch (error) {
    logger.debug('Could not show pomodoro notification', { error });
  }
}

/**
 * Initialize timer listeners
 */
export function initializeTimers(): void {
  browser.alarms.onAlarm.addListener((alarm) => {
    void handleAlarm(alarm);
  });
  logger.info('Timer listeners initialized');

  // Check for any stale focus state on startup
  void getFocusState().then((state) => {
    if (state.isActive) {
      logger.info('Active focus session detected on startup', {
        endTime: state.endTime,
        remaining: state.endTime
          ? Math.round((state.endTime - Date.now()) / 1000 / 60)
          : 0,
      });
    }
  });

  // Check for any active pomodoro timer on startup
  void getPomodoroState().then((state) => {
    if (state.isRunning) {
      logger.info('Active pomodoro session detected on startup', {
        mode: state.mode,
        remaining: state.timeRemainingMs
          ? Math.round(state.timeRemainingMs / 1000 / 60)
          : 0,
      });
    }
  });

  // Set up daily reset alarm for time limits
  void setupTimeLimitsResetAlarm();
  // Check if time limits need reset on startup
  void checkTimeLimitsReset();

  // Set up streak check alarm and check on startup
  void setupStreakCheckAlarm();
  void checkStreakDay();
}

// =============================================================================
// TIME LIMITS
// =============================================================================

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

/**
 * Get current time limits state from storage
 */
export async function getTimeLimitsState(): Promise<TimeLimitsState> {
  try {
    const result = await browser.storage.local.get(
      STORAGE_KEYS.TIME_LIMITS_STATE
    );
    const state = result[STORAGE_KEYS.TIME_LIMITS_STATE] as
      | TimeLimitsState
      | undefined;

    if (!state) {
      return DEFAULT_TIME_LIMITS_STATE;
    }

    // Check if we need to reset for a new day
    const today = getTodayDateString();
    if (state.lastResetDate !== today) {
      logger.info('New day detected, resetting time limits usage');
      const resetState: TimeLimitsState = {
        usage: [],
        lastResetDate: today,
      };
      await saveTimeLimitsState(resetState);
      return resetState;
    }

    return state;
  } catch (error) {
    logger.error('Failed to get time limits state', { error });
    return DEFAULT_TIME_LIMITS_STATE;
  }
}

/**
 * Save time limits state to storage
 */
export async function saveTimeLimitsState(
  state: TimeLimitsState
): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.TIME_LIMITS_STATE]: state,
    });
    logger.debug('Time limits state saved', { usageCount: state.usage.length });
  } catch (error) {
    logger.error('Failed to save time limits state', { error });
    throw error;
  }
}

/**
 * Track time activity for a platform
 */
export async function trackTimeActivity(
  platform: Platform,
  durationMs: number
): Promise<SiteTimeUsage> {
  const settings = await getSettings();

  // Only track if time limits are enabled
  if (!settings.timeLimits.enabled) {
    const emptyUsage: SiteTimeUsage = {
      platform,
      usedTodayMs: 0,
      lastActiveAt: null,
      date: getTodayDateString(),
    };
    return emptyUsage;
  }

  const state = await getTimeLimitsState();
  const today = getTodayDateString();
  const now = Date.now();

  // Find existing usage for this platform
  const existingIndex = state.usage.findIndex((u) => u.platform === platform);
  let updatedUsage: SiteTimeUsage;

  if (existingIndex >= 0) {
    const existing = state.usage[existingIndex]!;
    updatedUsage = {
      platform,
      usedTodayMs: existing.usedTodayMs + durationMs,
      lastActiveAt: now,
      date: today,
    };
  } else {
    updatedUsage = {
      platform,
      usedTodayMs: durationMs,
      lastActiveAt: now,
      date: today,
    };
  }

  // Update state
  const newUsage =
    existingIndex >= 0
      ? state.usage.map((u, i) => (i === existingIndex ? updatedUsage : u))
      : [...state.usage, updatedUsage];

  const newState: TimeLimitsState = {
    usage: newUsage,
    lastResetDate: state.lastResetDate,
  };

  await saveTimeLimitsState(newState);

  logger.debug('Time activity tracked', {
    platform,
    addedMs: durationMs,
    totalMs: updatedUsage.usedTodayMs,
  });

  return updatedUsage;
}

/**
 * Check if time limit is reached for a platform
 */
export async function checkTimeLimit(
  platform: Platform
): Promise<TimeCheckLimitResult> {
  const settings = await getSettings();
  const state = await getTimeLimitsState();

  // Find the limit for this platform
  const limit = settings.timeLimits.limits.find(
    (l) => l.platform === platform && l.enabled
  );

  // Find the usage for this platform
  const usage = state.usage.find((u) => u.platform === platform);
  const usedMs = usage?.usedTodayMs ?? 0;

  // If no limit is configured or time limits are disabled
  if (!settings.timeLimits.enabled || !limit) {
    return {
      platform,
      limitReached: false,
      usedMs,
      limitMs: 0,
      remainingMs: 0,
      percentUsed: 0,
    };
  }

  const limitMs = limit.dailyLimitMinutes * 60 * 1000;
  const remainingMs = Math.max(0, limitMs - usedMs);
  const percentUsed = limitMs > 0 ? Math.min(100, (usedMs / limitMs) * 100) : 0;
  const limitReached = usedMs >= limitMs;

  return {
    platform,
    limitReached,
    usedMs,
    limitMs,
    remainingMs,
    percentUsed,
  };
}

/**
 * Reset time usage for a platform or all platforms
 */
export async function resetTimeUsage(
  platform?: Platform
): Promise<TimeLimitsState> {
  const state = await getTimeLimitsState();
  const today = getTodayDateString();

  let newUsage: readonly SiteTimeUsage[];

  if (platform) {
    // Reset only specific platform
    newUsage = state.usage.filter((u) => u.platform !== platform);
    logger.info('Time usage reset for platform', { platform });
  } else {
    // Reset all
    newUsage = [];
    logger.info('Time usage reset for all platforms');
  }

  const newState: TimeLimitsState = {
    usage: newUsage,
    lastResetDate: today,
  };

  await saveTimeLimitsState(newState);
  return newState;
}

/**
 * Handle time limits reset alarm (daily reset)
 */
async function handleTimeLimitsReset(): Promise<void> {
  logger.info('Daily time limits reset triggered');
  await resetTimeUsage();

  // Reschedule for next day
  await setupTimeLimitsResetAlarm();
}

/**
 * Set up alarm for daily time limits reset at midnight
 */
async function setupTimeLimitsResetAlarm(): Promise<void> {
  // Clear any existing alarm
  await browser.alarms.clear(ALARM_NAMES.TIME_LIMITS_RESET);

  // Calculate time until midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  // Create alarm for midnight
  await browser.alarms.create(ALARM_NAMES.TIME_LIMITS_RESET, {
    delayInMinutes: msUntilMidnight / 1000 / 60,
  });

  logger.debug('Time limits reset alarm scheduled', {
    minutesUntilMidnight: Math.round(msUntilMidnight / 1000 / 60),
  });
}

/**
 * Check if time limits need reset (e.g., on browser startup after midnight)
 */
async function checkTimeLimitsReset(): Promise<void> {
  const state = await getTimeLimitsState();
  const today = getTodayDateString();

  if (state.lastResetDate !== today) {
    logger.info('Detected stale time limits, resetting');
    // Save yesterday's data to history before resetting
    await saveToTimeTrackingHistory(state);
    await resetTimeUsage();
  }
}

// =============================================================================
// TIME TRACKING HISTORY
// =============================================================================

/**
 * Get time tracking history state from storage
 */
export async function getTimeTrackingState(): Promise<TimeTrackingState> {
  try {
    const result = await browser.storage.local.get(
      STORAGE_KEYS.TIME_TRACKING_STATE
    );
    const state = result[STORAGE_KEYS.TIME_TRACKING_STATE] as
      | TimeTrackingState
      | undefined;

    if (!state) {
      return DEFAULT_TIME_TRACKING_STATE;
    }

    return state;
  } catch (error) {
    logger.error('Failed to get time tracking state', { error });
    return DEFAULT_TIME_TRACKING_STATE;
  }
}

/**
 * Save time tracking history state to storage
 */
export async function saveTimeTrackingState(
  state: TimeTrackingState
): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.TIME_TRACKING_STATE]: state,
    });
    logger.debug('Time tracking state saved', {
      historyLength: state.history.length,
    });
  } catch (error) {
    logger.error('Failed to save time tracking state', { error });
    throw error;
  }
}

/**
 * Save today's time usage to history (called before daily reset)
 */
async function saveToTimeTrackingHistory(
  timeLimitsState: TimeLimitsState
): Promise<void> {
  const settings = await getSettings();

  // Only save if time tracking is enabled
  if (!settings.timeTracking.enabled) {
    return;
  }

  // Only save if there's usage data to record
  if (timeLimitsState.usage.length === 0) {
    return;
  }

  const state = await getTimeTrackingState();

  // Create a daily record from the usage data
  const byPlatform: Partial<Record<Platform, number>> = {};
  let totalMs = 0;

  for (const usage of timeLimitsState.usage) {
    byPlatform[usage.platform] = usage.usedTodayMs;
    totalMs += usage.usedTodayMs;
  }

  const dailyRecord: DailyTimeRecord = {
    date: timeLimitsState.lastResetDate,
    byPlatform,
    totalMs,
  };

  // Add to history, avoiding duplicates
  const existingIndex = state.history.findIndex(
    (r) => r.date === dailyRecord.date
  );
  let newHistory: DailyTimeRecord[];

  if (existingIndex >= 0) {
    // Update existing record (merge data)
    const existing = state.history[existingIndex]!;
    const mergedByPlatform: Partial<Record<Platform, number>> = {
      ...existing.byPlatform,
    };

    for (const [platform, ms] of Object.entries(byPlatform)) {
      const platformKey = platform as Platform;
      mergedByPlatform[platformKey] =
        (mergedByPlatform[platformKey] ?? 0) + (ms ?? 0);
    }

    const mergedRecord: DailyTimeRecord = {
      date: dailyRecord.date,
      byPlatform: mergedByPlatform,
      totalMs: existing.totalMs + totalMs,
    };

    newHistory = [
      ...state.history.slice(0, existingIndex),
      mergedRecord,
      ...state.history.slice(existingIndex + 1),
    ];
  } else {
    newHistory = [...state.history, dailyRecord];
  }

  // Prune old records based on retention period
  const retentionDays = settings.timeTracking.retentionDays;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffDateString = cutoffDate.toISOString().split('T')[0] ?? '';

  newHistory = newHistory.filter((record) => record.date >= cutoffDateString);

  // Sort by date descending (most recent first)
  newHistory.sort((a, b) => b.date.localeCompare(a.date));

  const newState: TimeTrackingState = {
    history: newHistory,
    lastUpdated: Date.now(),
  };

  await saveTimeTrackingState(newState);
  logger.info('Time tracking history updated', {
    date: dailyRecord.date,
    totalMs,
  });
}

/**
 * Get time tracking history, optionally limited to a number of days
 */
export async function getTimeTrackingHistory(
  days?: number
): Promise<TimeTrackingState> {
  const settings = await getSettings();
  const state = await getTimeTrackingState();

  // Include today's data in the history view
  const timeLimitsState = await getTimeLimitsState();
  const today = getTodayDateString();

  // Create today's record if there's usage
  let historyWithToday = [...state.history];

  if (timeLimitsState.usage.length > 0) {
    const byPlatform: Partial<Record<Platform, number>> = {};
    let totalMs = 0;

    for (const usage of timeLimitsState.usage) {
      byPlatform[usage.platform] = usage.usedTodayMs;
      totalMs += usage.usedTodayMs;
    }

    const todayRecord: DailyTimeRecord = {
      date: today,
      byPlatform,
      totalMs,
    };

    // Check if today already exists in history
    const todayIndex = historyWithToday.findIndex((r) => r.date === today);
    if (todayIndex >= 0) {
      historyWithToday[todayIndex] = todayRecord;
    } else {
      historyWithToday = [todayRecord, ...historyWithToday];
    }
  }

  // Filter by number of days if specified
  if (days !== undefined && days > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0] ?? '';

    historyWithToday = historyWithToday.filter(
      (record) => record.date >= cutoffDateString
    );
  }

  // Apply retention limit
  const retentionDays = settings.timeTracking.retentionDays;
  const retentionCutoff = new Date();
  retentionCutoff.setDate(retentionCutoff.getDate() - retentionDays);
  const retentionCutoffString =
    retentionCutoff.toISOString().split('T')[0] ?? '';

  historyWithToday = historyWithToday.filter(
    (record) => record.date >= retentionCutoffString
  );

  // Sort by date descending
  historyWithToday.sort((a, b) => b.date.localeCompare(a.date));

  return {
    history: historyWithToday,
    lastUpdated: state.lastUpdated,
  };
}

/**
 * Clear time tracking history
 */
export async function clearTimeTrackingHistory(): Promise<TimeTrackingState> {
  const newState: TimeTrackingState = {
    history: [],
    lastUpdated: Date.now(),
  };

  await saveTimeTrackingState(newState);
  logger.info('Time tracking history cleared');

  return newState;
}

// =============================================================================
// STREAK TRACKING
// =============================================================================

/**
 * Get streak data from storage
 */
export async function getStreakData(): Promise<StreakData> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.STREAK_DATA);
    const data = result[STORAGE_KEYS.STREAK_DATA] as StreakData | undefined;

    if (!data) {
      return DEFAULT_STREAK_DATA;
    }

    return data;
  } catch (error) {
    logger.error('Failed to get streak data', { error });
    return DEFAULT_STREAK_DATA;
  }
}

/**
 * Save streak data to storage
 */
export async function saveStreakData(data: StreakData): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.STREAK_DATA]: data,
    });
    logger.debug('Streak data saved', { currentStreak: data.currentStreak });
  } catch (error) {
    logger.error('Failed to save streak data', { error });
    throw error;
  }
}

/**
 * Check if yesterday was a successful day for streak goals
 */
async function wasYesterdaySuccessful(): Promise<boolean> {
  const settings = await getSettings();

  if (!settings.streak.enabled) {
    return false;
  }

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0] ?? '';

  // Check based on goal type
  switch (settings.streak.goalType) {
    case 'focus_time': {
      // Check if there was enough focus time yesterday
      const history = await getTimeTrackingHistory(1);
      const yesterdayRecord = history.history.find(
        (r) => r.date === yesterdayString
      );

      if (!yesterdayRecord) {
        return false;
      }

      const focusMinutes = yesterdayRecord.totalMs / 1000 / 60;
      return focusMinutes >= settings.streak.minFocusMinutes;
    }

    case 'blocks': {
      // Since we can't access yesterday's blocks directly (they reset daily),
      // we check if there was any tracked usage as a proxy for activity
      const history = await getTimeTrackingHistory(1);
      const yesterdayRecord = history.history.find(
        (r) => r.date === yesterdayString
      );

      // If there was any tracking activity, consider it a day with blocks
      return yesterdayRecord !== undefined && yesterdayRecord.totalMs > 0;
    }

    case 'no_access': {
      // Check if there was NO access to blocked platforms yesterday
      const history = await getTimeTrackingHistory(1);
      const yesterdayRecord = history.history.find(
        (r) => r.date === yesterdayString
      );

      // Success if no usage was tracked
      return !yesterdayRecord || yesterdayRecord.totalMs === 0;
    }

    default:
      return false;
  }
}

/**
 * Check if today qualifies as a successful day (for checking current streak)
 */
async function isTodaySuccessful(): Promise<boolean> {
  const settings = await getSettings();

  if (!settings.streak.enabled) {
    return false;
  }

  const timeLimitsState = await getTimeLimitsState();

  switch (settings.streak.goalType) {
    case 'focus_time': {
      // Calculate today's total time
      let totalMs = 0;
      for (const usage of timeLimitsState.usage) {
        totalMs += usage.usedTodayMs;
      }
      const focusMinutes = totalMs / 1000 / 60;
      return focusMinutes >= settings.streak.minFocusMinutes;
    }

    case 'blocks': {
      // Check blocks today from stats
      const settingsData = await getSettings();
      return settingsData.stats.blockedToday >= settings.streak.minBlocks;
    }

    case 'no_access': {
      // Success if no usage today
      let totalMs = 0;
      for (const usage of timeLimitsState.usage) {
        totalMs += usage.usedTodayMs;
      }
      return totalMs === 0;
    }

    default:
      return false;
  }
}

/**
 * Check and update streak for the current day
 */
export async function checkStreakDay(): Promise<StreakData> {
  const settings = await getSettings();

  if (!settings.streak.enabled) {
    return await getStreakData();
  }

  const streakData = await getStreakData();
  const today = getTodayDateString();

  // If we already checked today, just verify current day's status
  if (streakData.lastActiveDate === today) {
    // Check if today is still successful
    const todaySuccess = await isTodaySuccessful();

    if (todaySuccess && streakData.currentStreak === 0) {
      // Today became successful, increment streak
      const newStreak = streakData.currentStreak + 1;
      const newData = await updateStreakData(newStreak, today, streakData);
      return newData;
    }

    return streakData;
  }

  // New day - check yesterday's status
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0] ?? '';

  // Calculate the expected last active date for a continuous streak
  if (streakData.lastActiveDate === yesterdayString) {
    // Yesterday was the last active date, check if it was successful
    const yesterdaySuccess = await wasYesterdaySuccessful();

    if (yesterdaySuccess) {
      // Yesterday was successful, check if today is successful too
      const todaySuccess = await isTodaySuccessful();

      if (todaySuccess) {
        // Continue the streak
        const newStreak = streakData.currentStreak + 1;
        const newData = await updateStreakData(newStreak, today, streakData);
        return newData;
      }

      // Today not yet successful, just update last checked date but keep streak
      const newData: StreakData = {
        ...streakData,
        lastActiveDate: today,
      };
      await saveStreakData(newData);
      return newData;
    }

    // Yesterday was not successful, break the streak
    const newData: StreakData = {
      ...streakData,
      currentStreak: 0,
      lastActiveDate: today,
    };
    await saveStreakData(newData);

    logger.info('Streak broken', { previousStreak: streakData.currentStreak });
    return newData;
  }

  // More than one day has passed, streak is broken
  if (streakData.currentStreak > 0) {
    logger.info('Streak broken due to gap', {
      lastActive: streakData.lastActiveDate,
      previousStreak: streakData.currentStreak,
    });
  }

  const todaySuccess = await isTodaySuccessful();
  const newStreak = todaySuccess ? 1 : 0;

  const newData: StreakData = {
    ...streakData,
    currentStreak: newStreak,
    lastActiveDate: today,
    totalFocusDays: todaySuccess
      ? streakData.totalFocusDays + 1
      : streakData.totalFocusDays,
  };

  await saveStreakData(newData);
  return newData;
}

/**
 * Update streak data with new streak value and check milestones
 */
async function updateStreakData(
  newStreak: number,
  today: string,
  currentData: StreakData
): Promise<StreakData> {
  const settings = await getSettings();

  // Check for new milestones
  const newMilestones = [...currentData.achievedMilestones];
  let newMilestoneAchieved = false;

  for (const milestone of STREAK_MILESTONES) {
    if (newStreak >= milestone && !newMilestones.includes(milestone)) {
      newMilestones.push(milestone);
      newMilestoneAchieved = true;
      logger.info('Milestone achieved', { milestone, streak: newStreak });
    }
  }

  const newData: StreakData = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, currentData.longestStreak),
    lastActiveDate: today,
    totalFocusDays: currentData.totalFocusDays + 1,
    achievedMilestones: newMilestones,
  };

  await saveStreakData(newData);

  // Show notification for new milestone
  if (newMilestoneAchieved && settings.streak.showNotifications) {
    await showStreakNotification('milestone', newStreak);
  }

  return newData;
}

/**
 * Reset streak data
 */
export async function resetStreakData(): Promise<StreakData> {
  await saveStreakData(DEFAULT_STREAK_DATA);
  logger.info('Streak data reset');
  return DEFAULT_STREAK_DATA;
}

/**
 * Handle streak check alarm (called daily)
 */
async function handleStreakCheck(): Promise<void> {
  logger.info('Daily streak check triggered');
  await checkStreakDay();

  // Reschedule for next day
  await setupStreakCheckAlarm();
}

/**
 * Set up alarm for daily streak check (end of day)
 */
async function setupStreakCheckAlarm(): Promise<void> {
  // Clear any existing alarm
  await browser.alarms.clear(ALARM_NAMES.STREAK_CHECK);

  // Calculate time until end of day (11:59 PM)
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 0, 0);

  // If it's past 11:59 PM, schedule for tomorrow
  if (now >= endOfDay) {
    endOfDay.setDate(endOfDay.getDate() + 1);
  }

  const msUntilEndOfDay = endOfDay.getTime() - now.getTime();

  // Create alarm
  await browser.alarms.create(ALARM_NAMES.STREAK_CHECK, {
    delayInMinutes: msUntilEndOfDay / 1000 / 60,
  });

  logger.debug('Streak check alarm scheduled', {
    minutesUntilCheck: Math.round(msUntilEndOfDay / 1000 / 60),
  });
}

/**
 * Show streak notification
 */
async function showStreakNotification(
  type: 'milestone' | 'broken',
  streak: number
): Promise<void> {
  try {
    const titles: Record<typeof type, string> = {
      milestone: 'Streak Milestone!',
      broken: 'Streak Broken',
    };

    const messages: Record<typeof type, string> = {
      milestone: `Amazing! You've reached a ${streak}-day streak!`,
      broken: 'Your streak has been reset. Start fresh today!',
    };

    await browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('icons/icon-128.png'),
      title: titles[type],
      message: messages[type],
    });
  } catch (error) {
    logger.debug('Could not show streak notification', { error });
  }
}

// ============================================================================
// Challenge Mode Functions
// ============================================================================

/**
 * Get current challenge state from storage
 */
export async function getChallengeState(): Promise<ChallengeState> {
  try {
    const result = await browser.storage.local.get(
      STORAGE_KEYS.CHALLENGE_STATE
    );
    const state = result[STORAGE_KEYS.CHALLENGE_STATE] as
      | ChallengeState
      | undefined;

    if (!state) {
      return DEFAULT_CHALLENGE_STATE;
    }

    // Check if current challenge has expired
    if (state.currentChallenge && !isChallengeValid(state.currentChallenge)) {
      const newState: ChallengeState = {
        ...state,
        currentChallenge: null,
      };
      await saveChallengeState(newState);
      return newState;
    }

    return state;
  } catch (error) {
    logger.error('Failed to get challenge state', { error });
    return DEFAULT_CHALLENGE_STATE;
  }
}

/**
 * Save challenge state to storage
 */
export async function saveChallengeState(state: ChallengeState): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.CHALLENGE_STATE]: state,
    });
    logger.debug('Challenge state saved');
  } catch (error) {
    logger.error('Failed to save challenge state', { error });
    throw error;
  }
}

/**
 * Request a new challenge for bypass
 */
export async function requestChallenge(): Promise<ChallengeData> {
  const settings = await getSettings();

  if (!settings.challenge.enabled) {
    throw new Error('Challenge mode is disabled');
  }

  if (settings.challenge.disableBypassEntirely) {
    throw new Error('Bypass is disabled');
  }

  const state = await getChallengeState();

  // Check cooldown
  if (state.lastBypassAt !== null) {
    const cooldownEnd =
      state.lastBypassAt + settings.challenge.cooldownSeconds * 1000;
    if (Date.now() < cooldownEnd) {
      const remainingSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000);
      throw new Error(
        `Cooldown active. Please wait ${remainingSeconds} seconds.`
      );
    }
  }

  // Generate new challenge
  const challenge = generateChallenge(
    settings.challenge.challengeType,
    settings.challenge.difficulty
  );

  // Save state with new challenge
  const newState: ChallengeState = {
    ...state,
    currentChallenge: challenge,
  };
  await saveChallengeState(newState);

  logger.info('Challenge generated', {
    type: challenge.type,
    difficulty: challenge.difficulty,
  });

  return challenge;
}

/**
 * Submit a challenge answer
 */
export async function submitChallengeAnswer(
  userAnswer: string
): Promise<ChallengeSubmitResult> {
  const settings = await getSettings();

  if (!settings.challenge.enabled) {
    throw new Error('Challenge mode is disabled');
  }

  const state = await getChallengeState();

  if (!state.currentChallenge) {
    throw new Error('No active challenge');
  }

  // Verify answer
  const correct = verifyChallengeAnswer(state.currentChallenge, userAnswer);

  if (correct) {
    // Grant bypass
    const newState: ChallengeState = {
      lastBypassAt: Date.now(),
      failedAttempts: 0,
      currentChallenge: null,
    };
    await saveChallengeState(newState);

    logger.info('Challenge completed successfully');

    return {
      correct: true,
      bypassGranted: true,
      bypassDurationSeconds: CHALLENGE_BYPASS_DURATION_SECONDS,
      newState,
    };
  } else {
    // Wrong answer
    const newState: ChallengeState = {
      ...state,
      failedAttempts: state.failedAttempts + 1,
      currentChallenge: null, // Clear challenge, user needs to request new one
    };
    await saveChallengeState(newState);

    logger.info('Challenge failed', {
      failedAttempts: newState.failedAttempts,
    });

    return {
      correct: false,
      bypassGranted: false,
      bypassDurationSeconds: 0,
      newState,
    };
  }
}

/**
 * Check if bypass is currently active
 */
export async function isBypassActive(): Promise<boolean> {
  const settings = await getSettings();

  if (!settings.challenge.enabled) {
    return false; // Challenge mode disabled, use default bypass behavior
  }

  if (settings.challenge.disableBypassEntirely) {
    return false; // Bypass is never allowed
  }

  const state = await getChallengeState();

  if (state.lastBypassAt === null) {
    return false;
  }

  const bypassEnd =
    state.lastBypassAt + CHALLENGE_BYPASS_DURATION_SECONDS * 1000;
  return Date.now() < bypassEnd;
}

/**
 * Get remaining bypass time in seconds
 */
export async function getBypassRemainingSeconds(): Promise<number> {
  const settings = await getSettings();

  if (!settings.challenge.enabled) {
    return 0;
  }

  const state = await getChallengeState();

  if (state.lastBypassAt === null) {
    return 0;
  }

  const bypassEnd =
    state.lastBypassAt + CHALLENGE_BYPASS_DURATION_SECONDS * 1000;
  const remaining = bypassEnd - Date.now();

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// ========================================
// Lockdown Mode Functions
// ========================================

import { hashPin, verifyPin, isValidPinFormat } from '@/shared/utils/crypto';
import { DEFAULT_LOCKDOWN_STATE } from '@/shared/constants';
import type {
  LockdownState,
  LockdownVerifyPinResult,
  EmergencyBypassCheckResult,
} from '@/shared/types';

/**
 * Get lockdown state from storage
 */
export async function getLockdownState(): Promise<LockdownState> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.LOCKDOWN_STATE);
    const state = result[STORAGE_KEYS.LOCKDOWN_STATE] as
      | LockdownState
      | undefined;
    return state ?? DEFAULT_LOCKDOWN_STATE;
  } catch {
    return DEFAULT_LOCKDOWN_STATE;
  }
}

/**
 * Save lockdown state to storage
 */
async function saveLockdownState(state: LockdownState): Promise<void> {
  await browser.storage.local.set({
    [STORAGE_KEYS.LOCKDOWN_STATE]: state,
  });
}

/**
 * Set or update the lockdown PIN
 */
export async function setLockdownPin(
  pin: string,
  currentPin?: string
): Promise<void> {
  const settings = await getSettings();

  // Validate PIN format
  if (!isValidPinFormat(pin)) {
    throw new Error('PIN must be 4-8 digits');
  }

  // If PIN already exists, verify current PIN
  if (settings.lockdown.pinHash !== null) {
    if (!currentPin) {
      throw new Error('Current PIN required to change PIN');
    }
    const isValid = await verifyPin(currentPin, settings.lockdown.pinHash);
    if (!isValid) {
      throw new Error('Current PIN is incorrect');
    }
  }

  // Hash and save new PIN
  const pinHash = await hashPin(pin);
  await updateSettings({
    lockdown: {
      pinHash,
    },
  });

  logger.info('Lockdown PIN set/updated');
}

/**
 * Verify a lockdown PIN
 */
export async function verifyLockdownPin(
  pin: string
): Promise<LockdownVerifyPinResult> {
  const settings = await getSettings();

  if (settings.lockdown.pinHash === null) {
    return { valid: false };
  }

  const valid = await verifyPin(pin, settings.lockdown.pinHash);
  return { valid };
}

/**
 * Activate lockdown mode
 */
export async function activateLockdown(pin: string): Promise<LockdownState> {
  const settings = await getSettings();

  // Verify PIN
  if (settings.lockdown.pinHash === null) {
    throw new Error('PIN not set. Please set a PIN first.');
  }

  const isValid = await verifyPin(pin, settings.lockdown.pinHash);
  if (!isValid) {
    throw new Error('Invalid PIN');
  }

  // Activate lockdown
  const state: LockdownState = {
    isActive: true,
    activatedAt: Date.now(),
    emergencyBypassRequestedAt: null,
  };

  await saveLockdownState(state);
  logger.info('Lockdown mode activated');

  return state;
}

/**
 * Deactivate lockdown mode
 */
export async function deactivateLockdown(pin: string): Promise<LockdownState> {
  const settings = await getSettings();
  const currentState = await getLockdownState();

  if (!currentState.isActive) {
    return currentState; // Already inactive
  }

  // Verify PIN
  if (settings.lockdown.pinHash === null) {
    throw new Error('PIN not set');
  }

  const isValid = await verifyPin(pin, settings.lockdown.pinHash);
  if (!isValid) {
    throw new Error('Invalid PIN');
  }

  // Deactivate lockdown
  const state: LockdownState = {
    isActive: false,
    activatedAt: null,
    emergencyBypassRequestedAt: null,
  };

  await saveLockdownState(state);
  logger.info('Lockdown mode deactivated');

  return state;
}

/**
 * Request emergency bypass (starts the countdown)
 */
export async function requestEmergencyBypass(): Promise<LockdownState> {
  const currentState = await getLockdownState();

  if (!currentState.isActive) {
    throw new Error('Lockdown is not active');
  }

  if (currentState.emergencyBypassRequestedAt !== null) {
    // Already requested, return current state
    return currentState;
  }

  // Request emergency bypass
  const state: LockdownState = {
    ...currentState,
    emergencyBypassRequestedAt: Date.now(),
  };

  await saveLockdownState(state);
  logger.info('Emergency bypass requested');

  return state;
}

/**
 * Check emergency bypass status
 */
export async function checkEmergencyBypass(): Promise<EmergencyBypassCheckResult> {
  const settings = await getSettings();
  const currentState = await getLockdownState();

  if (!currentState.isActive) {
    return {
      requested: false,
      ready: false,
      remainingSeconds: 0,
    };
  }

  if (currentState.emergencyBypassRequestedAt === null) {
    return {
      requested: false,
      ready: false,
      remainingSeconds: settings.lockdown.emergencyBypassMinutes * 60,
    };
  }

  const elapsedMs = Date.now() - currentState.emergencyBypassRequestedAt;
  const requiredMs = settings.lockdown.emergencyBypassMinutes * 60 * 1000;
  const remainingMs = Math.max(0, requiredMs - elapsedMs);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const ready = remainingMs <= 0;

  // If ready, automatically deactivate lockdown
  if (ready) {
    const newState: LockdownState = {
      isActive: false,
      activatedAt: null,
      emergencyBypassRequestedAt: null,
    };
    await saveLockdownState(newState);
    logger.info('Emergency bypass completed, lockdown deactivated');
  }

  return {
    requested: true,
    ready,
    remainingSeconds,
  };
}

/**
 * Check if lockdown mode is currently active
 */
export async function isLockdownActive(): Promise<boolean> {
  const state = await getLockdownState();
  return state.isActive;
}

/**
 * Check if a PIN has been set
 */
export async function hasLockdownPinSet(): Promise<boolean> {
  const settings = await getSettings();
  return settings.lockdown.pinHash !== null;
}

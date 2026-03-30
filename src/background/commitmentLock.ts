/**
 * Commitment Lock background processing
 * Handles unlock flow logic, state management, and message handling
 */

import browser from 'webextension-polyfill';
import type {
  CommitmentLockState,
  UnlockCheckResult,
  UnlockFailureReason,
  UnlockAttempt,
  UnlockHistory,
  CommitmentLockStats,
  PremiumState,
} from '@/shared/types/commitmentLock';
import type { ChallengeData } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import {
  DEFAULT_COMMITMENT_LOCK_STATE,
  DEFAULT_UNLOCK_HISTORY,
  DEFAULT_PREMIUM_STATE,
  COMMITMENT_LOCK_COOLDOWN_ESCALATION,
} from '@/shared/constants/defaults';
import { getSettings } from '@/shared/utils/storage';
import {
  generateChallenge,
  verifyChallengeAnswer,
} from '@/shared/utils/challenges';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('commitmentLock');

// In-memory state for unlock flow
let currentUnlockFlow: {
  startedAt: number;
  intentionSubmitted: boolean;
  intentionText: string;
  challengesCompleted: number;
  challengesFailed: number;
  currentChallenge: ChallengeData | null;
} | null = null;

/**
 * Get Commitment Lock state from storage
 */
export async function getCommitmentLockState(): Promise<CommitmentLockState> {
  try {
    const result = await browser.storage.local.get(
      STORAGE_KEYS.COMMITMENT_LOCK_STATE
    );
    const stored = result[STORAGE_KEYS.COMMITMENT_LOCK_STATE];

    if (stored && typeof stored === 'object') {
      return {
        ...DEFAULT_COMMITMENT_LOCK_STATE,
        ...stored,
      } as CommitmentLockState;
    }
  } catch (error) {
    logger.error('Failed to get Commitment Lock state', { error });
  }

  return DEFAULT_COMMITMENT_LOCK_STATE;
}

/**
 * Save Commitment Lock state to storage
 */
export async function saveCommitmentLockState(
  state: CommitmentLockState
): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.COMMITMENT_LOCK_STATE]: state,
    });
  } catch (error) {
    logger.error('Failed to save Commitment Lock state', { error });
    throw error;
  }
}

/**
 * Get unlock history from storage
 */
export async function getUnlockHistory(): Promise<UnlockHistory> {
  try {
    const result = await browser.storage.local.get(
      STORAGE_KEYS.COMMITMENT_LOCK_HISTORY
    );
    const stored = result[STORAGE_KEYS.COMMITMENT_LOCK_HISTORY];

    if (stored && typeof stored === 'object') {
      return { ...DEFAULT_UNLOCK_HISTORY, ...stored } as UnlockHistory;
    }
  } catch (error) {
    logger.error('Failed to get unlock history', { error });
  }

  return DEFAULT_UNLOCK_HISTORY;
}

/**
 * Save unlock history to storage
 */
export async function saveUnlockHistory(history: UnlockHistory): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.COMMITMENT_LOCK_HISTORY]: history,
    });
  } catch (error) {
    logger.error('Failed to save unlock history', { error });
    throw error;
  }
}

/**
 * Get premium state from storage
 */
export async function getPremiumState(): Promise<PremiumState> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.PREMIUM_STATE);
    const stored = result[STORAGE_KEYS.PREMIUM_STATE];

    if (stored && typeof stored === 'object') {
      return { ...DEFAULT_PREMIUM_STATE, ...stored } as PremiumState;
    }
  } catch (error) {
    logger.error('Failed to get premium state', { error });
  }

  return DEFAULT_PREMIUM_STATE;
}

/**
 * Get Monday of the current week
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
 * Check and reset daily/weekly counters if needed
 */
async function checkAndResetCounters(
  state: CommitmentLockState
): Promise<CommitmentLockState> {
  const today = new Date().toISOString().split('T')[0] ?? '';
  const monday = getMonday(new Date()).toISOString().split('T')[0] ?? '';

  let updatedState = { ...state };

  // Reset daily counters
  if (state.lastDailyResetDate !== today) {
    updatedState = {
      ...updatedState,
      todayAttempts: 0,
      todaySuccesses: 0,
      lastDailyResetDate: today,
      consecutiveFailures: 0, // Reset consecutive failures daily
    };
  }

  // Reset weekly counters
  if (state.lastWeeklyResetDate !== monday) {
    const settings = await getSettings();
    updatedState = {
      ...updatedState,
      weekAttempts: 0,
      weekSuccesses: 0,
      weeklyUnlocksRemaining: settings.commitmentLock.weeklyUnlockLimit,
      lastWeeklyResetDate: monday,
    };
  }

  return updatedState;
}

/**
 * Calculate cooldown duration based on consecutive failures
 */
function calculateCooldownMinutes(
  consecutiveFailures: number,
  escalatingEnabled: boolean
): number {
  if (!escalatingEnabled) {
    return COMMITMENT_LOCK_COOLDOWN_ESCALATION.baseMinutes;
  }

  const index = Math.min(
    consecutiveFailures,
    COMMITMENT_LOCK_COOLDOWN_ESCALATION.maxMultiplierIndex
  );
  const multiplier =
    COMMITMENT_LOCK_COOLDOWN_ESCALATION.multipliers[index] ?? 1;
  return COMMITMENT_LOCK_COOLDOWN_ESCALATION.baseMinutes * multiplier;
}

/**
 * Check if unlock is currently allowed
 */
export async function checkUnlockAllowed(): Promise<UnlockCheckResult> {
  const settings = await getSettings();
  let state = await getCommitmentLockState();

  // Check and reset counters if needed
  state = await checkAndResetCounters(state);
  await saveCommitmentLockState(state);

  // Check if Commitment Lock is enabled
  if (!settings.commitmentLock.enabled) {
    return { allowed: true };
  }

  // Check nuclear mode (Level 3)
  if (settings.commitmentLock.nuclearModeEnabled) {
    return {
      allowed: false,
      reason: 'nuclear_mode',
      message: 'Nuclear mode is enabled. Unlock is completely disabled.',
    };
  }

  // Check cooldown
  if (state.currentCooldownEndsAt && state.currentCooldownEndsAt > Date.now()) {
    const waitSeconds = Math.ceil(
      (state.currentCooldownEndsAt - Date.now()) / 1000
    );
    return {
      allowed: false,
      reason: 'cooldown_active',
      waitSeconds,
      message: `Cooldown active. Please wait ${Math.ceil(waitSeconds / 60)} minutes.`,
    };
  }

  // Check time lock (Level 3)
  if (
    settings.commitmentLock.timeLockEnabled &&
    state.timeLockEndsAt &&
    state.timeLockEndsAt > Date.now()
  ) {
    const waitSeconds = Math.ceil((state.timeLockEndsAt - Date.now()) / 1000);
    return {
      allowed: false,
      reason: 'time_lock_active',
      waitSeconds,
      message: `Time lock active. Please wait ${Math.ceil(waitSeconds / 3600)} hours.`,
    };
  }

  // Check weekly limit (Level 3)
  if (
    settings.commitmentLock.level === 3 &&
    state.weeklyUnlocksRemaining <= 0
  ) {
    return {
      allowed: false,
      reason: 'weekly_limit_reached',
      message: 'Weekly unlock limit reached. Try again next week.',
    };
  }

  // Check schedule restriction (Level 3)
  if (
    settings.commitmentLock.scheduleRestriction &&
    settings.commitmentLock.allowedUnlockHours
  ) {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = settings.commitmentLock.allowedUnlockHours;

    // Handle wrap-around (e.g., 22:00 to 06:00)
    let isAllowed: boolean;
    if (start <= end) {
      isAllowed = currentHour >= start && currentHour < end;
    } else {
      isAllowed = currentHour >= start || currentHour < end;
    }

    if (!isAllowed) {
      return {
        allowed: false,
        reason: 'outside_allowed_hours',
        message: `Unlock only allowed between ${start}:00 and ${end}:00.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Start the unlock flow
 */
export async function startUnlockFlow(): Promise<{
  success: boolean;
  waitSecondsRemaining: number;
  state: CommitmentLockState;
  error?: string;
}> {
  // Check if unlock is allowed
  const checkResult = await checkUnlockAllowed();
  if (!checkResult.allowed) {
    return {
      success: false,
      waitSecondsRemaining: checkResult.waitSeconds ?? 0,
      state: await getCommitmentLockState(),
      error: checkResult.message,
    };
  }

  const settings = await getSettings();
  let state = await getCommitmentLockState();

  // Update state for new attempt
  state = {
    ...state,
    lastAttemptAt: Date.now(),
    todayAttempts: state.todayAttempts + 1,
    weekAttempts: state.weekAttempts + 1,
    inProgressChallenge: null,
  };
  await saveCommitmentLockState(state);

  // Initialize unlock flow
  currentUnlockFlow = {
    startedAt: Date.now(),
    intentionSubmitted: false,
    intentionText: '',
    challengesCompleted: 0,
    challengesFailed: 0,
    currentChallenge: null,
  };

  logger.info('Started unlock flow', { level: settings.commitmentLock.level });

  return {
    success: true,
    waitSecondsRemaining: settings.commitmentLock.confirmationWaitSeconds,
    state,
  };
}

/**
 * Submit intention statement
 */
export async function submitIntention(intention: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!currentUnlockFlow) {
    return { success: false, error: 'No unlock flow in progress' };
  }

  const settings = await getSettings();

  if (intention.length < settings.commitmentLock.intentionMinLength) {
    return { success: false, error: 'Intention statement too short' };
  }

  currentUnlockFlow.intentionSubmitted = true;
  currentUnlockFlow.intentionText = intention;

  logger.info('Intention submitted', { length: intention.length });

  return { success: true };
}

/**
 * Request a challenge for the unlock flow
 */
export async function requestUnlockChallenge(): Promise<{
  success: boolean;
  challenge?: ChallengeData;
  error?: string;
}> {
  if (!currentUnlockFlow) {
    return { success: false, error: 'No unlock flow in progress' };
  }

  const settings = await getSettings();
  const challenge = generateChallenge(
    settings.challenge.challengeType,
    settings.challenge.difficulty
  );

  currentUnlockFlow.currentChallenge = challenge;

  // Update in-progress state
  const state = await getCommitmentLockState();
  await saveCommitmentLockState({
    ...state,
    inProgressChallenge: {
      startedAt: Date.now(),
      correctAnswers: currentUnlockFlow.challengesCompleted,
      totalQuestions: settings.commitmentLock.challengeCount,
      currentQuestionIndex: currentUnlockFlow.challengesCompleted + 1,
    },
  });

  return { success: true, challenge };
}

/**
 * Submit challenge answer
 */
export async function submitChallengeAnswer(answer: string): Promise<{
  success: boolean;
  correct: boolean;
  challengesRemaining: number;
  allCompleted: boolean;
  nextChallenge?: ChallengeData;
  state: CommitmentLockState;
  error?: string;
}> {
  if (!currentUnlockFlow || !currentUnlockFlow.currentChallenge) {
    const state = await getCommitmentLockState();
    return {
      success: false,
      correct: false,
      challengesRemaining: 0,
      allCompleted: false,
      state,
      error: 'No challenge in progress',
    };
  }

  const settings = await getSettings();
  const isCorrect = verifyChallengeAnswer(
    currentUnlockFlow.currentChallenge,
    answer
  );

  if (isCorrect) {
    currentUnlockFlow.challengesCompleted++;
    currentUnlockFlow.currentChallenge = null;

    const challengesRemaining =
      settings.commitmentLock.challengeCount -
      currentUnlockFlow.challengesCompleted;
    const allCompleted = challengesRemaining <= 0;

    logger.info('Challenge answered correctly', {
      completed: currentUnlockFlow.challengesCompleted,
      total: settings.commitmentLock.challengeCount,
    });

    // Generate next challenge if needed
    let nextChallenge: ChallengeData | undefined;
    if (!allCompleted) {
      nextChallenge = generateChallenge(
        settings.challenge.challengeType,
        settings.challenge.difficulty
      );
      currentUnlockFlow.currentChallenge = nextChallenge;
    }

    const state = await getCommitmentLockState();
    return {
      success: true,
      correct: true,
      challengesRemaining,
      allCompleted,
      nextChallenge,
      state,
    };
  } else {
    currentUnlockFlow.challengesFailed++;

    // If consecutive is required, reset progress
    if (settings.commitmentLock.challengesMustBeConsecutive) {
      currentUnlockFlow.challengesCompleted = 0;
    }

    // Generate new challenge
    const nextChallenge = generateChallenge(
      settings.challenge.challengeType,
      settings.challenge.difficulty
    );
    currentUnlockFlow.currentChallenge = nextChallenge;

    const challengesRemaining =
      settings.commitmentLock.challengeCount -
      currentUnlockFlow.challengesCompleted;

    logger.info('Challenge answered incorrectly', {
      failed: currentUnlockFlow.challengesFailed,
      consecutiveReset: settings.commitmentLock.challengesMustBeConsecutive,
    });

    const state = await getCommitmentLockState();
    return {
      success: true,
      correct: false,
      challengesRemaining,
      allCompleted: false,
      nextChallenge,
      state,
    };
  }
}

/**
 * Confirm unlock and complete the flow
 */
export async function confirmUnlock(): Promise<{
  success: boolean;
  state: CommitmentLockState;
  error?: string;
}> {
  if (!currentUnlockFlow) {
    return {
      success: false,
      state: await getCommitmentLockState(),
      error: 'No unlock flow in progress',
    };
  }

  const settings = await getSettings();
  let state = await getCommitmentLockState();

  // Calculate cooldown
  const cooldownMinutes = calculateCooldownMinutes(
    state.consecutiveFailures,
    settings.commitmentLock.escalatingCooldown
  );
  const cooldownEndsAt = Date.now() + cooldownMinutes * 60 * 1000;

  // Calculate time lock end (Level 3)
  let timeLockEndsAt = state.timeLockEndsAt;
  if (
    settings.commitmentLock.level === 3 &&
    settings.commitmentLock.timeLockEnabled
  ) {
    timeLockEndsAt =
      Date.now() + settings.commitmentLock.timeLockHours * 60 * 60 * 1000;
  }

  // Update state
  state = {
    ...state,
    lastUnlockAt: Date.now(),
    todaySuccesses: state.todaySuccesses + 1,
    weekSuccesses: state.weekSuccesses + 1,
    weeklyUnlocksRemaining:
      settings.commitmentLock.level === 3
        ? Math.max(0, state.weeklyUnlocksRemaining - 1)
        : state.weeklyUnlocksRemaining,
    currentCooldownEndsAt: cooldownEndsAt,
    timeLockEndsAt,
    consecutiveFailures: 0, // Reset on success
    inProgressChallenge: null,
  };

  await saveCommitmentLockState(state);

  // Record in history
  const history = await getUnlockHistory();
  const attempt: UnlockAttempt = {
    timestamp: Date.now(),
    success: true,
    frictionLevel: settings.commitmentLock.level,
    challengesPassed: currentUnlockFlow.challengesCompleted,
    challengesFailed: currentUnlockFlow.challengesFailed,
    intentionStatement: currentUnlockFlow.intentionText || undefined,
    timeToComplete: Date.now() - currentUnlockFlow.startedAt,
  };

  await saveUnlockHistory({
    ...history,
    attempts: [...history.attempts.slice(-(history.maxAttempts - 1)), attempt],
  });

  // Clear unlock flow
  currentUnlockFlow = null;

  logger.info('Unlock completed successfully', {
    level: settings.commitmentLock.level,
    cooldownMinutes,
  });

  return { success: true, state };
}

/**
 * Cancel unlock flow
 */
export async function cancelUnlockFlow(): Promise<{
  success: boolean;
  state: CommitmentLockState;
}> {
  const settings = await getSettings();
  let state = await getCommitmentLockState();

  // Record failed attempt if flow was in progress
  if (currentUnlockFlow) {
    state = {
      ...state,
      consecutiveFailures: state.consecutiveFailures + 1,
      inProgressChallenge: null,
    };
    await saveCommitmentLockState(state);

    // Record in history
    const history = await getUnlockHistory();
    const attempt: UnlockAttempt = {
      timestamp: Date.now(),
      success: false,
      frictionLevel: settings.commitmentLock.level,
      challengesPassed: currentUnlockFlow.challengesCompleted,
      challengesFailed: currentUnlockFlow.challengesFailed,
      intentionStatement: currentUnlockFlow.intentionText || undefined,
      timeToComplete: Date.now() - currentUnlockFlow.startedAt,
      failureReason: 'cancelled_by_user',
    };

    await saveUnlockHistory({
      ...history,
      attempts: [
        ...history.attempts.slice(-(history.maxAttempts - 1)),
        attempt,
      ],
    });

    logger.info('Unlock cancelled by user');
  }

  currentUnlockFlow = null;
  return { success: true, state };
}

/**
 * Get unlock statistics
 */
export async function getUnlockStats(): Promise<CommitmentLockStats> {
  const history = await getUnlockHistory();
  const state = await getCommitmentLockState();

  const attempts = history.attempts;
  const totalAttempts = attempts.length;
  const totalSuccesses = attempts.filter((a) => a.success).length;
  const successRate =
    totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;

  // Calculate average time to unlock for successful attempts
  const successfulAttempts = attempts.filter(
    (a) => a.success && a.timeToComplete
  );
  const averageTimeToUnlock =
    successfulAttempts.length > 0
      ? successfulAttempts.reduce(
          (sum, a) => sum + (a.timeToComplete ?? 0),
          0
        ) / successfulAttempts.length
      : 0;

  // Find most common failure reason
  const failedAttempts = attempts.filter((a) => !a.success && a.failureReason);
  const failureReasons = failedAttempts.reduce(
    (acc, a) => {
      if (a.failureReason) {
        acc[a.failureReason] = (acc[a.failureReason] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<UnlockFailureReason, number>
  );

  let mostCommonFailure: UnlockFailureReason | null = null;
  let maxCount = 0;
  for (const [reason, count] of Object.entries(failureReasons)) {
    if (count > maxCount) {
      mostCommonFailure = reason as UnlockFailureReason;
      maxCount = count;
    }
  }

  // Calculate no-unlock streak
  let noUnlockStreak = 0;
  const longestNoUnlockStreak = 0;

  // Simple streak calculation based on last unlock
  if (state.lastUnlockAt) {
    const daysSinceLastUnlock = Math.floor(
      (Date.now() - state.lastUnlockAt) / (24 * 60 * 60 * 1000)
    );
    noUnlockStreak = daysSinceLastUnlock;
  }

  return {
    totalAttempts,
    totalSuccesses,
    successRate: Math.round(successRate * 10) / 10,
    averageTimeToUnlock: Math.round(averageTimeToUnlock),
    mostCommonFailure,
    noUnlockStreak,
    longestNoUnlockStreak: Math.max(longestNoUnlockStreak, noUnlockStreak),
  };
}

/**
 * Reset Commitment Lock state
 */
export async function resetCommitmentLockState(): Promise<CommitmentLockState> {
  const settings = await getSettings();
  const monday = getMonday(new Date()).toISOString().split('T')[0] ?? '';
  const today = new Date().toISOString().split('T')[0] ?? '';

  const newState: CommitmentLockState = {
    ...DEFAULT_COMMITMENT_LOCK_STATE,
    weeklyUnlocksRemaining: settings.commitmentLock.weeklyUnlockLimit,
    lastDailyResetDate: today,
    lastWeeklyResetDate: monday,
  };

  await saveCommitmentLockState(newState);
  currentUnlockFlow = null;

  logger.info('Commitment Lock state reset');
  return newState;
}

/**
 * Check if a premium feature is available
 */
export async function checkPremiumFeature(feature: string): Promise<{
  available: boolean;
  reason?: string;
}> {
  const premiumState = await getPremiumState();

  if (!premiumState.isPremium) {
    return { available: false, reason: 'Premium subscription required' };
  }

  // Check expiration
  if (premiumState.expiresAt && Date.now() > premiumState.expiresAt) {
    return { available: false, reason: 'Premium subscription expired' };
  }

  // Check if feature is included
  if (!premiumState.features.includes(feature)) {
    return { available: false, reason: 'Feature not included in your plan' };
  }

  return { available: true };
}

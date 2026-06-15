/**
 * Gentle focus streak.
 *
 * A "protection day" is any local day on which blocking was active at least
 * once. The streak is the run of consecutive protection days ending today —
 * or, kindly, yesterday: we don't consider the streak broken just because the
 * current day hasn't recorded activity yet. There is intentionally no "you
 * broke your streak" state; the streak simply reflects recent consistency.
 */

import { getLocalDateString } from './date';

/** Keep at most this many recent dates on record. */
export const MAX_STREAK_DATES = 180;

function toDate(iso: string): number {
  return new Date(`${iso}T00:00:00`).getTime();
}

/**
 * Add today's local date to the record (deduped, trimmed). Returns the new
 * list, or the same reference when today was already present.
 */
export function withToday(
  dates: readonly string[],
  today: string = getLocalDateString()
): readonly string[] {
  if (dates.includes(today)) {
    return dates;
  }
  const next = [...dates, today];
  return next.length > MAX_STREAK_DATES
    ? next.slice(next.length - MAX_STREAK_DATES)
    : next;
}

/**
 * Number of consecutive protection days ending today (or yesterday).
 */
export function computeStreak(
  dates: readonly string[],
  today: string = getLocalDateString()
): number {
  if (dates.length === 0) {
    return 0;
  }
  const present = new Set(dates);
  const DAY = 86_400_000;
  const todayMs = toDate(today);

  // Anchor on today if present, otherwise yesterday (grace for the current day).
  let cursor: number;
  if (present.has(today)) {
    cursor = todayMs;
  } else {
    const yesterday = getLocalDateString(new Date(todayMs - DAY));
    if (!present.has(yesterday)) {
      return 0;
    }
    cursor = todayMs - DAY;
  }

  let streak = 0;
  while (present.has(getLocalDateString(new Date(cursor)))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

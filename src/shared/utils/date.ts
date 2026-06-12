/**
 * Date helpers.
 *
 * IMPORTANT: daily resets, streaks and usage tracking must use the user's
 * LOCAL date. `toISOString()` returns the UTC date, which makes "today"
 * change at 09:00 JST and breaks midnight-adjacent streaks.
 */

/**
 * Local date as YYYY-MM-DD (the user's wall-clock day)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

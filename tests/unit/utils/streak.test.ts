/**
 * Gentle focus streak tests
 */

import { describe, it, expect } from 'vitest';
import {
  computeStreak,
  withToday,
  MAX_STREAK_DATES,
} from '@/shared/utils/streak';

describe('withToday', () => {
  it('adds today when absent', () => {
    expect(withToday(['2026-06-13'], '2026-06-14')).toEqual([
      '2026-06-13',
      '2026-06-14',
    ]);
  });

  it('returns the same reference when today is already present', () => {
    const dates = ['2026-06-14'];
    expect(withToday(dates, '2026-06-14')).toBe(dates);
  });

  it('trims to the most recent MAX_STREAK_DATES', () => {
    const many = Array.from(
      { length: MAX_STREAK_DATES + 5 },
      (_, i) => `d${i}`
    );
    const result = withToday(many, 'today');
    expect(result.length).toBe(MAX_STREAK_DATES);
    expect(result[result.length - 1]).toBe('today');
  });
});

describe('computeStreak', () => {
  it('is 0 for no dates', () => {
    expect(computeStreak([], '2026-06-14')).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(
      computeStreak(['2026-06-12', '2026-06-13', '2026-06-14'], '2026-06-14')
    ).toBe(3);
  });

  it('gives grace: counts a run ending yesterday when today is absent', () => {
    expect(computeStreak(['2026-06-12', '2026-06-13'], '2026-06-14')).toBe(2);
  });

  it('stops at a gap', () => {
    expect(
      computeStreak(['2026-06-10', '2026-06-13', '2026-06-14'], '2026-06-14')
    ).toBe(2);
  });

  it('is 0 when the latest day is older than yesterday', () => {
    expect(computeStreak(['2026-06-10'], '2026-06-14')).toBe(0);
  });

  it('ignores ordering and duplicates', () => {
    expect(
      computeStreak(
        ['2026-06-14', '2026-06-13', '2026-06-13', '2026-06-12'],
        '2026-06-14'
      )
    ).toBe(3);
  });
});

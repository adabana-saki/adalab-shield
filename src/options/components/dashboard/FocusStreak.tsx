/**
 * Gentle focus streak card.
 * Shows the run of consecutive days blocking was active — framed kindly, with
 * encouragement rather than pressure, and no "you broke it" state.
 */

import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import { STORAGE_KEYS } from '@/shared/constants';
import { computeStreak } from '@/shared/utils/streak';

export function FocusStreak() {
  const { t, formatNumber } = useI18n();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const result = await browser.storage.local.get(
          STORAGE_KEYS.FOCUS_STREAK
        );
        const stored = result[STORAGE_KEYS.FOCUS_STREAK];
        const dates = Array.isArray(stored) ? (stored as string[]) : [];
        if (!cancelled) {
          setStreak(computeStreak(dates));
        }
      } catch {
        // ignore
      }
    };
    void load();

    const listener = (
      changes: Record<string, browser.Storage.StorageChange>,
      area: string
    ): void => {
      if (
        area === 'local' &&
        changes[STORAGE_KEYS.FOCUS_STREAK] !== undefined
      ) {
        void load();
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => {
      cancelled = true;
      browser.storage.onChanged.removeListener(listener);
    };
  }, []);

  return (
    <div className="dashboard-card focus-streak">
      <div className="focus-streak-icon" aria-hidden="true">
        🌱
      </div>
      <div className="focus-streak-body">
        <div className="focus-streak-count">
          {formatNumber(streak)}
          <span className="focus-streak-unit">{t('focusStreakUnit')}</span>
        </div>
        <div className="focus-streak-title">{t('focusStreakTitle')}</div>
        <div className="focus-streak-msg">
          {streak === 0
            ? t('focusStreakStart')
            : streak < 3
              ? t('focusStreakKeepGoing')
              : t('focusStreakGreat')}
        </div>
      </div>
    </div>
  );
}

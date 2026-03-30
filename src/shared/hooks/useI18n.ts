/**
 * React hook for i18n functionality
 */

import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import {
  t,
  formatNumber,
  formatDate,
  formatRelativeTime,
  setLanguage,
  initializeTranslations,
  getEffectiveLocale,
  isTranslationsReady,
  reloadTranslations,
} from '@/shared/utils/i18n';
import { STORAGE_KEYS } from '@/shared/constants';
import type { Settings } from '@/shared/types';

/**
 * Hook for i18n functionality in React components
 */
export function useI18n() {
  const [isReady, setIsReady] = useState(isTranslationsReady());
  const [locale, setLocale] = useState(getEffectiveLocale());
  const [, forceUpdate] = useState(0);

  // Initialize translations on mount
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Get language from storage first
      try {
        const result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
        const settings = result[STORAGE_KEYS.SETTINGS] as Settings | undefined;
        const savedLanguage = settings?.preferences?.language;

        if (savedLanguage && savedLanguage !== 'auto') {
          // Use saved language - need to reload translations for this language
          await reloadTranslations(savedLanguage);
        } else {
          // Use auto (browser) language
          setLanguage('auto');
          await initializeTranslations();
        }
      } catch {
        // If storage fails, just initialize with default
        await initializeTranslations();
      }

      if (isMounted) {
        setIsReady(true);
        setLocale(getEffectiveLocale());
        forceUpdate((n) => n + 1);
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  const translate = useCallback(
    (key: string, substitutions?: string | string[]) => {
      return t(key, substitutions);
    },
    []
  );

  const number = useCallback(
    (value: number) => formatNumber(value, locale),
    [locale]
  );

  const date = useCallback(
    (value: Date, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(value, options, locale);
    },
    [locale]
  );

  const relativeTime = useCallback(
    (value: Date) => {
      return formatRelativeTime(value, locale);
    },
    [locale]
  );

  return {
    /** Translate a message key */
    t: translate,
    /** Current locale */
    locale,
    /** Format a number */
    formatNumber: number,
    /** Format a date */
    formatDate: date,
    /** Format relative time */
    formatRelativeTime: relativeTime,
    /** Whether translations are ready */
    isReady,
  };
}

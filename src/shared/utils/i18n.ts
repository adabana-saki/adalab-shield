/**
 * Internationalization utilities
 * Supports runtime language switching via settings
 */

import browser from 'webextension-polyfill';
import type { SupportedLanguage } from '@/shared/types';

/**
 * Message entry structure from messages.json
 */
interface MessageEntry {
  message: string;
  placeholders?: Record<string, { content: string }>;
}

/**
 * Cached translations by locale
 */
const translationCache: Map<string, Record<string, MessageEntry>> = new Map();

/**
 * Current active language (set from settings)
 */
let currentLanguage: SupportedLanguage = 'auto';

/**
 * Flag to indicate if translations have been loaded
 */
let isInitialized = false;

/**
 * Promise for initialization
 */
let initPromise: Promise<void> | null = null;

/**
 * Set the current language
 */
export function setLanguage(language: SupportedLanguage): void {
  currentLanguage = language;
}

/**
 * Get the current language setting
 */
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * Get browser's UI language
 */
export function getBrowserLanguage(): string {
  try {
    const lang = browser.i18n.getUILanguage();
    // Normalize language code (e.g., 'ja' -> 'ja', 'pt-BR' -> 'pt_BR')
    return lang.replace('-', '_');
  } catch {
    return 'en';
  }
}

/**
 * Get the effective locale (resolves 'auto' to browser language)
 */
export function getEffectiveLocale(): string {
  if (currentLanguage === 'auto') {
    return getBrowserLanguage();
  }
  return currentLanguage;
}

/**
 * Get current UI language (for backward compatibility)
 */
export function getUILanguage(): string {
  return getEffectiveLocale();
}

/**
 * Load translations for a specific locale
 */
async function loadTranslations(
  locale: string
): Promise<Record<string, MessageEntry>> {
  // Check cache first
  const cached = translationCache.get(locale);
  if (cached) {
    return cached;
  }

  try {
    // Try to fetch the messages.json file
    const url = browser.runtime.getURL(`_locales/${locale}/messages.json`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load translations for ${locale}: ${response.status}`
      );
    }

    const messages = (await response.json()) as Record<string, MessageEntry>;
    translationCache.set(locale, messages);
    return messages;
  } catch (error) {
    console.warn(`[i18n] Failed to load ${locale}:`, error);

    // If locale with region fails (e.g., pt_BR), try base locale (e.g., pt)
    if (locale.includes('_')) {
      const baseLocale = locale.split('_')[0];
      if (baseLocale && baseLocale !== locale) {
        return loadTranslations(baseLocale);
      }
    }

    // Return empty object if loading fails
    return {};
  }
}

/**
 * Initialize translations - loads all needed locales
 */
export async function initializeTranslations(): Promise<void> {
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const effectiveLocale = getEffectiveLocale();

      // Load the effective locale
      await loadTranslations(effectiveLocale);

      // Also load English as fallback (if not already the effective locale)
      if (effectiveLocale !== 'en') {
        await loadTranslations('en');
      }

      isInitialized = true;
    } catch (error) {
      console.error('[i18n] Failed to initialize translations:', error);
      isInitialized = true; // Set to true anyway to prevent infinite loading
    }
  })();

  return initPromise;
}

/**
 * Force reload translations for a new language
 */
export async function reloadTranslations(
  language: SupportedLanguage
): Promise<void> {
  setLanguage(language);
  initPromise = null; // Reset init promise
  isInitialized = false;
  await initializeTranslations();
}

/**
 * Check if translations are ready
 */
export function isTranslationsReady(): boolean {
  return isInitialized;
}

/**
 * Apply substitutions to a message
 */
function applySubstitutions(
  message: string,
  entry: MessageEntry,
  substitutions?: string | string[]
): string {
  if (!substitutions) {
    return message;
  }

  const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
  let result = message;

  // Apply placeholder substitutions
  if (entry.placeholders) {
    for (const [key, placeholder] of Object.entries(entry.placeholders)) {
      const match = placeholder.content.match(/^\$(\d+)$/);
      if (match && match[1]) {
        const index = parseInt(match[1], 10) - 1;
        if (index >= 0 && index < subs.length) {
          const value = subs[index];
          if (value !== undefined) {
            result = result.replace(new RegExp(`\\$${key}\\$`, 'gi'), value);
          }
        }
      }
    }
  }

  // Also handle simple $1, $2, etc. substitutions
  subs.forEach((sub, index) => {
    result = result.replace(new RegExp(`\\$${index + 1}`, 'g'), sub);
  });

  return result;
}

/**
 * Get translation from cache
 */
function getFromCache(
  messageName: string,
  substitutions?: string | string[]
): string | null {
  const locale = getEffectiveLocale();

  // Try the effective locale first
  const translations = translationCache.get(locale);
  if (translations && translations[messageName]) {
    const entry = translations[messageName];
    return applySubstitutions(entry.message, entry, substitutions);
  }

  // Try English fallback
  if (locale !== 'en') {
    const enTranslations = translationCache.get('en');
    if (enTranslations && enTranslations[messageName]) {
      const entry = enTranslations[messageName];
      return applySubstitutions(entry.message, entry, substitutions);
    }
  }

  return null;
}

/**
 * Get localized message with optional substitutions
 * Falls back to message name if translation not found
 */
export function t(
  messageName: string,
  substitutions?: string | string[]
): string {
  // Try cache first (this works when translations are loaded)
  const cached = getFromCache(messageName, substitutions);
  if (cached !== null) {
    return cached;
  }

  // Fall back to browser.i18n API (works for browser's default language)
  try {
    const message = browser.i18n.getMessage(messageName, substitutions);
    if (message) {
      return message;
    }
  } catch {
    // Ignore errors
  }

  // Return the key as fallback
  if (__DEV__) {
    console.warn(`[i18n] Missing translation: ${messageName}`);
  }
  return messageName;
}

/**
 * Format number according to locale
 */
export function formatNumber(value: number, locale?: string): string {
  const lang = locale ?? getEffectiveLocale();
  try {
    return new Intl.NumberFormat(lang.replace('_', '-')).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  const lang = locale ?? getEffectiveLocale();
  try {
    return new Intl.DateTimeFormat(lang.replace('_', '-'), options).format(
      date
    );
  } catch {
    return date.toISOString();
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date, locale?: string): string {
  const lang = locale ?? getEffectiveLocale();

  try {
    const rtf = new Intl.RelativeTimeFormat(lang.replace('_', '-'), {
      numeric: 'auto',
    });
    const now = Date.now();
    const diffMs = date.getTime() - now;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (Math.abs(diffSec) < 60) {
      return rtf.format(diffSec, 'second');
    } else if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    } else if (Math.abs(diffHour) < 24) {
      return rtf.format(diffHour, 'hour');
    } else {
      return rtf.format(diffDay, 'day');
    }
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(seconds: number, locale?: string): string {
  const lang = locale ?? getEffectiveLocale();

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  try {
    const nf = new Intl.NumberFormat(lang.replace('_', '-'), {
      minimumIntegerDigits: 2,
    });

    if (hours > 0) {
      parts.push(nf.format(hours));
    }
    parts.push(nf.format(minutes));
    parts.push(nf.format(secs));

    return parts.join(':');
  } catch {
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}

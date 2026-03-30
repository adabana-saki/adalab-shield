/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * i18n mock for testing
 */

import { vi } from 'vitest';

// Default messages for testing
const defaultMessages: Record<string, string> = {
  extensionName: 'ShortShield',
  extensionDescription: 'Block short-form videos and reclaim your focus',
  popupTitle: 'ShortShield',
  popupStatusEnabled: 'Blocking Active',
  popupStatusDisabled: 'Blocking Paused',
  popupToggleOn: 'Turn Off',
  popupToggleOff: 'Turn On',
  popupStatsToday: 'Blocked Today',
  popupStatsTotal: 'Total Blocked',
};

// Current locale
let currentLocale = 'en';

// Custom messages (can be overridden in tests)
let customMessages: Record<string, string> = {};

/**
 * Mock t() function
 */
export function mockT(key: string, substitutions?: string | string[]): string {
  const message = customMessages[key] ?? defaultMessages[key] ?? key;

  if (substitutions) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    return message.replace(/\$(\d+)/g, (_, index) => {
      const idx = parseInt(index, 10) - 1;
      return subs[idx] ?? '';
    });
  }

  return message;
}

/**
 * Mock getUILanguage() function
 */
export function mockGetUILanguage(): string {
  return currentLocale;
}

/**
 * Mock formatNumber() function
 */
export function mockFormatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale ?? currentLocale).format(value);
}

/**
 * Mock formatDate() function
 */
export function mockFormatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  return new Intl.DateTimeFormat(locale ?? currentLocale, options).format(date);
}

/**
 * i18n mock utilities
 */
export const mockI18n = {
  /**
   * Set custom messages for testing
   */
  setMessages(messages: Record<string, string>): void {
    customMessages = { ...messages };
  },

  /**
   * Set current locale
   */
  setLocale(locale: string): void {
    currentLocale = locale;
  },

  /**
   * Reset to defaults
   */
  reset(): void {
    customMessages = {};
    currentLocale = 'en';
  },

  /**
   * Get current locale
   */
  getLocale(): string {
    return currentLocale;
  },

  /**
   * Mock functions for direct use
   */
  t: mockT,
  getUILanguage: mockGetUILanguage,
  formatNumber: mockFormatNumber,
  formatDate: mockFormatDate,
};

// Export mock functions as spies for testing
export const i18nSpies = {
  t: vi.fn(mockT),
  getUILanguage: vi.fn(mockGetUILanguage),
  formatNumber: vi.fn(mockFormatNumber),
  formatDate: vi.fn(mockFormatDate),
};

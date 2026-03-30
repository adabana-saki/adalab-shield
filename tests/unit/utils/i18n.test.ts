/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * i18n utilities tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock webextension-polyfill before importing i18n
vi.mock('webextension-polyfill', () => ({
  default: {
    i18n: {
      getMessage: vi.fn((key: string, subs?: string | string[]) => {
        const messages: Record<string, string> = {
          extensionName: 'ShortShield',
          statsBlockedCount: '$1 blocked',
          greeting: 'Hello, $1!',
        };
        let message = messages[key] ?? '';
        if (subs) {
          const subsArray = Array.isArray(subs) ? subs : [subs];
          message = message.replace(
            /\$(\d+)/g,
            (_, i) => subsArray[parseInt(i, 10) - 1] ?? ''
          );
        }
        return message;
      }),
      getUILanguage: vi.fn(() => 'en-US'),
    },
  },
  i18n: {
    getMessage: vi.fn((key: string, subs?: string | string[]) => {
      const messages: Record<string, string> = {
        extensionName: 'ShortShield',
        statsBlockedCount: '$1 blocked',
        greeting: 'Hello, $1!',
      };
      let message = messages[key] ?? '';
      if (subs) {
        const subsArray = Array.isArray(subs) ? subs : [subs];
        message = message.replace(
          /\$(\d+)/g,
          (_, i) => subsArray[parseInt(i, 10) - 1] ?? ''
        );
      }
      return message;
    }),
    getUILanguage: vi.fn(() => 'en-US'),
  },
}));

import {
  t,
  getUILanguage,
  formatNumber,
  formatDate,
} from '@/shared/utils/i18n';

describe('t()', () => {
  it('should return translated message', () => {
    expect(t('extensionName')).toBe('ShortShield');
  });

  it('should handle substitutions', () => {
    expect(t('greeting', 'World')).toBe('Hello, World!');
    expect(t('statsBlockedCount', '42')).toBe('42 blocked');
  });

  it('should return key if message not found', () => {
    expect(t('nonexistentKey')).toBe('nonexistentKey');
  });
});

describe('getUILanguage()', () => {
  it('should return current UI language', () => {
    expect(getUILanguage()).toBe('en_US');
  });
});

describe('formatNumber()', () => {
  it('should format numbers according to locale', () => {
    // Using en-US locale
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567');
    expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
  });

  it('should format numbers for different locales', () => {
    expect(formatNumber(1234567, 'de-DE')).toBe('1.234.567');
    expect(formatNumber(1234567, 'ja-JP')).toBe('1,234,567');
  });

  it('should handle zero and negative numbers', () => {
    expect(formatNumber(0, 'en-US')).toBe('0');
    expect(formatNumber(-1234, 'en-US')).toBe('-1,234');
  });
});

describe('formatDate()', () => {
  const testDate = new Date('2024-06-15T10:30:00Z');

  it('should format date according to locale', () => {
    const result = formatDate(testDate, { dateStyle: 'short' }, 'en-US');
    expect(result).toMatch(/6\/15\/24/);
  });

  it('should format date for different locales', () => {
    const jaResult = formatDate(testDate, { dateStyle: 'short' }, 'ja-JP');
    expect(jaResult).toMatch(/2024\/06\/15|2024\/6\/15/);
  });

  it('should handle different date formats', () => {
    const longFormat = formatDate(testDate, { dateStyle: 'long' }, 'en-US');
    expect(longFormat).toContain('June');
    expect(longFormat).toContain('2024');
  });
});

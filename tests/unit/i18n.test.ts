/**
 * i18n utilities tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock browser API before importing i18n utilities
vi.mock('webextension-polyfill', () => ({
  default: {
    i18n: {
      getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
        const messages: Record<string, string> = {
          testMessage: 'Test Message',
          greeting: 'Hello, $1!',
          statsCount: '$1 items blocked',
        };
        let message = messages[key] ?? '';
        if (message !== '' && substitutions !== undefined) {
          const subs = Array.isArray(substitutions)
            ? substitutions
            : [substitutions];
          message = message.replace(/\$(\d+)/g, (_, index: string) => {
            const idx = parseInt(index, 10) - 1;
            return subs[idx] ?? '';
          });
        }
        return message;
      }),
      getUILanguage: vi.fn(() => 'en-US'),
    },
  },
}));

// Import after mocking
import {
  t,
  getUILanguage,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatDuration,
} from '@/shared/utils/i18n';

describe('i18n utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('t()', () => {
    it('returns translated message', () => {
      const result = t('testMessage');
      expect(result).toBe('Test Message');
    });

    it('returns message name when translation not found', () => {
      const result = t('unknownKey');
      expect(result).toBe('unknownKey');
    });

    it('handles substitutions', () => {
      const result = t('greeting', 'World');
      expect(result).toBe('Hello, World!');
    });

    it('handles array substitutions', () => {
      const result = t('statsCount', ['42']);
      expect(result).toBe('42 items blocked');
    });
  });

  describe('getUILanguage()', () => {
    it('returns current UI language', () => {
      const result = getUILanguage();
      expect(result).toBe('en_US');
    });
  });

  describe('formatNumber()', () => {
    it('formats numbers according to locale', () => {
      expect(formatNumber(1234567, 'en-US')).toBe('1,234,567');
      expect(formatNumber(1234567, 'de-DE')).toBe('1.234.567');
      expect(formatNumber(1234567, 'ja-JP')).toBe('1,234,567');
    });

    it('handles decimal numbers', () => {
      expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
    });

    it('handles zero', () => {
      expect(formatNumber(0, 'en-US')).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1234, 'en-US')).toBe('-1,234');
    });
  });

  describe('formatDate()', () => {
    const testDate = new Date('2024-06-15T10:30:00Z');

    it('formats date with short style', () => {
      const result = formatDate(testDate, { dateStyle: 'short' }, 'en-US');
      expect(result).toMatch(/6\/15\/24/);
    });

    it('formats date with medium style', () => {
      const result = formatDate(testDate, { dateStyle: 'medium' }, 'en-US');
      expect(result).toMatch(/Jun/);
    });

    it('formats date for Japanese locale', () => {
      const result = formatDate(testDate, { dateStyle: 'short' }, 'ja-JP');
      expect(result).toMatch(/2024/);
    });

    it('formats date with time', () => {
      const result = formatDate(
        testDate,
        { dateStyle: 'short', timeStyle: 'short' },
        'en-US'
      );
      expect(result).toMatch(/:/);
    });
  });

  describe('formatRelativeTime()', () => {
    it('formats seconds ago', () => {
      const date = new Date(Date.now() - 30 * 1000);
      const result = formatRelativeTime(date, 'en-US');
      expect(result).toMatch(/second/i);
    });

    it('formats minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(date, 'en-US');
      expect(result).toMatch(/minute/i);
    });

    it('formats hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'en-US');
      expect(result).toMatch(/hour/i);
    });

    it('formats days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'en-US');
      expect(result).toMatch(/day/i);
    });
  });

  describe('formatDuration()', () => {
    it('formats seconds only', () => {
      expect(formatDuration(45, 'en-US')).toBe('00:45');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(125, 'en-US')).toBe('02:05');
    });

    it('formats hours, minutes and seconds', () => {
      expect(formatDuration(3725, 'en-US')).toBe('01:02:05');
    });

    it('handles zero', () => {
      expect(formatDuration(0, 'en-US')).toBe('00:00');
    });
  });
});

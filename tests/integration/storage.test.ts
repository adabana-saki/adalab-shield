/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck
/**
 * Storage integration tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Settings } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import { validateSettings } from '@/shared/utils/validation';

// Mock the logger
vi.mock('@/shared/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Storage mock that simulates chrome.storage.local behavior
class MockStorage {
  private data: Record<string, unknown> = {};

  async get(
    keys?: string | string[] | Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!keys) {
      return { ...this.data };
    }

    if (typeof keys === 'string') {
      return { [keys]: this.data[keys] };
    }

    if (Array.isArray(keys)) {
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        result[key] = this.data[key];
      }
      return result;
    }

    // Object with default values
    const result: Record<string, unknown> = {};
    for (const [key, defaultValue] of Object.entries(keys)) {
      result[key] = this.data[key] ?? defaultValue;
    }
    return result;
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      this.data[key] = value;
    }
  }

  async remove(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    for (const key of keyArray) {
      delete this.data[key];
    }
  }

  async clear(): Promise<void> {
    this.data = {};
  }

  // Helper for tests
  _getData(): Record<string, unknown> {
    return { ...this.data };
  }

  _setData(data: Record<string, unknown>): void {
    this.data = { ...data };
  }
}

const mockStorage = new MockStorage();

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn((keys) => mockStorage.get(keys)),
        set: vi.fn((items) => mockStorage.set(items)),
        remove: vi.fn((keys) => mockStorage.remove(keys)),
        clear: vi.fn(() => mockStorage.clear()),
      },
    },
  },
}));

describe('Storage Integration', () => {
  beforeEach(async () => {
    await mockStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Settings Storage', () => {
    it('should store and retrieve default settings', async () => {
      await mockStorage.set({ shortshield_settings: DEFAULT_SETTINGS });

      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      expect(settings.enabled).toBe(DEFAULT_SETTINGS.enabled);
      expect(settings.platforms).toEqual(DEFAULT_SETTINGS.platforms);
    });

    it('should update individual platform settings', async () => {
      await mockStorage.set({ shortshield_settings: DEFAULT_SETTINGS });

      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      const updatedSettings: Settings = {
        ...settings,
        platforms: {
          ...settings.platforms,
          youtube: false,
        },
      };

      await mockStorage.set({ shortshield_settings: updatedSettings });

      const updated = await mockStorage.get('shortshield_settings');
      const newSettings = updated.shortshield_settings as Settings;

      expect(newSettings.platforms.youtube).toBe(false);
      expect(newSettings.platforms.tiktok).toBe(true);
      expect(newSettings.platforms.instagram).toBe(true);
    });

    it('should preserve whitelist when updating settings', async () => {
      const settingsWithWhitelist: Settings = {
        ...DEFAULT_SETTINGS,
        whitelist: [
          {
            id: 'test-id' as Settings['whitelist'][0]['id'],
            type: 'channel',
            value: '@TestChannel',
            platform: 'youtube',
            createdAt: Date.now(),
          },
        ],
      };

      await mockStorage.set({ shortshield_settings: settingsWithWhitelist });

      // Update enabled state
      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      const updatedSettings: Settings = {
        ...settings,
        enabled: false,
      };

      await mockStorage.set({ shortshield_settings: updatedSettings });

      const updated = await mockStorage.get('shortshield_settings');
      const newSettings = updated.shortshield_settings as Settings;

      expect(newSettings.enabled).toBe(false);
      expect(newSettings.whitelist.length).toBe(1);
      expect(newSettings.whitelist[0].value).toBe('@TestChannel');
    });
  });

  describe('Statistics Storage', () => {
    it('should update blocking statistics', async () => {
      await mockStorage.set({ shortshield_settings: DEFAULT_SETTINGS });

      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      const updatedSettings: Settings = {
        ...settings,
        stats: {
          ...settings.stats,
          blockedToday: settings.stats.blockedToday + 1,
          blockedTotal: settings.stats.blockedTotal + 1,
        },
      };

      await mockStorage.set({ shortshield_settings: updatedSettings });

      const updated = await mockStorage.get('shortshield_settings');
      const newSettings = updated.shortshield_settings as Settings;

      expect(newSettings.stats.blockedToday).toBe(1);
      expect(newSettings.stats.blockedTotal).toBe(1);
    });

    it('should reset daily stats correctly', async () => {
      const settingsWithStats: Settings = {
        ...DEFAULT_SETTINGS,
        stats: {
          ...DEFAULT_SETTINGS.stats,
          blockedToday: 50,
          blockedTotal: 100,
          lastResetDate: '2024-12-31',
        },
      };

      await mockStorage.set({ shortshield_settings: settingsWithStats });

      // Simulate daily reset
      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      const today = new Date().toISOString().split('T')[0];
      const updatedSettings: Settings = {
        ...settings,
        stats: {
          ...settings.stats,
          blockedToday: 0,
          lastResetDate: today,
        },
      };

      await mockStorage.set({ shortshield_settings: updatedSettings });

      const updated = await mockStorage.get('shortshield_settings');
      const newSettings = updated.shortshield_settings as Settings;

      expect(newSettings.stats.blockedToday).toBe(0);
      expect(newSettings.stats.blockedTotal).toBe(100);
      expect(newSettings.stats.lastResetDate).toBe(today);
    });
  });

  describe('Whitelist Storage', () => {
    it('should add whitelist entries', async () => {
      await mockStorage.set({ shortshield_settings: DEFAULT_SETTINGS });

      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      const newEntry = {
        id: `whitelist-${Date.now()}` as Settings['whitelist'][0]['id'],
        type: 'channel' as const,
        value: '@NewChannel',
        platform: 'youtube' as const,
        createdAt: Date.now(),
      };

      const updatedSettings: Settings = {
        ...settings,
        whitelist: [...settings.whitelist, newEntry],
      };

      await mockStorage.set({ shortshield_settings: updatedSettings });

      const updated = await mockStorage.get('shortshield_settings');
      const newSettings = updated.shortshield_settings as Settings;

      expect(newSettings.whitelist.length).toBe(1);
      expect(newSettings.whitelist[0].value).toBe('@NewChannel');
    });

    it('should remove whitelist entries', async () => {
      const settingsWithWhitelist: Settings = {
        ...DEFAULT_SETTINGS,
        whitelist: [
          {
            id: 'entry-1' as Settings['whitelist'][0]['id'],
            type: 'channel',
            value: '@Channel1',
            platform: 'youtube',
            createdAt: Date.now(),
          },
          {
            id: 'entry-2' as Settings['whitelist'][0]['id'],
            type: 'channel',
            value: '@Channel2',
            platform: 'tiktok',
            createdAt: Date.now(),
          },
        ],
      };

      await mockStorage.set({ shortshield_settings: settingsWithWhitelist });

      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      const updatedSettings: Settings = {
        ...settings,
        whitelist: settings.whitelist.filter((entry) => entry.id !== 'entry-1'),
      };

      await mockStorage.set({ shortshield_settings: updatedSettings });

      const updated = await mockStorage.get('shortshield_settings');
      const newSettings = updated.shortshield_settings as Settings;

      expect(newSettings.whitelist.length).toBe(1);
      expect(newSettings.whitelist[0].id).toBe('entry-2');
    });
  });

  describe('Log Storage', () => {
    it('should store and retrieve logs', async () => {
      const logs = [
        {
          id: 'log-1',
          platform: 'youtube',
          action: 'hide',
          url: 'https://youtube.com/shorts/abc',
          timestamp: Date.now(),
        },
      ];

      await mockStorage.set({ shortshield_logs: logs });

      const result = await mockStorage.get('shortshield_logs');
      const storedLogs = result.shortshield_logs as typeof logs;

      expect(storedLogs.length).toBe(1);
      expect(storedLogs[0].platform).toBe('youtube');
    });

    it('should append new logs', async () => {
      const initialLogs = [
        {
          id: 'log-1',
          platform: 'youtube',
          action: 'hide',
          url: 'https://youtube.com/shorts/abc',
          timestamp: Date.now() - 1000,
        },
      ];

      await mockStorage.set({ shortshield_logs: initialLogs });

      const result = await mockStorage.get('shortshield_logs');
      const logs = result.shortshield_logs as typeof initialLogs;

      const newLog = {
        id: 'log-2',
        platform: 'tiktok',
        action: 'hide',
        url: 'https://tiktok.com/@user/video/123',
        timestamp: Date.now(),
      };

      const updatedLogs = [...logs, newLog];
      await mockStorage.set({ shortshield_logs: updatedLogs });

      const updated = await mockStorage.get('shortshield_logs');
      const storedLogs = updated.shortshield_logs as typeof logs;

      expect(storedLogs.length).toBe(2);
      expect(storedLogs[1].platform).toBe('tiktok');
    });

    it('should clear logs', async () => {
      const logs = [
        {
          id: 'log-1',
          platform: 'youtube',
          action: 'hide',
          url: 'https://youtube.com/shorts/abc',
          timestamp: Date.now(),
        },
      ];

      await mockStorage.set({ shortshield_logs: logs });
      await mockStorage.set({ shortshield_logs: [] });

      const result = await mockStorage.get('shortshield_logs');
      const storedLogs = result.shortshield_logs as typeof logs;

      expect(storedLogs.length).toBe(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate settings structure', () => {
      const validSettings = {
        enabled: true,
        platforms: { youtube: true, tiktok: true, instagram: true },
        whitelist: [],
        stats: {
          blockedToday: 0,
          blockedTotal: 0,
          lastResetDate: '2025-01-01',
          byPlatform: {},
        },
        preferences: {
          showStats: true,
          showNotifications: false,
          redirectShortsToRegular: false,
          logRetentionDays: 7,
        },
        version: 1,
      };

      const result = validateSettings(validSettings);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid settings', () => {
      const invalidSettings = {
        enabled: 'not a boolean',
        platforms: { youtube: 'not a boolean' },
      };

      const result = validateSettings(invalidSettings);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Storage Limits', () => {
    it('should handle large whitelist', async () => {
      const largeWhitelist = [];
      for (let i = 0; i < 100; i++) {
        largeWhitelist.push({
          id: `entry-${i}` as Settings['whitelist'][0]['id'],
          type: 'channel' as const,
          value: `@Channel${i}`,
          platform: 'youtube' as const,
          createdAt: Date.now(),
        });
      }

      const settingsWithLargeWhitelist: Settings = {
        ...DEFAULT_SETTINGS,
        whitelist: largeWhitelist,
      };

      await mockStorage.set({
        shortshield_settings: settingsWithLargeWhitelist,
      });

      const result = await mockStorage.get('shortshield_settings');
      const settings = result.shortshield_settings as Settings;

      expect(settings.whitelist.length).toBe(100);
    });
  });
});

/* eslint-disable @typescript-eslint/require-await */
/**
 * Mock for webextension-polyfill (browser API)
 */

import { vi } from 'vitest';

// Storage mock with in-memory data
const storageData: Record<string, unknown> = {};

const storageMock = {
  local: {
    get: vi.fn(async (keys: string | string[] | null) => {
      if (keys === null) {
        return { ...storageData };
      }
      if (typeof keys === 'string') {
        return { [keys]: storageData[keys] };
      }
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        result[key] = storageData[key];
      }
      return result;
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(storageData, items);
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      const keysArray = typeof keys === 'string' ? [keys] : keys;
      for (const key of keysArray) {
        delete storageData[key];
      }
    }),
    clear: vi.fn(async () => {
      for (const key of Object.keys(storageData)) {
        delete storageData[key];
      }
    }),
    getBytesInUse: vi.fn(async () => 0),
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(() => false),
  },
};

// i18n mock
const i18nMock = {
  getMessage: vi.fn(
    (messageName: string, substitutions?: string | string[]) => {
      // Return a simple mock message
      if (substitutions) {
        const subs = Array.isArray(substitutions)
          ? substitutions
          : [substitutions];
        return `${messageName}: ${subs.join(', ')}`;
      }
      return messageName;
    }
  ),
  getUILanguage: vi.fn(() => 'en'),
  getAcceptLanguages: vi.fn(async () => ['en-US', 'en']),
};

// Runtime mock
const runtimeMock = {
  id: 'mock-extension-id',
  sendMessage: vi.fn(async () => ({
    success: true,
    data: null,
  })),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(() => false),
  },
  onInstalled: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(() => false),
  },
  onStartup: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(() => false),
  },
  openOptionsPage: vi.fn(async () => undefined),
  getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
};

// Tabs mock
const tabsMock = {
  query: vi.fn(async () => []),
  sendMessage: vi.fn(async () => undefined),
  create: vi.fn(async () => ({ id: 1 })),
  update: vi.fn(async () => ({ id: 1 })),
};

// Export the mock browser object
export const mockBrowserApi = {
  default: {
    storage: storageMock,
    i18n: i18nMock,
    runtime: runtimeMock,
    tabs: tabsMock,
  },
  storage: storageMock,
  i18n: i18nMock,
  runtime: runtimeMock,
  tabs: tabsMock,
};

// Helper to reset storage data
export function resetStorageData(): void {
  for (const key of Object.keys(storageData)) {
    delete storageData[key];
  }
}

// Helper to set storage data
export function setStorageData(data: Record<string, unknown>): void {
  Object.assign(storageData, data);
}

// Helper to get storage data
export function getStorageData(): Record<string, unknown> {
  return { ...storageData };
}

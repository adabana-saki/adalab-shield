/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck
/**
 * Messaging integration tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createMessage,
  MESSAGE_TYPES,
  isValidMessage,
  type UpdateSettingsMessage,
  type LogBlockMessage,
} from '@/shared/types';

// Mock the logger
vi.mock('@/shared/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Messaging Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Message Creation', () => {
    it('should create valid GET_SETTINGS message', () => {
      const message = createMessage({ type: 'GET_SETTINGS' });
      expect(message.type).toBe('GET_SETTINGS');
      expect(isValidMessage(message)).toBe(true);
    });

    it('should create valid UPDATE_SETTINGS message', () => {
      const message = createMessage<UpdateSettingsMessage>({
        type: 'UPDATE_SETTINGS',
        payload: { enabled: false },
      });
      expect(message.type).toBe('UPDATE_SETTINGS');
      expect(message.payload).toEqual({ enabled: false });
      expect(isValidMessage(message)).toBe(true);
    });

    it('should create valid LOG_BLOCK message', () => {
      const message = createMessage<LogBlockMessage>({
        type: 'LOG_BLOCK',
        payload: {
          platform: 'youtube',
          action: 'hide',
          url: 'https://youtube.com/shorts/abc',
        },
      });
      expect(message.type).toBe('LOG_BLOCK');
      expect(isValidMessage(message)).toBe(true);
    });

    it('should create valid PING message', () => {
      const message = createMessage({ type: 'PING' });
      expect(message.type).toBe('PING');
      expect(isValidMessage(message)).toBe(true);
    });
  });

  describe('Message Type Validation', () => {
    it('should validate all message types', () => {
      for (const type of MESSAGE_TYPES) {
        const message = createMessage({ type });
        expect(isValidMessage(message)).toBe(true);
      }
    });

    it('should reject invalid message types', () => {
      const invalidMessage = { type: 'INVALID_TYPE' };
      expect(isValidMessage(invalidMessage)).toBe(false);
    });

    it('should reject messages without type', () => {
      const noTypeMessage = { payload: { data: 'test' } };
      expect(isValidMessage(noTypeMessage)).toBe(false);
    });

    it('should reject non-object messages', () => {
      expect(isValidMessage(null)).toBe(false);
      expect(isValidMessage(undefined)).toBe(false);
      expect(isValidMessage('string')).toBe(false);
      expect(isValidMessage(123)).toBe(false);
      expect(isValidMessage([])).toBe(false);
    });
  });

  describe('Message Payload Handling', () => {
    it('should include optional payload', () => {
      const message = createMessage({
        type: 'UPDATE_SETTINGS',
        payload: {
          platforms: { youtube: false },
        },
      });

      expect(message.payload).toBeDefined();
      expect(message.payload?.platforms?.youtube).toBe(false);
    });

    it('should handle nested payloads', () => {
      const message = createMessage({
        type: 'UPDATE_SETTINGS',
        payload: {
          platforms: {
            youtube: true,
            tiktok: false,
            instagram: true,
          },
          preferences: {
            showStats: false,
          },
        },
      });

      expect(message.payload?.platforms?.tiktok).toBe(false);
      expect(message.payload?.preferences?.showStats).toBe(false);
    });

    it('should handle empty payload', () => {
      const message = createMessage({
        type: 'GET_SETTINGS',
      });

      expect(message.payload).toBeUndefined();
    });
  });

  describe('Message Security', () => {
    it('should not allow prototype pollution in messages', () => {
      const maliciousMessage = {
        type: 'UPDATE_SETTINGS',
        timestamp: Date.now(),
        payload: { __proto__: { admin: true } },
      };

      // Should still be a valid message structure
      expect(isValidMessage(maliciousMessage)).toBe(true);

      // But the prototype shouldn't be affected
      const obj: Record<string, unknown> = {};
      expect(obj.admin).toBeUndefined();
    });

    it('should validate message type is a string', () => {
      const numericType = { type: 123 };
      expect(isValidMessage(numericType)).toBe(false);

      const objectType = { type: { name: 'GET_SETTINGS' } };
      expect(isValidMessage(objectType)).toBe(false);
    });
  });

  describe('Message Roundtrip Simulation', () => {
    it('should serialize and deserialize messages correctly', () => {
      const originalMessage = createMessage({
        type: 'UPDATE_SETTINGS',
        payload: {
          enabled: true,
          platforms: { youtube: true, tiktok: false, instagram: true },
        },
      });

      // Simulate JSON serialization (as happens in message passing)
      const serialized = JSON.stringify(originalMessage);
      const deserialized = JSON.parse(serialized);

      expect(isValidMessage(deserialized)).toBe(true);
      expect(deserialized.type).toBe(originalMessage.type);
      expect(deserialized.payload).toEqual(originalMessage.payload);
    });

    it('should handle special characters in payloads', () => {
      const message = createMessage({
        type: 'UPDATE_SETTINGS',
        payload: {
          blockPage: {
            title: 'Test "Special" & <chars>',
          },
        },
      });

      const serialized = JSON.stringify(message);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.payload.blockPage.title).toBe(
        'Test "Special" & <chars>'
      );
    });

    it('should handle unicode characters', () => {
      const message = createMessage({
        type: 'UPDATE_SETTINGS',
        payload: {
          blockPage: {
            title: '日本語タイトル',
          },
        },
      });

      const serialized = JSON.stringify(message);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.payload.blockPage.title).toBe('日本語タイトル');
    });
  });
});

/* eslint-disable security/detect-unsafe-regex */
/**
 * Input validation utilities
 * Security: Validates and sanitizes all user inputs
 */

import { LIMITS } from '@/shared/constants';
import type { Platform } from '@/shared/types';

/**
 * Validate and sanitize user text input
 */
export function sanitizeTextInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  return (
    input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML tags
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  ); // Remove control characters
}

/**
 * Validate URL format
 */
export function isValidUrlFormat(url: string): boolean {
  if (typeof url !== 'string' || url.length > LIMITS.MAX_URL_LENGTH) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  if (typeof domain !== 'string' || domain.length > 253) {
    return false;
  }

  // Basic domain validation
  const domainPattern =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainPattern.test(domain);
}

/**
 * Validate YouTube channel ID format
 */
export function isValidChannelId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }

  // UC prefix + 22 characters
  if (/^UC[\w-]{22}$/.test(id)) {
    return true;
  }

  // @handle format (1-30 characters, alphanumeric with dots and underscores)
  if (/^@[\w.]{1,30}$/.test(id)) {
    return true;
  }

  return false;
}

/**
 * Validate platform value
 */
export function isValidPlatform(value: string): value is Platform {
  const validPlatforms: Platform[] = ['youtube', 'tiktok', 'instagram'];
  return validPlatforms.includes(value as Platform);
}

/**
 * Validate CSS selector
 * Security: Prevents overly complex or malicious selectors
 */
export function isValidSelector(selector: string): boolean {
  if (typeof selector !== 'string') {
    return false;
  }

  if (selector.length > LIMITS.MAX_SELECTOR_LENGTH) {
    return false;
  }

  // Block potentially dangerous patterns
  const dangerousPatterns = [
    /javascript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /@import/i,
  ];

  if (dangerousPatterns.some((pattern) => pattern.test(selector))) {
    return false;
  }

  // Try to validate by using querySelector (catches syntax errors)
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate regex pattern
 * Security: Prevents ReDoS attacks
 */
export function isValidRegexPattern(pattern: string): boolean {
  if (typeof pattern !== 'string' || pattern.length > 500) {
    return false;
  }

  // Detect potentially catastrophic backtracking patterns
  const dangerousPatterns = [
    /\(\.\*\)\+/g, // (.*)+
    /\(\.\+\)\+/g, // (.+)+
    /\(\.\*\)\*/g, // (.*)*
    /\(\.\+\)\*/g, // (.+)*
    /\([^)]*\|[^)]*\)\+/g, // (a|b)+ style
  ];

  if (dangerousPatterns.some((dp) => dp.test(pattern))) {
    return false;
  }

  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate import file size
 */
export function isValidImportSize(size: number): boolean {
  return typeof size === 'number' && size > 0 && size <= LIMITS.MAX_IMPORT_SIZE;
}

/**
 * Validate JSON structure
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely with validation
 */
export function safeJsonParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Alias for sanitizeTextInput
 */
export function sanitizeInput(input: string, maxLength?: number): string {
  return sanitizeTextInput(input, maxLength);
}

/**
 * Validate channel ID with result object
 */
export function validateChannelId(id: string): ValidationResult {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'Channel ID is required' };
  }

  const sanitized = sanitizeTextInput(id.trim(), 100);

  if (!sanitized) {
    return { isValid: false, error: 'Channel ID cannot be empty' };
  }

  // Accept @handle format (more permissive for TikTok/Instagram)
  if (/^@[\w.]{1,50}$/.test(sanitized)) {
    return { isValid: true };
  }

  // YouTube UC format
  if (/^UC[\w-]{22}$/.test(sanitized)) {
    return { isValid: true };
  }

  // Simple username (no @ prefix)
  if (/^[\w.]{1,50}$/.test(sanitized)) {
    return { isValid: true };
  }

  return { isValid: false, error: 'Invalid channel ID format' };
}

/**
 * Validate URL with result object
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const sanitized = sanitizeTextInput(url.trim(), LIMITS.MAX_URL_LENGTH);

  if (!sanitized) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  if (!isValidUrlFormat(sanitized)) {
    return {
      isValid: false,
      error: 'Invalid URL format. Must start with http:// or https://',
    };
  }

  return { isValid: true };
}

/**
 * Validate CSS selector with result object
 */
export function validateCssSelector(selector: string): ValidationResult {
  if (!selector || typeof selector !== 'string') {
    return { isValid: false, error: 'Selector is required' };
  }

  const sanitized = sanitizeTextInput(
    selector.trim(),
    LIMITS.MAX_SELECTOR_LENGTH
  );

  if (!sanitized) {
    return { isValid: false, error: 'Selector cannot be empty' };
  }

  // Block potentially dangerous patterns
  const dangerousPatterns = [
    /javascript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /@import/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: 'Selector contains unsafe patterns' };
    }
  }

  // Try to validate by using querySelector
  try {
    document.createDocumentFragment().querySelector(sanitized);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid CSS selector syntax' };
  }
}

/**
 * Validate settings object
 */
export function validateSettings(data: unknown): ValidationResult {
  if (data === null || data === undefined || typeof data !== 'object') {
    return { isValid: false, error: 'Settings must be an object' };
  }

  const settings = data as Record<string, unknown>;

  // Validate enabled
  if ('enabled' in settings && typeof settings.enabled !== 'boolean') {
    return { isValid: false, error: 'enabled must be a boolean' };
  }

  // Validate platforms
  if ('platforms' in settings) {
    if (typeof settings.platforms !== 'object' || settings.platforms === null) {
      return { isValid: false, error: 'platforms must be an object' };
    }

    const platforms = settings.platforms as Record<string, unknown>;
    for (const [key, value] of Object.entries(platforms)) {
      if (!['youtube', 'tiktok', 'instagram'].includes(key)) {
        return { isValid: false, error: `Unknown platform: ${key}` };
      }
      if (typeof value !== 'boolean') {
        return { isValid: false, error: `Platform ${key} must be a boolean` };
      }
    }
  }

  // Validate preferences
  if ('preferences' in settings) {
    if (
      typeof settings.preferences !== 'object' ||
      settings.preferences === null
    ) {
      return { isValid: false, error: 'preferences must be an object' };
    }
  }

  return { isValid: true };
}

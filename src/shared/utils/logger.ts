/* eslint-disable no-console */
/**
 * Safe logging utility
 * Security: Sanitizes data, prevents sensitive data logging, rate limits
 */

import type { LogLevel, AppLogEntry } from '@/shared/types';

/**
 * Maximum log buffer size
 */
const MAX_BUFFER_SIZE = 1000;

/**
 * Patterns for sensitive data that should not be logged
 */
const SENSITIVE_PATTERNS = [
  /token/i,
  /key/i,
  /password/i,
  /secret/i,
  /auth/i,
  /credential/i,
  /session/i,
  /cookie/i,
] as const;

/**
 * Log level priority (higher = more severe)
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

/**
 * Current minimum log level
 */
let minLogLevel: LogLevel = __DEV__ ? 'debug' : 'warn';

/**
 * Log entries buffer for storage
 */
const logBuffer: AppLogEntry[] = [];

/**
 * Rate limiting state
 */
const rateLimitState: Map<string, number> = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_LOGS_PER_WINDOW = 10;

/**
 * Set minimum log level
 */
export function setLogLevel(level: LogLevel): void {
  minLogLevel = level;
}

/**
 * Check if key might contain sensitive data
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Sanitize object by redacting sensitive data
 */
function sanitize(data: unknown, depth = 0): unknown {
  // Prevent deep recursion
  if (depth > 5) {
    return '[MAX_DEPTH]';
  }

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Truncate long strings
    return data.length > 500 ? data.slice(0, 500) + '...' : data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    // Limit array size
    return data.slice(0, 20).map((item) => sanitize(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value, depth + 1);
      }
    }

    return sanitized;
  }

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(data);
}

/**
 * Check rate limit for a namespace
 */
function checkRateLimit(namespace: string): boolean {
  const now = Date.now();
  const key = `${namespace}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;

  const count = rateLimitState.get(key) ?? 0;

  if (count >= MAX_LOGS_PER_WINDOW) {
    return false;
  }

  rateLimitState.set(key, count + 1);

  // Cleanup old entries
  for (const [k] of rateLimitState) {
    const keyTime = parseInt(k.split(':')[1] ?? '0', 10);
    if (now - keyTime * RATE_LIMIT_WINDOW > RATE_LIMIT_WINDOW * 2) {
      rateLimitState.delete(k);
    }
  }

  return true;
}

/**
 * Generate unique ID for log entry
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Log a message
 */
function log(
  level: LogLevel,
  namespace: string,
  message: string,
  context?: Record<string, unknown>
): void {
  // Check log level
  if (LOG_LEVELS[level] < LOG_LEVELS[minLogLevel]) {
    return;
  }

  // Check rate limit
  if (!checkRateLimit(namespace)) {
    return;
  }

  const entry: AppLogEntry = {
    id: generateId(),
    timestamp: Date.now(),
    level,
    namespace,
    message: message.slice(0, 500), // Truncate message
    context: context
      ? (sanitize(context) as Record<string, unknown>)
      : undefined,
  };

  // Add to buffer
  logBuffer.push(entry);

  // Trim buffer if too large
  while (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Console output in development
  if (__DEV__) {
    const prefix = `[${namespace}]`;
    const args = context ? [prefix, message, context] : [prefix, message];

    switch (level) {
      case 'debug':
        console.debug(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'error':
        console.error(...args);
        break;
    }
  }
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      log('debug', namespace, message, context),
    info: (message: string, context?: Record<string, unknown>) =>
      log('info', namespace, message, context),
    warn: (message: string, context?: Record<string, unknown>) =>
      log('warn', namespace, message, context),
    error: (message: string, context?: Record<string, unknown>) =>
      log('error', namespace, message, context),
  };
}

/**
 * Get buffered logs (for storage/export)
 */
export function getLogBuffer(): readonly AppLogEntry[] {
  return [...logBuffer];
}

/**
 * Clear log buffer
 */
export function clearLogBuffer(): void {
  logBuffer.length = 0;
}

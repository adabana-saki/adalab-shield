/**
 * Central export for all utility functions
 */

// i18n utilities
export {
  t,
  getUILanguage,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatDuration,
} from './i18n';

// URL utilities
export {
  isValidUrl,
  parseUrl,
  getHostname,
  getPathname,
  extractYouTubeVideoId,
  isValidYouTubeVideoId,
  isValidYouTubeChannelId,
  shortsToWatchUrl,
  matchesUrlPattern,
  normalizeUrl,
} from './url';

// Logger utilities
export {
  createLogger,
  setLogLevel,
  getLogBuffer,
  clearLogBuffer,
} from './logger';

// Storage utilities
export {
  getSettings,
  saveSettings,
  updateSettings,
  getCustomRules,
  saveCustomRules,
  getStorageInfo,
  clearAllData,
  exportData,
  importData,
} from './storage';

// Validation utilities
export {
  sanitizeTextInput,
  isValidUrlFormat,
  isValidDomain,
  isValidChannelId,
  isValidPlatform,
  isValidSelector,
  isValidRegexPattern,
  isValidImportSize,
  isValidJson,
  safeJsonParse,
} from './validation';

// Schedule utilities
export {
  isScheduleActive,
  formatTime,
  parseTime,
  getDayName,
  isValidTimeRange,
} from './schedule';

// Crypto utilities
export { hashPin, verifyPin, isValidPinFormat } from './crypto';

export { getLocalDateString } from './date';

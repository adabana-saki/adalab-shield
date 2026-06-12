/**
 * Legal information and seller details for compliance
 * Update these values with your actual business information
 */

/**
 * Seller information for Japanese Commercial Transaction Law (特定商取引法)
 * Required for selling digital products in Japan
 */
export const SELLER_INFO = {
  /** Business name (屋号) or company name */
  businessName: 'ADA LAB',
  /** Representative name (代表者名) */
  representative: 'Adabana Saki',
  /** Business address (所在地) - disclosed upon request per 特定商取引法 */
  address: '',
  /** Contact email address */
  email: 'info.adalabtech@gmail.com',
  /** Contact phone (optional but recommended) */
  phone: '',
  /** Business registration number (if applicable) */
  registrationNumber: '',
} as const;

/**
 * Legal document URLs (can be external links or internal routes)
 */
export const LEGAL_URLS = {
  termsOfService: '/legal/terms',
  privacyPolicy: '/legal/privacy',
  chromeWebStorePolicy:
    'https://support.google.com/chrome_webstore/answer/1060570',
} as const;

/**
 * Data collection disclosure for privacy policy
 */
export const DATA_COLLECTION = {
  /** Types of data collected */
  collectedData: [
    'blocking_statistics', // Number of blocks, platforms blocked
    'usage_patterns', // Feature usage for improvement
    'user_preferences', // Settings and configurations
  ],
  /** Data NOT collected */
  notCollectedData: [
    'browsing_history',
    'personal_identifiers',
    'location_data',
    'payment_details',
  ],
  /** Data retention period */
  retentionPeriod: 'Until account deletion or 2 years of inactivity',
} as const;

/**
 * Contact information for support
 */
export const SUPPORT_INFO = {
  email: SELLER_INFO.email,
  responseTimeHours: 48,
  languages: ['ja', 'en'],
} as const;

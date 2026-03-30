/**
 * Blocking rules engine
 * Loads and manages platform-specific blocking rules
 */

import type { Platform } from '@/shared/types';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('rules');

/**
 * Selector rule for matching elements
 */
export interface SelectorRule {
  /** CSS selector to match elements */
  readonly selector: string;
  /** Description of what this selector matches */
  readonly description: string;
  /** Whether this rule is enabled by default */
  readonly enabled: boolean;
  /** Priority (higher = checked first) */
  readonly priority: number;
}

/**
 * URL pattern rule for matching pages
 */
export interface UrlRule {
  /** URL pattern (supports wildcards) */
  readonly pattern: string;
  /** Description of what this pattern matches */
  readonly description: string;
  /** Whether to block the entire page or just elements */
  readonly blockPage: boolean;
  /** Whether this rule is enabled by default */
  readonly enabled: boolean;
}

/**
 * Container finding rule for locating parent elements
 */
export interface ContainerRule {
  /** CSS selector or attribute pattern */
  readonly pattern: string;
  /** Type of pattern matching */
  readonly type: 'selector' | 'class' | 'attribute';
  /** Maximum traversal depth */
  readonly maxDepth: number;
}

/**
 * Platform-specific blocking rules
 */
export interface PlatformRules {
  /** Platform identifier */
  readonly platform: Platform;
  /** Version of this rule set */
  readonly version: string;
  /** Last updated timestamp */
  readonly lastUpdated: string;
  /** Selector rules for finding elements */
  readonly selectors: readonly SelectorRule[];
  /** URL patterns for page-level blocking */
  readonly urlPatterns: readonly UrlRule[];
  /** Container rules for finding parent elements */
  readonly containers: readonly ContainerRule[];
}

/**
 * All loaded platform rules
 */
const rulesCache = new Map<Platform, PlatformRules>();

/**
 * YouTube blocking rules
 */
const youtubeRules: PlatformRules = {
  platform: 'youtube',
  version: '1.0.0',
  lastUpdated: '2025-01-01',
  selectors: [
    {
      selector: 'ytd-reel-shelf-renderer',
      description: 'YouTube Shorts shelf on homepage',
      enabled: true,
      priority: 10,
    },
    {
      selector: 'ytd-rich-section-renderer:has([is-shorts])',
      description: 'Rich section containing Shorts',
      enabled: true,
      priority: 9,
    },
    {
      selector: 'ytd-reel-item-renderer',
      description: 'Individual Shorts item in shelf',
      enabled: true,
      priority: 8,
    },
    {
      selector: 'a[href*="/shorts/"]',
      description: 'Links to Shorts videos',
      enabled: true,
      priority: 7,
    },
    {
      selector: '[page-subtype="shorts"]',
      description: 'Shorts page identifier',
      enabled: true,
      priority: 10,
    },
    {
      selector: 'ytd-guide-entry-renderer a[title="Shorts"]',
      description: 'Shorts navigation link',
      enabled: true,
      priority: 6,
    },
    {
      selector: 'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
      description: 'Mini guide Shorts entry',
      enabled: true,
      priority: 6,
    },
  ],
  urlPatterns: [
    {
      pattern: '/shorts/*',
      description: 'Shorts video page',
      blockPage: true,
      enabled: true,
    },
    {
      pattern: '/shorts',
      description: 'Shorts browse page',
      blockPage: true,
      enabled: true,
    },
  ],
  containers: [
    {
      pattern: 'ytd-rich-item-renderer',
      type: 'selector',
      maxDepth: 5,
    },
    {
      pattern: 'ytd-video-renderer',
      type: 'selector',
      maxDepth: 5,
    },
  ],
};

/**
 * TikTok blocking rules
 */
const tiktokRules: PlatformRules = {
  platform: 'tiktok',
  version: '1.0.0',
  lastUpdated: '2025-01-01',
  selectors: [
    {
      selector: '[data-e2e="recommend-list-item-container"]',
      description: 'For You page video item',
      enabled: true,
      priority: 10,
    },
    {
      selector: '[class*="DivItemContainer"]',
      description: 'Video feed item container',
      enabled: true,
      priority: 9,
    },
    {
      selector: '[data-e2e="search-card-container"]',
      description: 'Search results video card',
      enabled: true,
      priority: 8,
    },
    {
      selector: '[data-e2e="user-post-item"]',
      description: 'User profile video item',
      enabled: true,
      priority: 8,
    },
    {
      selector: '[data-e2e="following-item"]',
      description: 'Following feed item',
      enabled: true,
      priority: 8,
    },
    {
      selector: '[class*="DivVideoContainer"]',
      description: 'Video player container',
      enabled: true,
      priority: 7,
    },
    {
      selector: 'a[href*="/video/"]',
      description: 'Links to video pages',
      enabled: true,
      priority: 6,
    },
  ],
  urlPatterns: [
    {
      pattern: '/foryou',
      description: 'For You page',
      blockPage: true,
      enabled: true,
    },
    {
      pattern: '/',
      description: 'Home page (For You)',
      blockPage: true,
      enabled: true,
    },
    {
      pattern: '/@*/video/*',
      description: 'Individual video page',
      blockPage: true,
      enabled: true,
    },
  ],
  containers: [
    {
      pattern: 'ItemContainer',
      type: 'class',
      maxDepth: 10,
    },
    {
      pattern: 'VideoCard',
      type: 'class',
      maxDepth: 10,
    },
    {
      pattern: 'data-e2e',
      type: 'attribute',
      maxDepth: 10,
    },
  ],
};

/**
 * Instagram blocking rules
 */
const instagramRules: PlatformRules = {
  platform: 'instagram',
  version: '1.0.0',
  lastUpdated: '2025-01-01',
  selectors: [
    {
      selector: '[href*="/reels/"]',
      description: 'Reels tab content links',
      enabled: true,
      priority: 10,
    },
    {
      selector: '[href*="/reel/"]',
      description: 'Individual reel links',
      enabled: true,
      priority: 10,
    },
    {
      selector: 'a[href^="/reels"]',
      description: 'Reels section in explore',
      enabled: true,
      priority: 9,
    },
    {
      selector: 'article a[href*="/reel/"]',
      description: 'Reel posts in articles',
      enabled: true,
      priority: 8,
    },
    {
      selector: 'a[href="/reels/"]',
      description: 'Reels navigation link',
      enabled: true,
      priority: 7,
    },
  ],
  urlPatterns: [
    {
      pattern: '/reels/*',
      description: 'Reels browse page',
      blockPage: true,
      enabled: true,
    },
    {
      pattern: '/reel/*',
      description: 'Individual reel page',
      blockPage: true,
      enabled: true,
    },
  ],
  containers: [
    {
      pattern: 'article',
      type: 'selector',
      maxDepth: 5,
    },
    {
      pattern: '_aagw',
      type: 'class',
      maxDepth: 5,
    },
    {
      pattern: '_aabd',
      type: 'class',
      maxDepth: 5,
    },
    {
      pattern: 'x1lliihq',
      type: 'class',
      maxDepth: 5,
    },
  ],
};

/**
 * Initialize rules cache with all platform rules
 */
function initializeRules(): void {
  rulesCache.set('youtube', youtubeRules);
  rulesCache.set('tiktok', tiktokRules);
  rulesCache.set('instagram', instagramRules);
  logger.debug('Rules initialized', {
    platforms: Array.from(rulesCache.keys()),
  });
}

// Initialize on module load
initializeRules();

/**
 * Get blocking rules for a platform
 */
export function getRules(platform: Platform): PlatformRules | null {
  return rulesCache.get(platform) ?? null;
}

/**
 * Get all selector rules for a platform
 */
export function getSelectors(platform: Platform): readonly SelectorRule[] {
  const rules = rulesCache.get(platform);
  if (!rules) {
    return [];
  }
  return rules.selectors
    .filter((s) => s.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get all URL patterns for a platform
 */
export function getUrlPatterns(platform: Platform): readonly UrlRule[] {
  const rules = rulesCache.get(platform);
  if (!rules) {
    return [];
  }
  return rules.urlPatterns.filter((p) => p.enabled);
}

/**
 * Get container rules for a platform
 */
export function getContainerRules(
  platform: Platform
): readonly ContainerRule[] {
  const rules = rulesCache.get(platform);
  if (!rules) {
    return [];
  }
  return rules.containers;
}

/**
 * Check if a URL matches any blocking pattern
 */
export function matchesUrlPattern(
  platform: Platform,
  pathname: string
): UrlRule | null {
  const patterns = getUrlPatterns(platform);

  for (const rule of patterns) {
    if (matchPattern(rule.pattern, pathname)) {
      return rule;
    }
  }

  return null;
}

/**
 * Simple pattern matching with wildcards
 */
function matchPattern(pattern: string, pathname: string): boolean {
  // Convert pattern to regex
  // * matches any characters except /
  // ** matches any characters including /
  const regexPattern = pattern
    .replace(/\*\*/g, '<<<DOUBLE_STAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<DOUBLE_STAR>>>/g, '.*')
    .replace(/\//g, '\\/');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Find container element using rules
 */
export function findContainer(
  platform: Platform,
  element: HTMLElement
): HTMLElement | null {
  const rules = getContainerRules(platform);

  for (const rule of rules) {
    let current: HTMLElement | null = element;
    let depth = 0;

    while (current !== null && depth < rule.maxDepth) {
      current = current.parentElement;
      depth++;

      if (current === null) {
        break;
      }

      if (matchesContainerRule(current, rule)) {
        return current;
      }
    }
  }

  return null;
}

/**
 * Check if element matches a container rule
 */
function matchesContainerRule(
  element: HTMLElement,
  rule: ContainerRule
): boolean {
  switch (rule.type) {
    case 'selector':
      return element.matches(rule.pattern);
    case 'class':
      return element.className?.toString().includes(rule.pattern) ?? false;
    case 'attribute':
      return element.hasAttribute(rule.pattern);
    default:
      return false;
  }
}

/**
 * Get all platforms with rules
 */
export function getSupportedPlatforms(): readonly Platform[] {
  return Array.from(rulesCache.keys());
}

/**
 * Get rule version for a platform
 */
export function getRuleVersion(platform: Platform): string | null {
  const rules = rulesCache.get(platform);
  return rules?.version ?? null;
}

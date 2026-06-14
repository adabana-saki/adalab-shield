/**
 * Custom domain detector
 * Blocks entire sites for user-specified domains
 */

import { BasePlatformDetector } from './base';
import type { Platform, CustomBlockedDomain } from '@/shared/types';
import { DEFAULT_BLOCK_PAGE, isProtectedHost } from '@/shared/constants';
import { createLogger } from '@/shared/utils/logger';
import { showBlockPage } from '../blockPage';
import { isScheduleActive } from '@/shared/utils/schedule';

const logger = createLogger('custom-domain');

/**
 * Custom domain detector - blocks user-specified domains
 */
export class CustomDomainDetector extends BasePlatformDetector {
  // Use 'youtube' as a placeholder platform for stats
  // Custom domains are tracked separately
  readonly platform: Platform = 'youtube';
  private customDomains: readonly CustomBlockedDomain[] = [];
  private hasBlocked = false;

  /**
   * Update the list of custom blocked domains
   */
  setCustomDomains(domains: readonly CustomBlockedDomain[]): void {
    this.customDomains = domains;
  }

  /**
   * Get the list of custom blocked domains
   */
  getCustomDomains(): readonly CustomBlockedDomain[] {
    return this.customDomains;
  }

  /**
   * Override isEnabled to check global enabled state, schedule, and Pomodoro breaks
   * Custom domains should work independently of platform-specific settings
   */
  override isEnabled(): boolean {
    if (this.settings === null) {
      return true; // Default to enabled if settings not loaded
    }

    // Check if in Pomodoro break - unblock during breaks
    if (this.isInPomodoroBreak()) {
      return false;
    }

    // For custom domains, check global enabled state
    if (!this.settings.enabled) {
      return false;
    }

    // Check schedule - if schedule is enabled, only block during scheduled times
    return isScheduleActive(this.settings.schedule);
  }

  /**
   * Check if the current hostname matches any custom blocked domain
   */
  isSupported(hostname: string): boolean {
    // Never block protected hosts (e.g. the adalab study app), even if the
    // user added a matching custom domain by mistake.
    if (isProtectedHost(hostname)) {
      return false;
    }
    return this.customDomains.some((entry) =>
      this.matchesDomain(hostname, entry.domain)
    );
  }

  /**
   * Check if a hostname matches a domain pattern
   * Supports wildcard patterns:
   * - `youtube.com` - exact match (including subdomains)
   * - `*youtube*` - contains "youtube" anywhere in hostname
   * - `youtube*` - starts with "youtube"
   * - `*youtube` - ends with "youtube"
   * - `*.youtube.com` - any subdomain of youtube.com
   */
  private matchesDomain(hostname: string, domain: string): boolean {
    const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    // Check if pattern contains wildcards
    if (normalizedDomain.includes('*')) {
      return this.matchesWildcardPattern(normalizedHostname, normalizedDomain);
    }

    // Exact match
    if (normalizedHostname === normalizedDomain) {
      return true;
    }

    // Subdomain match (e.g., m.example.com matches example.com)
    if (normalizedHostname.endsWith('.' + normalizedDomain)) {
      return true;
    }

    return false;
  }

  /**
   * Match hostname against wildcard pattern
   */
  private matchesWildcardPattern(hostname: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    // Escape special regex characters except *
    const escapedPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    const regex = new RegExp(`^${escapedPattern}$`);
    return regex.test(hostname);
  }

  /**
   * Scan DOM - for custom domains, we block the entire page
   */
  scan(_root: HTMLElement): void {
    if (!this.isEnabled()) {
      return;
    }

    const hostname = window.location.hostname;
    const matchedDomain = this.customDomains.find((entry) =>
      this.matchesDomain(hostname, entry.domain)
    );

    if (matchedDomain) {
      this.blockEntirePage(matchedDomain);
    }
  }

  /**
   * Block the entire page content
   */
  private blockEntirePage(domain: CustomBlockedDomain): void {
    // Overlay already present: nothing to do. Checking the DOM (not a flag)
    // lets blocking re-engage after a Pomodoro break removed the overlay.
    if (document.getElementById('shortshield-custom-overlay')) {
      return;
    }

    logger.info('Blocking custom domain', {
      domain: domain.domain,
      hostname: window.location.hostname,
    });

    const displayDomain =
      domain.description !== undefined && domain.description !== ''
        ? domain.description
        : window.location.hostname;

    const blockPageSettings = this.settings?.blockPage ?? DEFAULT_BLOCK_PAGE;

    showBlockPage(
      blockPageSettings,
      displayDomain,
      'shortshield-custom-overlay'
    );

    // Log the block only once per page load (using youtube as placeholder platform)
    if (!this.hasBlocked) {
      this.hasBlocked = true;
      void this.logBlock(document.body, 'hide');
    }
  }
}

/**
 * Create a custom domain detector instance
 */
export function createCustomDomainDetector(): CustomDomainDetector {
  return new CustomDomainDetector();
}

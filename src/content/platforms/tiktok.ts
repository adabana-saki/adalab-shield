/**
 * TikTok detector
 * Detects and blocks TikTok video content
 */

import { BasePlatformDetector } from './base';
import type { Platform } from '@/shared/types';
import { TIKTOK_CONFIG } from '@/shared/constants';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('tiktok');

/**
 * TikTok video content detector
 */
export class TikTokDetector extends BasePlatformDetector {
  readonly platform: Platform = 'tiktok';

  /**
   * CSS selectors for TikTok video elements
   */
  private readonly selectors = [
    // For You page video items
    '[data-e2e="recommend-list-item-container"]',
    // Video feed items
    '[class*="DivItemContainer"]',
    // Video card in search/explore
    '[data-e2e="search-card-container"]',
    // User video list items
    '[data-e2e="user-post-item"]',
    // Following feed items
    '[data-e2e="following-item"]',
    // Video player container
    '[class*="DivVideoContainer"]',
  ] as const;

  /**
   * Check if TikTok is supported
   */
  isSupported(hostname: string): boolean {
    return TIKTOK_CONFIG.hosts.includes(hostname);
  }

  /**
   * Scan DOM for TikTok videos
   */
  scan(root: HTMLElement): void {
    if (!this.isEnabled()) {
      return;
    }

    // Check URL-based blocking
    if (this.shouldBlockCurrentPage()) {
      this.blockCurrentPage();
      return;
    }

    // DOM-based detection
    for (const selector of this.selectors) {
      try {
        const elements = root.querySelectorAll<HTMLElement>(selector);

        for (const element of elements) {
          this.processElement(element);
        }
      } catch {
        // Selector might not be valid in some cases
        logger.debug('Selector query failed', { selector });
      }
    }

    // Also scan for video links
    this.scanVideoLinks(root);
  }

  /**
   * Check if current page should be blocked entirely
   */
  private shouldBlockCurrentPage(): boolean {
    const pathname = window.location.pathname;

    // Block For You page (including root)
    if (pathname === '/foryou' || pathname === '/') {
      return true;
    }

    // Block localized home pages (e.g., /ja-JP/, /en/, /ko-KR/)
    // eslint-disable-next-line security/detect-unsafe-regex
    if (pathname.match(/^\/[a-z]{2}(-[A-Z]{2})?\/?$/)) {
      return true;
    }

    // Block localized For You pages (e.g., /ja-JP/foryou)
    // eslint-disable-next-line security/detect-unsafe-regex
    if (pathname.match(/^\/[a-z]{2}(-[A-Z]{2})?\/foryou\/?$/)) {
      return true;
    }

    // Block individual video pages
    if (pathname.match(/^\/@[\w.-]+\/video\/\d+/)) {
      return true;
    }

    // Block localized video pages (e.g., /ja-JP/@user/video/123)
    // eslint-disable-next-line security/detect-unsafe-regex
    if (pathname.match(/^\/[a-z]{2}(-[A-Z]{2})?\/@[\w.-]+\/video\/\d+/)) {
      return true;
    }

    return false;
  }

  /**
   * Block the current page content
   */
  private blockCurrentPage(): void {
    logger.info('Blocking TikTok page', { pathname: window.location.pathname });

    // Check if overlay already exists
    if (document.getElementById('shortshield-tiktok-overlay')) {
      return;
    }

    // Blur the main content
    this.blurMainContent([
      '[id="main-content-homepage_hot"]',
      '[class*="DivMainContainer"]',
      '[class*="DivBodyContainer"]',
      'main',
    ]);

    // Create blocking overlay using customizable method
    const overlay = this.createBlockOverlay({
      id: 'shortshield-tiktok-overlay',
      title: 'TikTok Blocked',
      message:
        'adalab shield is protecting your focus by blocking TikTok content.',
      platformName: 'TikTok',
      primaryButtonText: 'Close Tab',
      onPrimaryClick: () => {
        window.close();
      },
      onBypassClick: () => {
        this.handleBypass();
      },
    });

    document.body.appendChild(overlay);
    void this.logBlock(overlay, 'blur');
  }

  /**
   * Handle bypass button click - temporarily disable blocking
   */
  private handleBypass(): void {
    const overlay = document.getElementById('shortshield-tiktok-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Remove blur from main content
    const selectors = [
      '[id="main-content-homepage_hot"]',
      '[class*="DivMainContainer"]',
      '[class*="DivBodyContainer"]',
      'main',
    ];
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        element.style.removeProperty('filter');
        element.style.removeProperty('pointer-events');
      }
    }

    // Set a temporary bypass flag in sessionStorage
    sessionStorage.setItem('shortshield-bypass-tiktok', Date.now().toString());

    logger.info('Bypass activated for TikTok');
  }

  /**
   * Process a detected element
   */
  private processElement(element: HTMLElement): void {
    // Skip if already processed
    if (element.dataset.shortshieldHidden === 'true') {
      return;
    }

    // Apply action
    this.applyAction(element, 'hide');

    // Log the block
    void this.logBlock(element, 'hide');

    logger.debug('Blocked TikTok element', {
      className: element.className?.toString().slice(0, 50),
    });
  }

  /**
   * Scan for video links
   */
  private scanVideoLinks(root: HTMLElement): void {
    // Find links to video pages
    const videoLinks =
      root.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]');

    for (const link of videoLinks) {
      const parent = this.findParentContainer(link);

      if (parent && parent.dataset.shortshieldHidden !== 'true') {
        this.applyAction(parent, 'hide');
        void this.logBlock(link, 'hide');
      }
    }
  }

  /**
   * Find parent container for a link
   */
  private findParentContainer(link: HTMLAnchorElement): HTMLElement | null {
    // Try to find a suitable parent container
    let current: HTMLElement | null = link;

    for (let i = 0; i < 10 && current !== null; i++) {
      current = current.parentElement;

      if (current === null) {
        break;
      }

      // Check for common container patterns
      const className = current.className?.toString() ?? '';

      if (
        className.includes('ItemContainer') ||
        className.includes('VideoCard') ||
        className.includes('DivWrapper')
      ) {
        return current;
      }

      // Check for data attributes
      if (
        (current.dataset.e2e !== undefined &&
          current.dataset.e2e.includes('item')) ||
        (current.dataset.e2e !== undefined &&
          current.dataset.e2e.includes('card'))
      ) {
        return current;
      }
    }

    return null;
  }

  /**
   * Extract URL from element
   */
  protected override extractUrl(element: HTMLElement): string | null {
    const link = element.querySelector<HTMLAnchorElement>(
      'a[href*="/video/"], a[href*="/@"]'
    );

    if (link !== null && link.href !== '') {
      return link.href;
    }

    if (element instanceof HTMLAnchorElement) {
      return element.href;
    }

    return super.extractUrl(element);
  }
}

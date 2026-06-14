/**
 * Instagram Reels detector
 * Detects and blocks Instagram Reels content
 */

import { BasePlatformDetector } from './base';
import type { Platform } from '@/shared/types';
import { INSTAGRAM_CONFIG } from '@/shared/constants';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('instagram');

/**
 * Instagram Reels content detector
 */
export class InstagramDetector extends BasePlatformDetector {
  readonly platform: Platform = 'instagram';

  /**
   * CSS selectors for Instagram Reels elements
   */
  private readonly selectors = [
    // Reels tab content
    '[href*="/reels/"]',
    // Reel video container
    '[href*="/reel/"]',
    // Reels section in explore
    'a[href^="/reels"]',
    // Individual reel posts
    'article a[href*="/reel/"]',
  ] as const;

  /**
   * Check if Instagram is supported
   */
  isSupported(hostname: string): boolean {
    return INSTAGRAM_CONFIG.hosts.includes(hostname);
  }

  /**
   * Scan DOM for Instagram Reels
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
        logger.debug('Selector query failed', { selector });
      }
    }

    // Scan for reels in feed
    this.scanFeedReels(root);
  }

  /**
   * Check if current page is a Reels page
   */
  private shouldBlockCurrentPage(): boolean {
    const pathname = window.location.pathname;

    // Block /reels/ pages
    if (pathname.startsWith('/reels/') || pathname.startsWith('/reel/')) {
      return true;
    }

    return false;
  }

  /**
   * Block the current Reels page
   */
  private blockCurrentPage(): void {
    logger.info('Blocking Instagram Reels page', {
      pathname: window.location.pathname,
    });

    // Check if overlay already exists
    if (document.getElementById('shortshield-instagram-overlay')) {
      return;
    }

    // Blur the main content
    this.blurMainContent(['main', '[role="main"]', 'section']);

    // Create blocking overlay using customizable method
    const overlay = this.createBlockOverlay({
      id: 'shortshield-instagram-overlay',
      title: 'Instagram Reels Blocked',
      message:
        'adalab shield is protecting your focus by blocking Reels content.',
      platformName: 'Instagram',
      primaryButtonText: 'Go to Instagram Home',
      onPrimaryClick: () => {
        window.location.href = 'https://www.instagram.com/';
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
    const overlay = document.getElementById('shortshield-instagram-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Remove blur from main content
    const selectors = ['main', '[role="main"]', 'section'];
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        element.style.removeProperty('filter');
        element.style.removeProperty('pointer-events');
      }
    }

    // Set a temporary bypass flag in sessionStorage
    sessionStorage.setItem(
      'shortshield-bypass-instagram',
      Date.now().toString()
    );

    logger.info('Bypass activated for Instagram');
  }

  /**
   * Process a detected element
   */
  private processElement(element: HTMLElement): void {
    // Skip if already processed
    if (element.dataset.shortshieldHidden === 'true') {
      return;
    }

    // Find the parent article or container to hide
    const target = this.findHideTarget(element);

    // Apply action
    this.applyAction(target, 'hide');

    // Log the block
    void this.logBlock(element, 'hide');

    logger.debug('Blocked Instagram Reels element');
  }

  /**
   * Find the appropriate parent element to hide
   */
  private findHideTarget(element: HTMLElement): HTMLElement {
    // Try to find article parent
    const article = element.closest<HTMLElement>('article');
    if (article) {
      return article;
    }

    // Try to find a container div
    let current: HTMLElement | null = element;
    for (let i = 0; i < 5 && current !== null; i++) {
      current = current.parentElement;

      if (current === null) {
        break;
      }

      // Instagram uses specific class patterns
      const className = current.className?.toString() ?? '';

      if (
        className.includes('_aagw') || // Explore grid item
        className.includes('_aabd') || // Feed item container
        className.includes('x1lliihq') // New class pattern
      ) {
        return current;
      }
    }

    return element;
  }

  /**
   * Scan for Reels in the main feed
   */
  private scanFeedReels(root: HTMLElement): void {
    // Find all articles in feed
    const articles = root.querySelectorAll<HTMLElement>('article');

    for (const article of articles) {
      // Check if article contains a reel link
      const reelLink = article.querySelector<HTMLAnchorElement>(
        'a[href*="/reel/"], a[href*="/reels/"]'
      );

      if (reelLink !== null && article.dataset.shortshieldHidden !== 'true') {
        // Reel link found - apply action
        this.applyAction(article, 'hide');
        void this.logBlock(article, 'hide');
      }
    }

    // Also hide Reels navigation tab/button
    this.hideReelsNavigation(root);
  }

  /**
   * Hide Reels navigation elements
   */
  private hideReelsNavigation(root: HTMLElement): void {
    // Find and hide Reels nav link
    const reelsNavLinks = root.querySelectorAll<HTMLElement>(
      'a[href="/reels/"], a[href^="/reels"]'
    );

    for (const link of reelsNavLinks) {
      // Only hide navigation links, not content links
      const isNavLink =
        link.closest('nav') !== null ||
        link.getAttribute('role') === 'link' ||
        link.closest('[role="navigation"]') !== null;

      if (isNavLink) {
        // Hide the parent nav item
        const navItem = link.closest('div, li');

        if (
          navItem instanceof HTMLElement &&
          navItem.dataset.shortshieldHidden !== 'true'
        ) {
          this.applyAction(navItem, 'hide');
        }
      }
    }
  }

  /**
   * Extract URL from element
   */
  protected override extractUrl(element: HTMLElement): string | null {
    const link = element.querySelector<HTMLAnchorElement>(
      'a[href*="/reel/"], a[href*="/reels/"], a[href*="/p/"]'
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

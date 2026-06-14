/**
 * YouTube Shorts detector
 * Detects and blocks YouTube Shorts content
 */

import { BasePlatformDetector } from './base';
import type { Platform } from '@/shared/types';
import { YOUTUBE_CONFIG } from '@/shared/constants';
import { createLogger } from '@/shared/utils/logger';
import { isValidYouTubeVideoId } from '@/shared/utils/url';

const logger = createLogger('youtube');

/**
 * Flag to prevent multiple redirects
 */
let isRedirecting = false;

/**
 * YouTube-specific short-form content detector
 */
export class YouTubeDetector extends BasePlatformDetector {
  readonly platform: Platform = 'youtube';

  /**
   * CSS selectors for YouTube Shorts elements
   */
  private readonly selectors = [
    // Shorts shelf on home page
    'ytd-rich-shelf-renderer[is-shorts]',
    // Individual shorts in feed
    'ytd-reel-video-renderer',
    // Shorts in rich grid
    'ytd-rich-item-renderer[is-shorts]',
    // Shorts overlay indicator
    '[overlay-style="SHORTS"]',
    // Shorts in search results
    'ytd-video-renderer[is-shorts]',
    // Shorts in channel page
    'ytd-grid-video-renderer[is-shorts]',
    // Shorts tab
    'ytd-reel-shelf-renderer',
  ] as const;

  /**
   * Check if YouTube is supported
   */
  isSupported(hostname: string): boolean {
    return YOUTUBE_CONFIG.hosts.includes(hostname);
  }

  /**
   * Check if full YouTube blocking is enabled
   */
  private isFullSiteBlockingEnabled(): boolean {
    if (!this.settings?.enabled) {
      return false;
    }
    return this.settings.platforms.youtube_full === true;
  }

  /**
   * Scan DOM for YouTube Shorts
   */
  scan(root: HTMLElement): void {
    // Check full site blocking first (higher priority)
    if (this.isFullSiteBlockingEnabled()) {
      this.blockFullSite();
      return;
    }

    if (!this.isEnabled()) {
      return;
    }

    // Check if on a Shorts URL
    if (this.isOnShortsPage()) {
      // If redirect preference is enabled, redirect
      if (this.settings?.preferences?.redirectShortsToRegular === true) {
        this.handleRedirect();
      } else {
        // Otherwise, block the page
        this.blockShortsPage();
      }
      return;
    }

    // DOM-based detection for feed elements
    for (const selector of this.selectors) {
      const elements = root.querySelectorAll<HTMLElement>(selector);

      for (const element of elements) {
        this.processElement(element);
      }
    }

    // Also check for shorts links
    this.scanShortsLinks(root);
  }

  /**
   * Check if current page is a Shorts URL
   */
  private isOnShortsPage(): boolean {
    return window.location.pathname.startsWith('/shorts/');
  }

  /**
   * Block the Shorts page with an overlay
   */
  private blockShortsPage(): void {
    // Prevent multiple overlays
    if (document.getElementById('shortshield-youtube-overlay')) {
      return;
    }

    // Blur the main content
    this.blurMainContent(['#content', 'ytd-app', '#page-manager']);

    // Create blocking overlay using customizable method
    const overlay = this.createBlockOverlay({
      id: 'shortshield-youtube-overlay',
      title: 'YouTube Shorts Blocked',
      message:
        'adalab shield is protecting your focus by blocking short-form video content.',
      platformName: 'YouTube',
      primaryButtonText: 'Go to YouTube Home',
      onPrimaryClick: () => {
        window.location.href = 'https://www.youtube.com/';
      },
      onBypassClick: () => {
        this.handleBypass('shortshield-youtube-overlay');
      },
    });

    document.body.appendChild(overlay);

    logger.info('Blocked YouTube Shorts page');
    void this.logBlock(overlay, 'blur');
  }

  /**
   * Block the full YouTube site with an overlay
   */
  private blockFullSite(): void {
    // Prevent multiple overlays
    if (document.getElementById('shortshield-youtube-full-overlay')) {
      return;
    }

    // Also remove any Shorts overlay if present
    const shortsOverlay = document.getElementById(
      'shortshield-youtube-overlay'
    );
    if (shortsOverlay) {
      shortsOverlay.remove();
    }

    // Blur the main content
    this.blurMainContent(['#content', 'ytd-app', '#page-manager', 'body']);

    // Create blocking overlay using customizable method
    const overlay = this.createBlockOverlay({
      id: 'shortshield-youtube-full-overlay',
      title: 'YouTube Blocked',
      message: 'adalab shield is blocking YouTube to help you stay focused.',
      platformName: 'YouTube',
      primaryButtonText: 'Close Tab',
      onPrimaryClick: () => {
        window.close();
      },
      onBypassClick: () => {
        this.handleBypass('shortshield-youtube-full-overlay');
      },
    });

    document.body.appendChild(overlay);

    logger.info('Blocked full YouTube site');
    void this.logBlock(overlay, 'blur');
  }

  /**
   * Handle bypass button click - temporarily disable blocking
   */
  private handleBypass(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.remove();
    }

    // Remove blur from main content
    const selectors = ['#content', 'ytd-app', '#page-manager', 'body'];
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        element.style.removeProperty('filter');
        element.style.removeProperty('pointer-events');
      }
    }

    // Set a temporary bypass flag in sessionStorage
    sessionStorage.setItem('shortshield-bypass-youtube', Date.now().toString());

    logger.info('Bypass activated for YouTube');
  }

  /**
   * Handle redirect from Shorts to regular video
   */
  private handleRedirect(): void {
    // Prevent multiple redirects
    if (isRedirecting) {
      return;
    }

    const pathname = window.location.pathname;
    const videoId = pathname.split('/shorts/')[1]?.split('?')[0];

    if (
      videoId !== undefined &&
      videoId !== '' &&
      isValidYouTubeVideoId(videoId)
    ) {
      isRedirecting = true;
      const newUrl = `https://www.youtube.com/watch?v=${videoId}`;
      logger.info('Redirecting shorts to regular video', { videoId });

      // Use replace to not add to history
      window.location.replace(newUrl);
    }
  }

  /**
   * Process a detected element
   */
  private processElement(element: HTMLElement): void {
    // Skip if already processed
    if (element.dataset.shortshieldHidden === 'true') {
      return;
    }

    // Find the appropriate parent to hide
    const target = this.findHideTarget(element);

    // Apply action
    this.applyAction(target, 'hide');

    // Log the block
    void this.logBlock(element, 'hide');

    logger.debug('Blocked YouTube Shorts element', {
      selector: element.tagName,
      className: element.className?.toString().slice(0, 50),
    });
  }

  /**
   * Find the appropriate parent element to hide
   */
  private findHideTarget(element: HTMLElement): HTMLElement {
    // For rich items, hide the whole item
    const richItem = element.closest<HTMLElement>('ytd-rich-item-renderer');
    if (richItem) {
      return richItem;
    }

    // For reel shelves, hide the whole shelf
    const reelShelf = element.closest<HTMLElement>('ytd-reel-shelf-renderer');
    if (reelShelf) {
      return reelShelf;
    }

    // For rich shelves, hide the whole shelf
    const richShelf = element.closest<HTMLElement>('ytd-rich-shelf-renderer');
    if (richShelf) {
      return richShelf;
    }

    // Default to the element itself
    return element;
  }

  /**
   * Scan for anchor links to Shorts
   */
  private scanShortsLinks(root: HTMLElement): void {
    const links = root.querySelectorAll<HTMLAnchorElement>(
      'a[href*="/shorts/"]'
    );

    for (const link of links) {
      // Find a suitable parent to hide
      const parent = this.findLinkParent(link);

      if (parent && parent.dataset.shortshieldHidden !== 'true') {
        this.applyAction(parent, 'hide');
        void this.logBlock(link, 'hide');
      }
    }
  }

  /**
   * Find appropriate parent for a shorts link
   */
  private findLinkParent(link: HTMLAnchorElement): HTMLElement | null {
    // Common parent containers
    const selectors = [
      'ytd-rich-item-renderer',
      'ytd-video-renderer',
      'ytd-grid-video-renderer',
      'ytd-compact-video-renderer',
    ];

    for (const selector of selectors) {
      const parent = link.closest<HTMLElement>(selector);
      if (parent) {
        return parent;
      }
    }

    // Last resort: go up a few levels
    let current: HTMLElement | null = link;
    for (let i = 0; i < 5 && current; i++) {
      current = current.parentElement;
      if (
        current !== null &&
        current.tagName.startsWith('YTD-') &&
        current.tagName.includes('RENDERER')
      ) {
        return current;
      }
    }

    return null;
  }

  /**
   * Extract video URL from element
   */
  protected override extractUrl(element: HTMLElement): string | null {
    // Try to find a video link
    const link = element.querySelector<HTMLAnchorElement>(
      'a[href*="/shorts/"], a[href*="/watch"]'
    );

    if (link !== null && link.href !== '') {
      return link.href;
    }

    // Check if element itself is a link
    if (element instanceof HTMLAnchorElement) {
      return element.href;
    }

    return super.extractUrl(element);
  }
}

/**
 * Content script integration tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getDetectorForHostname,
  getAllDetectors,
  YouTubeDetector,
  TikTokDetector,
  InstagramDetector,
} from '@/content/platforms';

// Mock the logger
vi.mock('@/shared/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock browser API
const mockSettings = {
  shortshield_settings: {
    enabled: true,
    platforms: { youtube: true, tiktok: true, instagram: true },
    whitelist: [],
    stats: {
      blockedToday: 0,
      blockedTotal: 0,
      lastResetDate: '2025-01-01',
      byPlatform: {},
    },
    preferences: {
      showStats: true,
      showNotifications: false,
      redirectShortsToRegular: false,
      logRetentionDays: 7,
    },
    version: 1,
  },
};

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
    },
    storage: {
      local: {
        get: vi.fn().mockImplementation(() => Promise.resolve(mockSettings)),
      },
    },
  },
}));

describe('Content Script Integration', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    // Mock location to avoid shouldBlockCurrentPage() returning true
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        pathname: '/search',
        href: 'https://example.com/search',
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    vi.clearAllMocks();
  });

  describe('Platform Detector Registry', () => {
    it('should have all detectors registered', () => {
      const detectors = getAllDetectors();
      // 3 full site blockers + 3 short video platforms + 9 SNS platforms
      expect(detectors.length).toBe(15);
    });

    it('should return YouTube detector for youtube.com', () => {
      const detector = getDetectorForHostname('www.youtube.com');
      expect(detector).toBeInstanceOf(YouTubeDetector);
    });

    it('should return TikTok detector for tiktok.com', () => {
      const detector = getDetectorForHostname('www.tiktok.com');
      expect(detector).toBeInstanceOf(TikTokDetector);
    });

    it('should return Instagram detector for instagram.com', () => {
      const detector = getDetectorForHostname('www.instagram.com');
      expect(detector).toBeInstanceOf(InstagramDetector);
    });

    it('should return null for unsupported domains', () => {
      const detector = getDetectorForHostname('example.com');
      expect(detector).toBeNull();
    });
  });

  describe('Cross-Platform Element Blocking', () => {
    it('should block YouTube Shorts elements', () => {
      document.body.innerHTML = `
        <ytd-reel-shelf-renderer>
          <a href="/shorts/abc123">Short</a>
        </ytd-reel-shelf-renderer>
      `;

      const detector = new YouTubeDetector();
      detector.scan(document.body);

      const element = document.querySelector('ytd-reel-shelf-renderer');
      expect(element?.getAttribute('data-shortshield-hidden')).toBe('true');
    });

    it('should block TikTok video elements', () => {
      document.body.innerHTML = `
        <div data-e2e="recommend-list-item-container">
          <video src="video.mp4"></video>
        </div>
      `;

      const detector = new TikTokDetector();
      detector.scan(document.body);

      const element = document.querySelector(
        '[data-e2e="recommend-list-item-container"]'
      );
      expect(element?.getAttribute('data-shortshield-hidden')).toBe('true');
    });

    it('should block Instagram Reels elements', () => {
      document.body.innerHTML = `
        <article>
          <a href="/reel/xyz123">Reel</a>
        </article>
      `;

      const detector = new InstagramDetector();
      detector.scan(document.body);

      const element = document.querySelector('article');
      expect(element?.getAttribute('data-shortshield-hidden')).toBe('true');
    });
  });

  describe('Multiple Element Blocking', () => {
    it('should block multiple elements in one scan', () => {
      document.body.innerHTML = `
        <div>
          <ytd-reel-shelf-renderer id="shelf1">Content 1</ytd-reel-shelf-renderer>
          <ytd-reel-video-renderer id="item1">Content 2</ytd-reel-video-renderer>
          <ytd-rich-item-renderer is-shorts id="item2">
            <a href="/shorts/123" id="link1">Short Link</a>
          </ytd-rich-item-renderer>
        </div>
      `;

      const detector = new YouTubeDetector();
      detector.scan(document.body);

      expect(
        document
          .querySelector('#shelf1')
          ?.getAttribute('data-shortshield-hidden')
      ).toBe('true');
      expect(
        document
          .querySelector('#item1')
          ?.getAttribute('data-shortshield-hidden')
      ).toBe('true');
      expect(
        document
          .querySelector('#item2')
          ?.getAttribute('data-shortshield-hidden')
      ).toBe('true');
    });
  });

  describe('Re-scanning Protection', () => {
    it('should not re-process already hidden elements', () => {
      document.body.innerHTML = `
        <ytd-reel-shelf-renderer data-shortshield-hidden="true">
          Content
        </ytd-reel-shelf-renderer>
      `;

      const detector = new YouTubeDetector();

      // First scan
      detector.scan(document.body);

      // Second scan should not throw or cause issues
      expect(() => detector.scan(document.body)).not.toThrow();

      // Element should still be hidden
      const element = document.querySelector('ytd-reel-shelf-renderer');
      expect(element?.getAttribute('data-shortshield-hidden')).toBe('true');
    });
  });

  describe('Partial DOM Scanning', () => {
    it('should only scan within the provided root element', () => {
      document.body.innerHTML = `
        <div id="container1">
          <ytd-reel-shelf-renderer id="shelf1">Content 1</ytd-reel-shelf-renderer>
        </div>
        <div id="container2">
          <ytd-reel-shelf-renderer id="shelf2">Content 2</ytd-reel-shelf-renderer>
        </div>
      `;

      const detector = new YouTubeDetector();
      const container1 = document.getElementById('container1') as HTMLElement;
      detector.scan(container1);

      // Only shelf1 should be hidden
      expect(
        document
          .querySelector('#shelf1')
          ?.getAttribute('data-shortshield-hidden')
      ).toBe('true');
      // shelf2 should NOT be hidden
      expect(
        document
          .querySelector('#shelf2')
          ?.getAttribute('data-shortshield-hidden')
      ).toBeNull();
    });
  });

  describe('Platform State Consistency', () => {
    it('should maintain platform identity across scans', () => {
      const youtubeDetector = new YouTubeDetector();
      const tiktokDetector = new TikTokDetector();
      const instagramDetector = new InstagramDetector();

      expect(youtubeDetector.platform).toBe('youtube');
      expect(tiktokDetector.platform).toBe('tiktok');
      expect(instagramDetector.platform).toBe('instagram');

      // Platform should not change after scanning
      youtubeDetector.scan(document.body);
      tiktokDetector.scan(document.body);
      instagramDetector.scan(document.body);

      expect(youtubeDetector.platform).toBe('youtube');
      expect(tiktokDetector.platform).toBe('tiktok');
      expect(instagramDetector.platform).toBe('instagram');
    });
  });
});

/**
 * URL parsing and validation utilities
 * Security: All URL operations validate protocol and format
 */

import { LIMITS } from '@/shared/constants';

/**
 * Valid URL protocols for this extension
 */
const VALID_PROTOCOLS = ['http:', 'https:'] as const;

/**
 * Check if URL is valid and uses allowed protocol
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check length limit
  if (url.length > LIMITS.MAX_URL_LENGTH) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return VALID_PROTOCOLS.includes(
      parsed.protocol as (typeof VALID_PROTOCOLS)[number]
    );
  } catch {
    return false;
  }
}

/**
 * Parse URL safely, returning null if invalid
 */
export function parseUrl(url: string): URL | null {
  if (!isValidUrl(url)) {
    return null;
  }

  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * Extract hostname from URL
 */
export function getHostname(url: string): string | null {
  const parsed = parseUrl(url);
  return parsed?.hostname ?? null;
}

/**
 * Extract pathname from URL
 */
export function getPathname(url: string): string | null {
  const parsed = parseUrl(url);
  return parsed?.pathname ?? null;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed) {
    return null;
  }

  const hostname = parsed.hostname;
  if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
    return null;
  }

  // Handle youtu.be short URLs
  if (hostname.includes('youtu.be')) {
    const id = parsed.pathname.slice(1);
    return isValidYouTubeVideoId(id) ? id : null;
  }

  // Handle /shorts/ URLs
  if (parsed.pathname.startsWith('/shorts/')) {
    const id = parsed.pathname.split('/shorts/')[1]?.split('?')[0] ?? '';
    return isValidYouTubeVideoId(id) ? id : null;
  }

  // Handle /watch?v= URLs
  const videoId = parsed.searchParams.get('v');
  return videoId !== null && videoId !== '' && isValidYouTubeVideoId(videoId)
    ? videoId
    : null;
}

/**
 * Check if string is valid YouTube video ID format
 * YouTube IDs are 11 characters, alphanumeric with - and _
 */
export function isValidYouTubeVideoId(id: string): boolean {
  return /^[\w-]{11}$/.test(id);
}

/**
 * Check if string is valid YouTube channel ID format
 */
export function isValidYouTubeChannelId(id: string): boolean {
  // UC prefix + 22 characters or @handle format
  return /^UC[\w-]{22}$/.test(id) || /^@[\w.-]{1,30}$/.test(id);
}

/**
 * Convert YouTube Shorts URL to regular watch URL
 */
export function shortsToWatchUrl(shortsUrl: string): string | null {
  const videoId = extractYouTubeVideoId(shortsUrl);
  if (videoId === null || videoId === '') {
    return null;
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Check if URL matches a RegExp pattern
 */
export function matchesUrlPattern(url: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern);
    const pathname = getPathname(url);
    return pathname !== null && pathname !== '' ? regex.test(pathname) : false;
  } catch {
    // Invalid regex pattern
    return false;
  }
}

/**
 * Normalize URL for comparison (remove trailing slashes, lowercase host)
 */
export function normalizeUrl(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed) {
    return null;
  }

  // Remove trailing slash from pathname
  let pathname = parsed.pathname;
  if (pathname.endsWith('/') && pathname.length > 1) {
    pathname = pathname.slice(0, -1);
  }

  return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}${parsed.search}`;
}

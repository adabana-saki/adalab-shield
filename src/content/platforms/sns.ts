/**
 * Generic SNS detector
 * Blocks entire sites for SNS platforms
 */

import { BasePlatformDetector } from './base';
import type { Platform, SNSPlatform } from '@/shared/types';
import {
  TWITTER_CONFIG,
  FACEBOOK_CONFIG,
  LINKEDIN_CONFIG,
  THREADS_CONFIG,
  SNAPCHAT_CONFIG,
  REDDIT_CONFIG,
  DISCORD_CONFIG,
  PINTEREST_CONFIG,
  TWITCH_CONFIG,
  DEFAULT_BLOCK_PAGE,
} from '@/shared/constants';
import { createLogger } from '@/shared/utils/logger';
import { showBlockPage } from '../blockPage';

const logger = createLogger('sns');

/**
 * Configuration for SNS platforms
 */
const SNS_CONFIGS: Record<SNSPlatform, { hosts: readonly string[] }> = {
  twitter: TWITTER_CONFIG,
  facebook: FACEBOOK_CONFIG,
  linkedin: LINKEDIN_CONFIG,
  threads: THREADS_CONFIG,
  snapchat: SNAPCHAT_CONFIG,
  reddit: REDDIT_CONFIG,
  discord: DISCORD_CONFIG,
  pinterest: PINTEREST_CONFIG,
  twitch: TWITCH_CONFIG,
};

/**
 * Generic SNS platform detector - blocks entire site
 */
export class SNSDetector extends BasePlatformDetector {
  readonly platform: Platform;
  private readonly snsPlatform: SNSPlatform;
  private readonly hosts: readonly string[];
  private hasBlocked = false;

  constructor(snsPlatform: SNSPlatform) {
    super();
    this.snsPlatform = snsPlatform;
    this.platform = snsPlatform;

    this.hosts = SNS_CONFIGS[snsPlatform].hosts;
  }

  /**
   * Check if this detector supports the given hostname
   */
  isSupported(hostname: string): boolean {
    return this.hosts.includes(hostname);
  }

  /**
   * Scan DOM - for SNS, we block the entire page
   */
  scan(_root: HTMLElement): void {
    if (!this.isEnabled()) {
      return;
    }

    this.blockEntirePage();
  }

  /**
   * Block the entire page content
   */
  private blockEntirePage(): void {
    // Only log the block once per page load
    if (this.hasBlocked) {
      return;
    }

    logger.info('Blocking SNS page', {
      platform: this.platform,
      hostname: window.location.hostname,
    });

    const platformName = this.getPlatformDisplayName();
    const blockPageSettings = this.settings?.blockPage ?? DEFAULT_BLOCK_PAGE;

    showBlockPage(blockPageSettings, platformName, 'shortshield-sns-overlay');

    // Log the block only once
    this.hasBlocked = true;
    void this.logBlock(document.body, 'hide');
  }

  /**
   * Get display name for the platform
   */
  private getPlatformDisplayName(): string {
    const names: Record<SNSPlatform, string> = {
      twitter: 'Twitter/X',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      threads: 'Threads',
      snapchat: 'Snapchat',
      reddit: 'Reddit',
      discord: 'Discord',
      pinterest: 'Pinterest',
      twitch: 'Twitch',
    };
    return names[this.snsPlatform];
  }
}

/**
 * Create all SNS detectors
 */
export function createSNSDetectors(): SNSDetector[] {
  return [
    new SNSDetector('twitter'),
    new SNSDetector('facebook'),
    new SNSDetector('linkedin'),
    new SNSDetector('threads'),
    new SNSDetector('snapchat'),
    new SNSDetector('reddit'),
    new SNSDetector('discord'),
    new SNSDetector('pinterest'),
    new SNSDetector('twitch'),
  ];
}

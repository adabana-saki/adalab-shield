/**
 * Base platform detector abstract class
 * Defines the interface for platform-specific detection
 */

import browser from 'webextension-polyfill';
import type {
  Platform,
  Settings,
  BlockingAction,
  LogBlockMessage,
  BlockPageSettings,
  PomodoroState,
  FocusModeState,
} from '@/shared/types';
import { createMessage } from '@/shared/types';
import { createLogger } from '@/shared/utils/logger';
import { isScheduleActive } from '@/shared/utils/schedule';
import { DEFAULT_BLOCK_PAGE } from '@/shared/constants';

const logger = createLogger('detector');

/**
 * Element info for logging
 */
export interface DetectedElement {
  readonly element: HTMLElement;
  readonly selector?: string;
  readonly action: BlockingAction;
}

/**
 * Abstract base class for platform detectors
 */
export abstract class BasePlatformDetector {
  /** Platform identifier */
  abstract readonly platform: Platform;

  /** Current settings */
  protected settings: Settings | null = null;

  /** Current Pomodoro state */
  protected pomodoroState: PomodoroState | null = null;

  /** Current Focus Mode state */
  protected focusState: FocusModeState | null = null;

  /**
   * Check if this detector supports the given hostname
   */
  abstract isSupported(hostname: string): boolean;

  /**
   * Scan a DOM element for short-form content
   */
  abstract scan(root: HTMLElement): void;

  /**
   * Update settings
   */
  setSettings(settings: Settings): void {
    this.settings = settings;
  }

  /**
   * Update Pomodoro state
   */
  setPomodoroState(state: PomodoroState | null): void {
    this.pomodoroState = state;
  }

  /**
   * Update Focus Mode state
   */
  setFocusState(state: FocusModeState | null): void {
    this.focusState = state;
  }

  /**
   * Check if currently in a Pomodoro break (content should be unblocked).
   * A paused break still counts as a break — pausing must not re-block.
   */
  protected isInPomodoroBreak(): boolean {
    if (this.pomodoroState === null) {
      return false;
    }

    return (
      this.pomodoroState.mode === 'break' ||
      this.pomodoroState.mode === 'longBreak'
    );
  }

  /**
   * Check if a Focus Mode session is currently active.
   * During focus, blocking applies even outside scheduled hours.
   */
  protected isFocusActive(): boolean {
    return (
      this.focusState !== null &&
      this.focusState.isActive &&
      this.focusState.endTime !== null &&
      this.focusState.endTime > Date.now()
    );
  }

  /**
   * Check if the platform is enabled in settings
   */
  isEnabled(): boolean {
    if (this.settings === null) {
      return true; // Default to enabled if settings not loaded
    }

    // Check if in Pomodoro break - unblock during breaks
    if (this.isInPomodoroBreak()) {
      logger.debug('Pomodoro break active, unblocking', {
        platform: this.platform,
        pomodoroMode: this.pomodoroState?.mode,
      });
      return false;
    }

    // Check global enabled and platform-specific enabled
    const platformEnabled =
      this.settings.enabled && this.settings.platforms[this.platform];

    if (!platformEnabled) {
      logger.debug('Platform disabled', {
        platform: this.platform,
        globalEnabled: this.settings.enabled,
        platformEnabled: this.settings.platforms[this.platform],
      });
      return false;
    }

    // Focus Mode overrides the schedule: while a focus session runs,
    // blocking is always on (that is what "focus" means)
    if (this.isFocusActive()) {
      return true;
    }

    // Check schedule - if schedule is enabled, only block during scheduled times
    const scheduleActive = isScheduleActive(this.settings.schedule);

    logger.debug('Checking if enabled', {
      platform: this.platform,
      scheduleEnabled: this.settings.schedule.enabled,
      scheduleActive,
    });

    return scheduleActive;
  }

  /**
   * Extract URL from element (override in subclass)
   */
  protected extractUrl(element: HTMLElement): string | null {
    // Try to find a link in or around the element
    const link =
      element.querySelector<HTMLAnchorElement>('a[href]') ??
      element.closest<HTMLAnchorElement>('a[href]');
    return link?.href ?? null;
  }

  /**
   * Hide an element
   */
  protected hideElement(element: HTMLElement): void {
    // Use display:none with !important
    element.style.setProperty('display', 'none', 'important');
    element.dataset.shortshieldHidden = 'true';
  }

  /**
   * Remove an element from DOM
   */
  protected removeElement(element: HTMLElement): void {
    element.remove();
  }

  /**
   * Blur an element
   */
  protected blurElement(element: HTMLElement): void {
    element.style.setProperty('filter', 'blur(10px)', 'important');
    element.style.setProperty('pointer-events', 'none', 'important');
    element.dataset.shortshieldBlurred = 'true';
  }

  /**
   * Apply the specified action to an element
   */
  protected applyAction(element: HTMLElement, action: BlockingAction): void {
    // Skip if already processed
    if (
      element.dataset.shortshieldHidden === 'true' ||
      element.dataset.shortshieldBlurred === 'true'
    ) {
      return;
    }

    switch (action) {
      case 'hide':
        this.hideElement(element);
        break;
      case 'remove':
        this.removeElement(element);
        break;
      case 'blur':
        this.blurElement(element);
        break;
      case 'redirect':
        // Redirect is handled at URL level, not element level
        break;
    }
  }

  /**
   * Log a blocked element
   */
  protected async logBlock(
    element: HTMLElement,
    action: BlockingAction = 'hide'
  ): Promise<void> {
    const url = this.extractUrl(element) ?? window.location.href;

    try {
      await browser.runtime.sendMessage(
        createMessage<LogBlockMessage>({
          type: 'LOG_BLOCK',
          payload: {
            platform: this.platform,
            url,
            action,
            elementInfo: {
              tagName: element.tagName.toLowerCase(),
              className: element.className?.toString().slice(0, 100),
            },
          },
        })
      );
    } catch (error) {
      logger.warn('Failed to log block', { error: String(error) });
    }
  }

  /**
   * Default motivational quotes
   */
  private static readonly DEFAULT_QUOTES = [
    'Focus on what matters most.',
    'Every moment of focus is a step toward your goals.',
    'Your future self will thank you for staying focused.',
    'The key to success is focusing on goals, not obstacles.',
    'Small daily improvements lead to stunning results.',
  ] as const;

  /**
   * Get a random motivational quote
   */
  protected getRandomQuote(): string {
    const blockPage = this.settings?.blockPage ?? DEFAULT_BLOCK_PAGE;
    const quotes =
      blockPage.customQuotes.length > 0
        ? blockPage.customQuotes
        : BasePlatformDetector.DEFAULT_QUOTES;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex] ?? BasePlatformDetector.DEFAULT_QUOTES[0];
  }

  /**
   * Determine if dark mode should be used
   */
  protected isDarkMode(): boolean {
    const blockPage = this.settings?.blockPage ?? DEFAULT_BLOCK_PAGE;

    if (blockPage.theme === 'dark') {
      return true;
    }
    if (blockPage.theme === 'light') {
      return false;
    }
    // System theme - check prefers-color-scheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Create a customizable block overlay
   */
  protected createBlockOverlay(options: {
    id: string;
    title: string;
    message: string;
    platformName: string;
    primaryButtonText: string;
    onPrimaryClick: () => void;
    showBypassOverride?: boolean;
    onBypassClick?: () => void;
  }): HTMLElement {
    const blockPage: BlockPageSettings =
      this.settings?.blockPage ?? DEFAULT_BLOCK_PAGE;

    const isDark = this.isDarkMode();
    const bgColor = isDark
      ? 'rgba(0, 0, 0, 0.95)'
      : 'rgba(255, 255, 255, 0.98)';
    const textColor = isDark ? '#ffffff' : '#1f2937';
    const mutedColor = isDark ? '#9ca3af' : '#6b7280';
    const primaryColor = blockPage.primaryColor || '#3b82f6';

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = options.id;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${bgColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Custom title/message or defaults
    const displayTitle = blockPage.title || options.title;
    const displayMessage = blockPage.message || options.message;

    // Check if bypass button should be shown
    const showBypass =
      options.showBypassOverride !== undefined
        ? options.showBypassOverride
        : blockPage.showBypassButton;

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText =
      'text-align: center; max-width: 400px; padding: 40px;';

    // Create icon
    const iconDiv = document.createElement('div');
    iconDiv.style.cssText = 'font-size: 64px; margin-bottom: 20px;';
    iconDiv.textContent = '🛡️';
    contentDiv.appendChild(iconDiv);

    // Create title
    const title = document.createElement('h1');
    title.style.cssText = `font-size: 28px; margin: 0 0 16px 0; font-weight: 600; color: ${textColor};`;
    title.textContent = displayTitle;
    contentDiv.appendChild(title);

    // Create message
    const messagePara = document.createElement('p');
    messagePara.style.cssText = `font-size: 16px; color: ${mutedColor}; margin: 0 0 20px 0; line-height: 1.5;`;
    messagePara.textContent = displayMessage;
    contentDiv.appendChild(messagePara);

    // Add motivational quote if enabled
    if (blockPage.showMotivationalQuote) {
      const quote = this.getRandomQuote();
      const quotePara = document.createElement('p');
      quotePara.style.cssText = `font-size: 14px; color: ${mutedColor}; font-style: italic; margin: 0 0 24px 0; max-width: 350px;`;
      quotePara.textContent = `"${quote}"`;
      contentDiv.appendChild(quotePara);
    }

    // Create primary button
    const primaryButton = document.createElement('button');
    primaryButton.id = `${options.id}-primary`;
    primaryButton.style.cssText = `background: ${primaryColor}; color: white; border: none; padding: 12px 32px; font-size: 16px; font-weight: 500; border-radius: 24px; cursor: pointer; transition: filter 0.2s;`;
    primaryButton.textContent = options.primaryButtonText;
    contentDiv.appendChild(primaryButton);

    // Add bypass button if enabled
    if (showBypass && options.onBypassClick) {
      const bypassButton = document.createElement('button');
      bypassButton.id = `${options.id}-bypass`;
      bypassButton.style.cssText = `background: transparent; color: ${mutedColor}; border: 1px solid ${mutedColor}; padding: 8px 20px; font-size: 14px; font-weight: 400; border-radius: 20px; cursor: pointer; transition: all 0.2s; margin-top: 12px;`;
      bypassButton.textContent = 'Bypass for 5 minutes';
      contentDiv.appendChild(bypassButton);
    }

    overlay.appendChild(contentDiv);

    // Add event listeners after appending to DOM
    setTimeout(() => {
      const primaryButton = document.getElementById(`${options.id}-primary`);
      if (primaryButton) {
        primaryButton.addEventListener('click', options.onPrimaryClick);
        primaryButton.addEventListener('mouseover', () => {
          primaryButton.style.filter = 'brightness(0.9)';
        });
        primaryButton.addEventListener('mouseout', () => {
          primaryButton.style.filter = 'brightness(1)';
        });
      }

      if (showBypass && options.onBypassClick) {
        const bypassButton = document.getElementById(`${options.id}-bypass`);
        if (bypassButton) {
          bypassButton.addEventListener('click', options.onBypassClick);
          bypassButton.addEventListener('mouseover', () => {
            bypassButton.style.borderColor = primaryColor;
            bypassButton.style.color = primaryColor;
          });
          bypassButton.addEventListener('mouseout', () => {
            bypassButton.style.borderColor = mutedColor;
            bypassButton.style.color = mutedColor;
          });
        }
      }
    }, 0);

    return overlay;
  }

  /**
   * Blur the main content of a page
   */
  protected blurMainContent(selectors: string[]): void {
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        element.style.setProperty('filter', 'blur(20px)', 'important');
        element.style.setProperty('pointer-events', 'none', 'important');
      }
    }
  }
}

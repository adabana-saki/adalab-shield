/**
 * Content Script entry point
 * Initializes platform detection and DOM observation
 */

import browser from 'webextension-polyfill';
import {
  getDetectorForHostname,
  setCustomDomains,
  getCustomDomainDetector,
  getAllDetectors,
} from './platforms';
import { createManagedObserver } from './observer';
import { initAdalabBridge } from './adalabBridge';
import { createLogger } from '@/shared/utils/logger';
import { createMessage } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants';
import type { Settings, PomodoroState } from '@/shared/types';

const logger = createLogger('content');

/**
 * Check if extension context is valid
 */
function isExtensionContextValid(): boolean {
  try {
    return (
      typeof browser !== 'undefined' &&
      typeof browser.runtime !== 'undefined' &&
      typeof browser.runtime.id !== 'undefined'
    );
  } catch {
    return false;
  }
}

/**
 * Get settings from background script
 */
async function getSettingsSafely(): Promise<Settings | null> {
  try {
    const response = await browser.runtime.sendMessage(
      createMessage({ type: 'GET_SETTINGS' })
    );

    if (
      response !== null &&
      response !== undefined &&
      typeof response === 'object' &&
      'success' in response
    ) {
      const typedResponse = response as { success: boolean; data?: Settings };
      if (typedResponse.success && typedResponse.data) {
        return typedResponse.data;
      }
    }

    return null;
  } catch (error) {
    logger.warn('Failed to get settings', { error: String(error) });
    return null;
  }
}

/**
 * Get Pomodoro state from storage
 */
async function getPomodoroStateSafely(): Promise<PomodoroState | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.POMODORO_STATE);
    const state = result[STORAGE_KEYS.POMODORO_STATE] as
      | PomodoroState
      | undefined;
    return state ?? null;
  } catch (error) {
    logger.warn('Failed to get Pomodoro state', { error: String(error) });
    return null;
  }
}

/**
 * Update Pomodoro state on all detectors
 */
function updatePomodoroStateOnDetectors(state: PomodoroState | null): void {
  const allDetectors = getAllDetectors();
  for (const detector of allDetectors) {
    detector.setPomodoroState(state);
  }
  // Also update custom domain detector
  const customDetector = getCustomDomainDetector();
  customDetector.setPomodoroState(state);
}

/**
 * Initialize the content script
 */
async function initialize(): Promise<void> {
  // Check if extension context is valid
  if (!isExtensionContextValid()) {
    logger.error('Invalid extension context');
    return;
  }

  const hostname = window.location.hostname;
  logger.debug('Initializing content script', { hostname });

  // adalab study integration (only active on the adalab study app)
  initAdalabBridge();

  // Get settings first (needed for custom domains)
  const settings = await getSettingsSafely();

  if (settings !== null) {
    // Update custom domains from settings
    setCustomDomains(settings.customDomains);

    // Also set settings on custom domain detector
    const customDetector = getCustomDomainDetector();
    customDetector.setSettings(settings);
  }

  // Get Pomodoro state and update all detectors
  const pomodoroState = await getPomodoroStateSafely();
  updatePomodoroStateOnDetectors(pomodoroState);

  // Get detector for this hostname (now includes custom domain check)
  const detector = getDetectorForHostname(hostname);

  if (!detector) {
    logger.debug('No detector for this hostname');
    return;
  }

  // Apply settings to the detector
  if (!settings) {
    logger.warn('Could not load settings, using defaults');
  } else {
    detector.setSettings(settings);
  }

  // Check if blocking is enabled
  if (!detector.isEnabled()) {
    logger.debug('Blocking disabled for this platform');
    return;
  }

  logger.info('Starting content detection', { platform: detector.platform });

  // Create observer
  const observer = createManagedObserver(detector);

  // Initial scan of existing content
  detector.scan(document.body);

  // Start observing for new content
  observer.observe(document.body);

  // Listen for settings and Pomodoro state changes
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    // Handle settings changes
    const settingsChange = changes[STORAGE_KEYS.SETTINGS];
    if (settingsChange !== undefined) {
      const newSettings = settingsChange.newValue as Settings | undefined;
      if (newSettings !== undefined) {
        detector.setSettings(newSettings);

        // Update custom domains
        setCustomDomains(newSettings.customDomains);
        const customDetector = getCustomDomainDetector();
        customDetector.setSettings(newSettings);

        logger.debug('Settings updated');

        // Re-scan if still enabled
        if (detector.isEnabled()) {
          detector.scan(document.body);
        }
      }
    }

    // Handle Pomodoro state changes
    const pomodoroChange = changes[STORAGE_KEYS.POMODORO_STATE];
    if (pomodoroChange !== undefined) {
      const newPomodoroState = pomodoroChange.newValue as
        | PomodoroState
        | undefined;
      updatePomodoroStateOnDetectors(newPomodoroState ?? null);

      logger.debug('Pomodoro state updated', {
        mode: newPomodoroState?.mode,
        isRunning: newPomodoroState?.isRunning,
      });

      // If entering break, could remove block overlays
      // If exiting break, re-scan to apply blocks
      if (newPomodoroState?.isRunning === true) {
        if (
          newPomodoroState.mode === 'break' ||
          newPomodoroState.mode === 'longBreak'
        ) {
          // In break - blocks should be removed (page reload recommended)
          logger.info('Pomodoro break started - blocking disabled');
        } else if (newPomodoroState.mode === 'work') {
          // Work session - re-scan to apply blocks
          if (detector.isEnabled()) {
            detector.scan(document.body);
          }
        }
      }
    }
  });

  // Cleanup on page hide (unload is blocked by some sites' Permissions Policy)
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    logger.debug('Content script unloaded');
  });

  // Handle visibility changes (for SPAs)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && detector.isEnabled()) {
      detector.scan(document.body);
    }
  });

  // Handle SPA navigation (for YouTube's client-side routing)
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      logger.debug('URL changed, rescanning');

      if (detector.isEnabled()) {
        // Small delay for DOM to update
        setTimeout(() => {
          detector.scan(document.body);
        }, 100);
      }
    }
  });

  urlObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  logger.info('Content script initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initialize();
  });
} else {
  void initialize();
}

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
import { CustomRulesEngine } from './customRules';
import { createLogger } from '@/shared/utils/logger';
import { isAllowlisted } from '@/shared/utils/allowlist';
import { isScheduleActive } from '@/shared/utils/schedule';
import { createMessage } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants';
import type { Settings, PomodoroState, FocusModeState } from '@/shared/types';
import type { BasePlatformDetector } from './platforms/base';

const logger = createLogger('content');

/**
 * Hosts the user always allows. Mirrored from settings so the detector gate
 * can consult it synchronously on every re-evaluation.
 */
let allowlist: readonly string[] = [];

/**
 * User-defined custom element-hiding rules engine. Its active state tracks the
 * same "is blocking on right now" condition as the platform detectors.
 */
const customRulesEngine = new CustomRulesEngine();
let latestSettings: Settings | null = null;
let latestPomodoro: PomodoroState | null = null;
let latestFocus: FocusModeState | null = null;

/**
 * Whether blocking is currently in force (global enable + not on a break +
 * focus session or active schedule). Mirrors BasePlatformDetector.isEnabled
 * without the per-platform check.
 */
function isBlockingActiveNow(): boolean {
  const settings = latestSettings;
  if (settings === null || !settings.enabled) {
    return false;
  }
  const mode = latestPomodoro?.mode;
  if (mode === 'break' || mode === 'longBreak') {
    return false;
  }
  const focusActive =
    latestFocus !== null &&
    latestFocus.isActive &&
    latestFocus.endTime !== null &&
    latestFocus.endTime > Date.now();
  return focusActive || isScheduleActive(settings.schedule);
}

function syncCustomRulesActive(): void {
  customRulesEngine.setActive(isBlockingActiveNow());
}

/**
 * Block overlay element ids used by full-site and custom-domain blocking
 */
const BLOCK_OVERLAY_IDS = [
  'shortshield-fullsite-overlay',
  'shortshield-custom-overlay',
] as const;

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
 * Get Focus Mode state from storage
 */
async function getFocusStateSafely(): Promise<FocusModeState | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.FOCUS_STATE);
    const state = result[STORAGE_KEYS.FOCUS_STATE] as
      | FocusModeState
      | undefined;
    return state ?? null;
  } catch (error) {
    logger.warn('Failed to get Focus state', { error: String(error) });
    return null;
  }
}

/**
 * Apply settings to every detector
 */
function applySettingsToAll(settings: Settings): void {
  allowlist = settings.allowlist ?? [];
  latestSettings = settings;
  const customDetector = getCustomDomainDetector();
  setCustomDomains(settings.customDomains);
  customDetector.setSettings(settings);
  for (const d of getAllDetectors()) {
    d.setSettings(settings);
  }
  syncCustomRulesActive();
}

/**
 * Apply Pomodoro state to every detector
 */
function applyPomodoroToAll(pomodoroState: PomodoroState | null): void {
  latestPomodoro = pomodoroState;
  getCustomDomainDetector().setPomodoroState(pomodoroState);
  for (const d of getAllDetectors()) {
    d.setPomodoroState(pomodoroState);
  }
  syncCustomRulesActive();
}

/**
 * Apply Focus Mode state to every detector
 */
function applyFocusToAll(focusState: FocusModeState | null): void {
  latestFocus = focusState;
  getCustomDomainDetector().setFocusState(focusState);
  for (const d of getAllDetectors()) {
    d.setFocusState(focusState);
  }
  syncCustomRulesActive();
}

/**
 * Remove full-page block overlays and restore page visibility
 * (used when a Pomodoro break starts or blocking gets disabled)
 */
function removeBlockOverlays(): void {
  let removed = false;
  for (const id of BLOCK_OVERLAY_IDS) {
    const el = document.getElementById(id);
    if (el) {
      el.remove();
      removed = true;
    }
  }
  if (removed) {
    document.body.style.removeProperty('visibility');
    document.body.style.removeProperty('overflow');
    logger.info('Block overlay removed');
  }
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

  // Get settings and Pomodoro state, apply to all detectors BEFORE selection:
  // getDetectorForHostname skips disabled detectors, and FullSiteBlocker
  // reports disabled until it has settings
  const settings = await getSettingsSafely();
  if (settings) {
    applySettingsToAll(settings);
  } else {
    logger.warn('Could not load settings, using defaults');
  }
  applyPomodoroToAll(await getPomodoroStateSafely());
  applyFocusToAll(await getFocusStateSafely());

  // Custom element-hiding rules run alongside the platform detectors.
  await customRulesEngine.init(hostname);
  syncCustomRulesActive();

  // Active detector management (re-evaluated when settings change)
  let activeDetector: BasePlatformDetector | null = null;
  let activeObserver: ReturnType<typeof createManagedObserver> | null = null;

  const deactivate = (): void => {
    if (activeObserver) {
      activeObserver.disconnect();
      activeObserver = null;
    }
    activeDetector = null;
  };

  const evaluateDetector = (): void => {
    // Allowlisted hosts are exempt from all blocking: tear down any active
    // detection and lift overlays the page may have shown before being added.
    if (isAllowlisted(hostname, allowlist)) {
      deactivate();
      removeBlockOverlays();
      return;
    }

    const next = getDetectorForHostname(hostname);

    if (next === activeDetector) {
      // Same detector: just re-scan if still enabled
      if (next?.isEnabled()) {
        next.scan(document.body);
      }
      return;
    }

    deactivate();

    if (next && next.isEnabled()) {
      activeDetector = next;
      activeObserver = createManagedObserver(next);
      next.scan(document.body);
      activeObserver.observe(document.body);
      logger.info('Content detection active', { platform: next.platform });
    }
  };

  evaluateDetector();

  // Listen for settings and Pomodoro state changes
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    // Handle settings changes: re-apply to all detectors and re-select,
    // so toggling a platform takes effect without a page reload
    const settingsChange = changes[STORAGE_KEYS.SETTINGS];
    if (settingsChange !== undefined) {
      const newSettings = settingsChange.newValue as Settings | undefined;
      if (newSettings !== undefined) {
        applySettingsToAll(newSettings);
        logger.debug('Settings updated');
        evaluateDetector();
        // If blocking became disabled for this page, lift any overlay
        if (activeDetector === null || !activeDetector.isEnabled()) {
          removeBlockOverlays();
        }
      }
    }

    // Handle Pomodoro state changes
    const pomodoroChange = changes[STORAGE_KEYS.POMODORO_STATE];
    if (pomodoroChange !== undefined) {
      const newPomodoroState = pomodoroChange.newValue as
        | PomodoroState
        | undefined;
      applyPomodoroToAll(newPomodoroState ?? null);

      logger.debug('Pomodoro state updated', {
        mode: newPomodoroState?.mode,
        isRunning: newPomodoroState?.isRunning,
      });

      if (
        newPomodoroState?.mode === 'break' ||
        newPomodoroState?.mode === 'longBreak'
      ) {
        // Break (running or paused): lift full-page blocks immediately
        removeBlockOverlays();
      } else {
        // Work started or timer stopped: re-apply blocks
        evaluateDetector();
      }
    }

    // Handle Focus Mode state changes (focus forces blocking on)
    const focusChange = changes[STORAGE_KEYS.FOCUS_STATE];
    if (focusChange !== undefined) {
      const newFocusState = focusChange.newValue as FocusModeState | undefined;
      applyFocusToAll(newFocusState ?? null);

      logger.debug('Focus state updated', {
        isActive: newFocusState?.isActive,
      });

      evaluateDetector();
      // Focus ended outside scheduled hours: lift any remaining overlay
      if (activeDetector === null || !activeDetector.isEnabled()) {
        removeBlockOverlays();
      }
    }
  });

  // Cleanup on page hide (unload is blocked by some sites' Permissions Policy)
  window.addEventListener('pagehide', () => {
    deactivate();
    logger.debug('Content script unloaded');
  });

  // Handle visibility changes (for SPAs)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && activeDetector?.isEnabled()) {
      activeDetector.scan(document.body);
    }
  });

  // Handle SPA navigation (for YouTube's client-side routing)
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      logger.debug('URL changed, rescanning');

      if (activeDetector?.isEnabled()) {
        // Small delay for DOM to update
        setTimeout(() => {
          activeDetector?.scan(document.body);
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

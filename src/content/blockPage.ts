/**
 * Block page generator with customization support
 * Includes Commitment Lock integration for friction-based unlocking
 */

import browser from 'webextension-polyfill';
import type {
  BlockPageSettings,
  CommitmentLockSettings,
  PomodoroState,
} from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants';

/**
 * i18n helper with English fallback
 */
function t(key: string, fallback: string): string {
  try {
    const m = browser.i18n.getMessage(key);
    return m !== '' ? m : fallback;
  } catch {
    return fallback;
  }
}

interface AdalabMetaLike {
  readonly external?: boolean;
  readonly taskTitle?: string | null;
}

// Response types for message passing
interface CheckUnlockResponse {
  success: boolean;
  data?: { allowed: boolean; reason?: string; message?: string };
}

interface SettingsWithLockResponse {
  success: boolean;
  data?: { commitmentLock: CommitmentLockSettings };
}

interface StartUnlockResponse {
  success: boolean;
  data?: { waitSecondsRemaining: number };
  error?: string;
}

interface SubmitIntentionResponse {
  success: boolean;
  error?: string;
}

interface ChallengeResponseData {
  question: string;
  type: string;
  difficulty: string;
}

interface RequestChallengeResponse {
  success: boolean;
  data?: ChallengeResponseData;
  error?: string;
}

interface SubmitChallengeResponseData {
  correct: boolean;
  challengesRemaining: number;
  allCompleted: boolean;
}

interface SubmitChallengeResponse {
  success: boolean;
  data?: SubmitChallengeResponseData;
  error?: string;
}

interface ConfirmUnlockResponse {
  success: boolean;
  error?: string;
}

/**
 * Default motivational quotes
 */
const DEFAULT_QUOTES = [
  'Focus on what matters most.',
  'Every moment of focus is a step toward your goals.',
  'Your attention is your most valuable asset.',
  'Stay focused. Stay driven.',
  'Small steps lead to big achievements.',
];

/**
 * Motivational quotes for waiting period
 */
const WAITING_QUOTES = [
  'The ability to concentrate is the ability to prevent distraction.',
  'What you do today determines who you become tomorrow.',
  'Discipline is choosing between what you want now and what you want most.',
  'Small steps every day lead to big changes over time.',
  'The secret of getting ahead is getting started.',
];

/**
 * Get a random quote from settings or defaults
 */
function getRandomQuote(settings: BlockPageSettings): string {
  const quotes =
    settings.customQuotes.length > 0 ? settings.customQuotes : DEFAULT_QUOTES;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return (
    quotes[randomIndex] ?? DEFAULT_QUOTES[0] ?? 'Focus on what matters most.'
  );
}

/**
 * Determine if dark theme should be used
 */
function shouldUseDarkTheme(theme: BlockPageSettings['theme']): boolean {
  if (theme === 'dark') {
    return true;
  }
  if (theme === 'light') {
    return false;
  }
  // System preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Generate block page overlay HTML
 */
export function createBlockPageOverlay(
  settings: BlockPageSettings,
  platformName: string,
  overlayId: string
): HTMLDivElement {
  const isDark = shouldUseDarkTheme(settings.theme);
  const primaryColor = settings.primaryColor || '#3b82f6';

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = overlayId;

  // Background styles based on theme
  const bgGradient = isDark
    ? `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
    : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)`;

  const textColor = isDark ? '#ffffff' : '#1e293b';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)';
  const textMuted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,41,59,0.5)';

  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${bgGradient};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: ${textColor};
    visibility: visible !important;
  `;

  // Create content container
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText =
    'text-align: center; max-width: 450px; padding: 40px;';

  // Create icon (the real extension icon, not an emoji)
  const iconDiv = document.createElement('div');
  iconDiv.style.cssText = `margin-bottom: 24px; filter: drop-shadow(0 4px 8px ${primaryColor}40);`;
  const iconImg = document.createElement('img');
  iconImg.src = browser.runtime.getURL('icons/icon-128.png');
  iconImg.alt = '';
  iconImg.style.cssText = 'width: 72px; height: 72px; border-radius: 18px;';
  iconDiv.appendChild(iconImg);
  contentDiv.appendChild(iconDiv);

  // Create title
  const title = document.createElement('h1');
  title.style.cssText = `
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 12px 0;
    color: ${textColor};
  `;
  title.textContent = settings.title || 'Content Blocked';
  contentDiv.appendChild(title);

  // Create main message
  const mainMessage = document.createElement('p');
  mainMessage.style.cssText = `
    font-size: 18px;
    color: ${textSecondary};
    margin: 0 0 24px 0;
    line-height: 1.5;
  `;
  const messageTemplate =
    settings.message || `${platformName} is blocked to help you stay focused.`;
  mainMessage.textContent = messageTemplate.replace(
    '${platform}',
    platformName
  );
  contentDiv.appendChild(mainMessage);

  // Create motivational quote if enabled
  if (settings.showMotivationalQuote) {
    const quoteDiv = document.createElement('div');
    quoteDiv.style.cssText = `
      margin: 24px 0;
      padding: 16px 24px;
      background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
      border-left: 4px solid ${primaryColor};
      border-radius: 0 8px 8px 0;
    `;

    const quoteText = document.createElement('p');
    quoteText.style.cssText = `
      font-size: 16px;
      font-style: italic;
      color: ${textSecondary};
      margin: 0;
      line-height: 1.5;
    `;
    quoteText.textContent = `"${getRandomQuote(settings)}"`;
    quoteDiv.appendChild(quoteText);
    contentDiv.appendChild(quoteDiv);
  }

  // adalab study focus context (countdown + current task), shown while a
  // synced work session is running
  const adalabDiv = document.createElement('div');
  adalabDiv.id = `${overlayId}-adalab`;
  adalabDiv.style.cssText = `
    display: none;
    margin: 20px 0 0 0;
    padding: 14px 20px;
    border-radius: 12px;
    background: ${isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.08)'};
    border: 1px solid rgba(6,182,212,0.35);
  `;
  contentDiv.appendChild(adalabDiv);
  void attachAdalabContext(adalabDiv, textColor, textSecondary);

  // Create bypass button if enabled
  if (settings.showBypassButton) {
    const bypassBtn = document.createElement('button');
    bypassBtn.id = `${overlayId}-bypass-btn`;
    bypassBtn.style.cssText = `
      margin-top: 24px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      color: ${primaryColor};
      background: transparent;
      border: 2px solid ${primaryColor};
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    bypassBtn.textContent = 'Bypass for 5 minutes';
    bypassBtn.onmouseover = () => {
      bypassBtn.style.background = primaryColor;
      bypassBtn.style.color = '#ffffff';
    };
    bypassBtn.onmouseout = () => {
      bypassBtn.style.background = 'transparent';
      bypassBtn.style.color = primaryColor;
    };
    bypassBtn.onclick = () => {
      // Check if Commitment Lock is enabled and handle unlock flow
      void (async () => {
        try {
          interface SettingsResponse {
            success: boolean;
            data?: { commitmentLock?: CommitmentLockSettings };
          }
          const settingsResponse: SettingsResponse =
            await browser.runtime.sendMessage({
              type: 'GET_SETTINGS',
              timestamp: Date.now(),
            });

          const isCommitmentLockEnabled =
            settingsResponse.success === true &&
            settingsResponse.data?.commitmentLock?.enabled === true;

          if (isCommitmentLockEnabled) {
            // Show Commitment Lock unlock flow
            await showCommitmentLockFlow(
              overlay,
              overlayId,
              primaryColor,
              isDark
            );
          } else {
            // Simple bypass without Commitment Lock
            overlay.remove();
            document.body.style.removeProperty('visibility');
            document.body.style.removeProperty('overflow');
          }
        } catch (err) {
          console.error('Failed to check Commitment Lock:', err);
          // Fallback to simple bypass
          overlay.remove();
          document.body.style.removeProperty('visibility');
          document.body.style.removeProperty('overflow');
        }
      })();
    };
    contentDiv.appendChild(bypassBtn);
  }

  // Create settings hint
  const settingsHint = document.createElement('p');
  settingsHint.style.cssText = `
    font-size: 13px;
    color: ${textMuted};
    margin: ${settings.showBypassButton ? '16px' : '24px'} 0 0 0;
  `;
  settingsHint.textContent = t(
    'blockPageSettingsHint',
    'You can change this in adalab shield settings.'
  );
  contentDiv.appendChild(settingsHint);

  overlay.appendChild(contentDiv);

  return overlay;
}

/**
 * Populate and keep the adalab focus context section up to date
 * (remaining focus time + current task while a synced work session runs)
 */
async function attachAdalabContext(
  container: HTMLDivElement,
  textColor: string,
  textSecondary: string
): Promise<void> {
  let endTime: number | null = null;
  let intervalId: number | null = null;

  const stopTicking = (): void => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  const render = (
    state: PomodoroState | undefined,
    meta: AdalabMetaLike | undefined
  ): void => {
    const active =
      state?.isRunning === true &&
      state.mode === 'work' &&
      typeof state.endTime === 'number';

    if (!active) {
      container.style.display = 'none';
      stopTicking();
      return;
    }

    endTime = state.endTime;
    container.innerHTML = '';

    const label = document.createElement('div');
    label.style.cssText = `font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: ${textSecondary}; margin-bottom: 4px;`;
    label.textContent = t('blockPageFocusRemaining', 'Focus — time remaining');
    container.appendChild(label);

    const time = document.createElement('div');
    time.style.cssText = `font-size: 30px; font-weight: 700; font-variant-numeric: tabular-nums; color: ${textColor};`;
    container.appendChild(time);

    const taskTitle = meta?.taskTitle;
    if (typeof taskTitle === 'string' && taskTitle !== '') {
      const taskLine = document.createElement('div');
      taskLine.style.cssText = `font-size: 13px; color: ${textSecondary}; margin-top: 6px;`;
      taskLine.textContent = `${t('blockPageWorkingOn', 'Working on')}: ${taskTitle}`;
      container.appendChild(taskLine);
    }

    container.style.display = 'block';

    const tick = (): void => {
      const remSec = Math.max(
        0,
        Math.round(((endTime ?? 0) - Date.now()) / 1000)
      );
      const m = String(Math.floor(remSec / 60)).padStart(2, '0');
      const s = String(remSec % 60).padStart(2, '0');
      time.textContent = `${m}:${s}`;
    };
    tick();
    stopTicking();
    intervalId = window.setInterval(tick, 1000);
  };

  const refresh = async (): Promise<void> => {
    try {
      const r = await browser.storage.local.get([
        STORAGE_KEYS.POMODORO_STATE,
        STORAGE_KEYS.ADALAB_META,
      ]);
      render(
        r[STORAGE_KEYS.POMODORO_STATE] as PomodoroState | undefined,
        r[STORAGE_KEYS.ADALAB_META] as AdalabMetaLike | undefined
      );
    } catch {
      container.style.display = 'none';
      stopTicking();
    }
  };

  await refresh();

  try {
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }
      if (
        changes[STORAGE_KEYS.POMODORO_STATE] !== undefined ||
        changes[STORAGE_KEYS.ADALAB_META] !== undefined
      ) {
        void refresh();
      }
    });
  } catch {
    // Storage events unavailable: countdown still works from the initial read
  }
}

/**
 * Show block page overlay
 */
export function showBlockPage(
  settings: BlockPageSettings,
  platformName: string,
  overlayId: string
): void {
  // Check if overlay already exists
  if (document.getElementById(overlayId)) {
    return;
  }

  // Hide the body content
  document.body.style.setProperty('visibility', 'hidden', 'important');
  document.body.style.setProperty('overflow', 'hidden', 'important');

  // Create and append overlay
  const overlay = createBlockPageOverlay(settings, platformName, overlayId);
  document.documentElement.appendChild(overlay);
}

/**
 * Show Commitment Lock unlock flow on the block page
 */
async function showCommitmentLockFlow(
  overlay: HTMLDivElement,
  overlayId: string,
  primaryColor: string,
  isDark: boolean
): Promise<void> {
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const bgModal = isDark ? '#1f2937' : '#ffffff';

  // Check if unlock is allowed
  try {
    const checkResponse: CheckUnlockResponse =
      await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_CHECK_UNLOCK',
        timestamp: Date.now(),
      });

    if (
      checkResponse.success !== true ||
      checkResponse.data?.allowed !== true
    ) {
      showUnlockError(
        overlay,
        checkResponse.data?.message ?? 'Unlock not allowed',
        primaryColor,
        isDark
      );
      return;
    }
  } catch (err) {
    console.error('Failed to check unlock:', err);
    showUnlockError(
      overlay,
      'Failed to check unlock status',
      primaryColor,
      isDark
    );
    return;
  }

  // Get settings for the flow
  const settingsResponse: SettingsWithLockResponse =
    await browser.runtime.sendMessage({
      type: 'GET_SETTINGS',
      timestamp: Date.now(),
    });

  if (
    settingsResponse.success !== true ||
    settingsResponse.data === undefined
  ) {
    showUnlockError(overlay, 'Failed to load settings', primaryColor, isDark);
    return;
  }

  const lockSettings = settingsResponse.data.commitmentLock;

  // Create modal container
  const modal = document.createElement('div');
  modal.id = `${overlayId}-unlock-modal`;
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${bgModal};
    border-radius: 16px;
    padding: 32px;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    z-index: 2147483648;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: ${textColor};
  `;

  // Show initial confirmation step
  showInitialStep(modal, overlay, lockSettings, primaryColor, isDark);
  overlay.appendChild(modal);
}

/**
 * Show initial unlock confirmation step
 */
function showInitialStep(
  modal: HTMLDivElement,
  overlay: HTMLDivElement,
  settings: CommitmentLockSettings,
  primaryColor: string,
  isDark: boolean
): void {
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)';

  modal.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
      <h2 style="margin: 0 0 12px 0; font-size: 22px; color: ${textColor};">Are you sure you want to unlock?</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${textSecondary};">
        Level ${settings.level} protection is active. Complete all steps to unlock.
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="unlock-cancel" style="
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: ${textSecondary};
          background: transparent;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          border-radius: 8px;
          cursor: pointer;
        ">Go Back</button>
        <button id="unlock-start" style="
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          background: ${primaryColor};
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">Continue</button>
      </div>
    </div>
  `;

  modal.querySelector('#unlock-cancel')?.addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('#unlock-start')?.addEventListener('click', () => {
    void (async () => {
      try {
        const response: StartUnlockResponse = await browser.runtime.sendMessage(
          {
            type: 'COMMITMENT_LOCK_START_UNLOCK',
            timestamp: Date.now(),
          }
        );

        if (response.success === true && response.data !== undefined) {
          showWaitingStep(
            modal,
            overlay,
            settings,
            response.data.waitSecondsRemaining,
            primaryColor,
            isDark
          );
        } else {
          showUnlockError(
            overlay,
            'Failed to start unlock',
            primaryColor,
            isDark
          );
          modal.remove();
        }
      } catch (err) {
        console.error('Failed to start unlock:', err);
        showUnlockError(
          overlay,
          'Failed to start unlock',
          primaryColor,
          isDark
        );
        modal.remove();
      }
    })();
  });
}

/**
 * Show waiting countdown step
 */
function showWaitingStep(
  modal: HTMLDivElement,
  overlay: HTMLDivElement,
  settings: CommitmentLockSettings,
  waitSeconds: number,
  primaryColor: string,
  isDark: boolean
): void {
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)';
  const quote =
    WAITING_QUOTES[Math.floor(Math.random() * WAITING_QUOTES.length)] ??
    WAITING_QUOTES[0];
  let remaining = waitSeconds;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateDisplay = () => {
    const timerEl = modal.querySelector('#countdown-timer');
    const progressEl = modal.querySelector(
      '#countdown-progress'
    ) as HTMLDivElement;
    if (timerEl) {
      timerEl.textContent = formatTime(remaining);
    }
    if (progressEl) {
      const percent = ((waitSeconds - remaining) / waitSeconds) * 100;
      progressEl.style.width = `${percent}%`;
    }
  };

  modal.innerHTML = `
    <div style="text-align: center;">
      <div style="
        padding: 16px 24px;
        background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
        border-left: 4px solid ${primaryColor};
        border-radius: 0 8px 8px 0;
        margin-bottom: 24px;
      ">
        <p style="font-style: italic; margin: 0; color: ${textSecondary};">"${quote}"</p>
      </div>
      <div style="
        width: 100px;
        height: 100px;
        border-radius: 50%;
        border: 4px solid ${primaryColor};
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px auto;
      ">
        <span id="countdown-timer" style="font-size: 28px; font-weight: bold; color: ${textColor};">${formatTime(remaining)}</span>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: ${textSecondary};">Please wait...</p>
      <div style="
        height: 4px;
        background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 24px;
      ">
        <div id="countdown-progress" style="
          height: 100%;
          background: ${primaryColor};
          width: 0%;
          transition: width 1s linear;
        "></div>
      </div>
      <button id="unlock-cancel-wait" style="
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 500;
        color: ${textSecondary};
        background: transparent;
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
        border-radius: 8px;
        cursor: pointer;
      ">Cancel</button>
    </div>
  `;

  const timer = setInterval(() => {
    remaining--;
    updateDisplay();

    if (remaining <= 0) {
      clearInterval(timer);
      // Move to next step
      if (settings.requireIntentionStatement) {
        showIntentionStep(modal, overlay, settings, primaryColor, isDark);
      } else if (settings.level >= 2) {
        void showChallengeStep(modal, overlay, settings, primaryColor, isDark);
      } else {
        showFinalConfirmStep(modal, overlay, primaryColor, isDark);
      }
    }
  }, 1000);

  modal.querySelector('#unlock-cancel-wait')?.addEventListener('click', () => {
    clearInterval(timer);
    void (async () => {
      try {
        await browser.runtime.sendMessage({
          type: 'COMMITMENT_LOCK_CANCEL_UNLOCK',
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Failed to cancel unlock:', err);
      }
      modal.remove();
    })();
  });
}

/**
 * Show intention statement step
 */
function showIntentionStep(
  modal: HTMLDivElement,
  overlay: HTMLDivElement,
  settings: CommitmentLockSettings,
  primaryColor: string,
  isDark: boolean
): void {
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)';
  const bgInput = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  modal.innerHTML = `
    <div style="text-align: center;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: ${textColor};">Why do you need to unlock?</h3>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: ${textSecondary};">
        Please explain your reason for unlocking. Minimum ${settings.intentionMinLength} characters.
      </p>
      <textarea id="intention-input" style="
        width: 100%;
        padding: 12px;
        font-size: 14px;
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
        border-radius: 8px;
        background: ${bgInput};
        color: ${textColor};
        resize: none;
        box-sizing: border-box;
      " rows="4" placeholder="Explain your reason for unlocking..."></textarea>
      <p id="char-count" style="margin: 8px 0 16px 0; font-size: 12px; color: ${textSecondary};">
        0 / ${settings.intentionMinLength} characters
      </p>
      <p id="intention-error" style="margin: 0 0 16px 0; font-size: 14px; color: #ef4444; display: none;"></p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="intention-cancel" style="
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: ${textSecondary};
          background: transparent;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          border-radius: 8px;
          cursor: pointer;
        ">Cancel</button>
        <button id="intention-submit" style="
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          background: ${primaryColor};
          border: none;
          border-radius: 8px;
          cursor: pointer;
          opacity: 0.5;
        " disabled>Continue</button>
      </div>
    </div>
  `;

  const input = modal.querySelector('#intention-input') as HTMLTextAreaElement;
  const charCount = modal.querySelector('#char-count') as HTMLParagraphElement;
  const submitBtn = modal.querySelector(
    '#intention-submit'
  ) as HTMLButtonElement;
  const errorEl = modal.querySelector(
    '#intention-error'
  ) as HTMLParagraphElement;

  input?.addEventListener('input', () => {
    const len = input.value.length;
    charCount.textContent = `${len} / ${settings.intentionMinLength} characters`;
    const isValid = len >= settings.intentionMinLength;
    submitBtn.disabled = !isValid;
    submitBtn.style.opacity = isValid ? '1' : '0.5';
  });

  modal.querySelector('#intention-cancel')?.addEventListener('click', () => {
    void (async () => {
      try {
        await browser.runtime.sendMessage({
          type: 'COMMITMENT_LOCK_CANCEL_UNLOCK',
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Failed to cancel unlock:', err);
      }
      modal.remove();
    })();
  });

  submitBtn?.addEventListener('click', () => {
    void (async () => {
      const intention = input.value.trim();
      if (intention.length < settings.intentionMinLength) {
        errorEl.textContent = `Intention must be at least ${settings.intentionMinLength} characters`;
        errorEl.style.display = 'block';
        return;
      }

      try {
        const response: SubmitIntentionResponse =
          await browser.runtime.sendMessage({
            type: 'COMMITMENT_LOCK_SUBMIT_INTENTION',
            timestamp: Date.now(),
            payload: { intention },
          });

        if (response.success === true) {
          if (settings.level >= 2) {
            void showChallengeStep(
              modal,
              overlay,
              settings,
              primaryColor,
              isDark
            );
          } else {
            showFinalConfirmStep(modal, overlay, primaryColor, isDark);
          }
        } else {
          errorEl.textContent = response.error ?? 'Failed to submit intention';
          errorEl.style.display = 'block';
        }
      } catch (err) {
        console.error('Failed to submit intention:', err);
        errorEl.textContent = 'Failed to submit intention';
        errorEl.style.display = 'block';
      }
    })();
  });
}

/**
 * Show challenge step
 */
async function showChallengeStep(
  modal: HTMLDivElement,
  overlay: HTMLDivElement,
  settings: CommitmentLockSettings,
  primaryColor: string,
  isDark: boolean,
  currentProgress: { current: number; total: number; correct: number } = {
    current: 0,
    total: settings.challengeCount,
    correct: 0,
  }
): Promise<void> {
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)';
  const bgInput = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  try {
    const response: RequestChallengeResponse =
      await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_REQUEST_CHALLENGE',
        timestamp: Date.now(),
      });

    if (response.success !== true || response.data === undefined) {
      showUnlockError(
        overlay,
        response.error ?? 'Failed to get challenge',
        primaryColor,
        isDark
      );
      modal.remove();
      return;
    }

    const challenge = response.data;
    const progress = {
      ...currentProgress,
      current: currentProgress.current + 1,
    };

    // Create progress dots
    const dots = Array.from({ length: progress.total })
      .map((_, i) => {
        const dotColor =
          i < progress.correct
            ? '#10b981'
            : i === progress.correct
              ? primaryColor
              : isDark
                ? 'rgba(255,255,255,0.3)'
                : 'rgba(0,0,0,0.2)';
        return `<span style="width: 10px; height: 10px; border-radius: 50%; background: ${dotColor};"></span>`;
      })
      .join('');

    modal.innerHTML = `
      <div style="text-align: center;">
        <div style="margin-bottom: 16px;">
          <span style="font-size: 14px; color: ${textSecondary};">Challenge ${progress.current} of ${progress.total}</span>
          <div style="display: flex; gap: 6px; justify-content: center; margin-top: 8px;">${dots}</div>
        </div>
        <div style="
          padding: 24px;
          background: ${bgInput};
          border-radius: 12px;
          margin-bottom: 16px;
        ">
          <p style="margin: 0; font-size: 18px; font-weight: 500; color: ${textColor};">${challenge.question}</p>
        </div>
        <input id="challenge-input" type="text" style="
          width: 100%;
          padding: 12px;
          font-size: 16px;
          text-align: center;
          border: 2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          border-radius: 8px;
          background: ${bgInput};
          color: ${textColor};
          box-sizing: border-box;
        " placeholder="Enter your answer..." autocomplete="off" />
        <p id="challenge-error" style="margin: 12px 0 0 0; font-size: 14px; color: #ef4444; display: none;"></p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 16px;">
          <button id="challenge-cancel" style="
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            color: ${textSecondary};
            background: transparent;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
            border-radius: 8px;
            cursor: pointer;
          ">Cancel</button>
          <button id="challenge-submit" style="
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
            background: ${primaryColor};
            border: none;
            border-radius: 8px;
            cursor: pointer;
          ">Submit</button>
        </div>
      </div>
    `;

    const input = modal.querySelector('#challenge-input') as HTMLInputElement;
    const errorEl = modal.querySelector(
      '#challenge-error'
    ) as HTMLParagraphElement;

    input?.focus();
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        modal
          .querySelector('#challenge-submit')
          ?.dispatchEvent(new Event('click'));
      }
    });

    modal.querySelector('#challenge-cancel')?.addEventListener('click', () => {
      void (async () => {
        try {
          await browser.runtime.sendMessage({
            type: 'COMMITMENT_LOCK_CANCEL_UNLOCK',
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('Failed to cancel unlock:', err);
        }
        modal.remove();
      })();
    });

    modal.querySelector('#challenge-submit')?.addEventListener('click', () => {
      void (async () => {
        const answer = input.value.trim();
        if (answer.length === 0) {
          errorEl.textContent = 'Please enter an answer';
          errorEl.style.display = 'block';
          return;
        }

        try {
          const submitResponse: SubmitChallengeResponse =
            await browser.runtime.sendMessage({
              type: 'COMMITMENT_LOCK_SUBMIT_CHALLENGE',
              timestamp: Date.now(),
              payload: { answer },
            });

          if (
            submitResponse.success === true &&
            submitResponse.data !== undefined
          ) {
            if (submitResponse.data.correct) {
              const newProgress = {
                ...progress,
                correct: progress.correct + 1,
              };
              if (submitResponse.data.allCompleted) {
                showFinalConfirmStep(modal, overlay, primaryColor, isDark);
              } else {
                void showChallengeStep(
                  modal,
                  overlay,
                  settings,
                  primaryColor,
                  isDark,
                  newProgress
                );
              }
            } else {
              // Wrong answer
              if (settings.challengesMustBeConsecutive) {
                errorEl.textContent = 'Wrong answer! Progress reset.';
                errorEl.style.display = 'block';
                setTimeout(() => {
                  void showChallengeStep(
                    modal,
                    overlay,
                    settings,
                    primaryColor,
                    isDark,
                    { current: 0, total: settings.challengeCount, correct: 0 }
                  );
                }, 1500);
              } else {
                errorEl.textContent = 'Wrong answer. Try again.';
                errorEl.style.display = 'block';
                input.value = '';
                input.focus();
              }
            }
          } else {
            errorEl.textContent =
              submitResponse.error ?? 'Failed to submit answer';
            errorEl.style.display = 'block';
          }
        } catch (err) {
          console.error('Failed to submit challenge:', err);
          errorEl.textContent = 'Failed to submit answer';
          errorEl.style.display = 'block';
        }
      })();
    });
  } catch (err) {
    console.error('Failed to show challenge step:', err);
    showUnlockError(overlay, 'Failed to load challenge', primaryColor, isDark);
    modal.remove();
  }
}

/**
 * Show final confirmation step
 */
function showFinalConfirmStep(
  modal: HTMLDivElement,
  overlay: HTMLDivElement,
  _primaryColor: string,
  isDark: boolean
): void {
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)';

  modal.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px; color: #10b981;">✓</div>
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: ${textColor};">All steps completed!</h3>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${textSecondary};">
        Are you sure you want to proceed with unlocking?
      </p>
      <p id="final-error" style="margin: 0 0 16px 0; font-size: 14px; color: #ef4444; display: none;"></p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="final-cancel" style="
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: ${textSecondary};
          background: transparent;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          border-radius: 8px;
          cursor: pointer;
        ">Cancel</button>
        <button id="final-confirm" style="
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          background: #ef4444;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">Unlock Now</button>
      </div>
    </div>
  `;

  modal.querySelector('#final-cancel')?.addEventListener('click', () => {
    void (async () => {
      try {
        await browser.runtime.sendMessage({
          type: 'COMMITMENT_LOCK_CANCEL_UNLOCK',
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Failed to cancel unlock:', err);
      }
      modal.remove();
    })();
  });

  modal.querySelector('#final-confirm')?.addEventListener('click', () => {
    void (async () => {
      const errorEl = modal.querySelector(
        '#final-error'
      ) as HTMLParagraphElement;
      try {
        const response: ConfirmUnlockResponse =
          await browser.runtime.sendMessage({
            type: 'COMMITMENT_LOCK_CONFIRM_UNLOCK',
            timestamp: Date.now(),
          });

        if (response.success === true) {
          showSuccessStep(modal, overlay);
        } else {
          errorEl.textContent = response.error ?? 'Failed to confirm unlock';
          errorEl.style.display = 'block';
        }
      } catch (err) {
        console.error('Failed to confirm unlock:', err);
        errorEl.textContent = 'Failed to confirm unlock';
        errorEl.style.display = 'block';
      }
    })();
  });
}

/**
 * Show success step and remove overlay
 */
function showSuccessStep(modal: HTMLDivElement, overlay: HTMLDivElement): void {
  modal.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
      <h3 style="margin: 0 0 12px 0; font-size: 18px;">Successfully unlocked!</h3>
      <p style="margin: 0; font-size: 14px; opacity: 0.7;">Cooldown period has started.</p>
    </div>
  `;

  setTimeout(() => {
    modal.remove();
    overlay.remove();
    document.body.style.removeProperty('visibility');
    document.body.style.removeProperty('overflow');
  }, 1500);
}

/**
 * Show unlock error message
 */
function showUnlockError(
  overlay: HTMLDivElement,
  message: string,
  primaryColor: string,
  isDark: boolean
): void {
  const textColor = isDark ? '#ffffff' : '#1e293b';
  const bgModal = isDark ? '#1f2937' : '#ffffff';

  const errorModal = document.createElement('div');
  errorModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${bgModal};
    border-radius: 16px;
    padding: 32px;
    max-width: 380px;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    z-index: 2147483648;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: ${textColor};
  `;

  errorModal.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px; color: #ef4444;">✗</div>
    <h3 style="margin: 0 0 12px 0; font-size: 18px;">Unlock Not Allowed</h3>
    <p style="margin: 0 0 24px 0; font-size: 14px; opacity: 0.7;">${message}</p>
    <button id="error-close" style="
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
      background: ${primaryColor};
      border: none;
      border-radius: 8px;
      cursor: pointer;
    ">Close</button>
  `;

  overlay.appendChild(errorModal);

  errorModal.querySelector('#error-close')?.addEventListener('click', () => {
    errorModal.remove();
  });
}

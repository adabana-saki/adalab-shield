/**
 * adalab study integration bridge
 * Runs only on the adalab study web app and forwards its pomodoro timer
 * state to the background so blocking follows the external timer
 * (work = blocking active, break = unblocked).
 * Also relays popup remote-control commands into the page and pushes
 * block statistics to the app.
 */

import browser from 'webextension-polyfill';
import { createMessage } from '@/shared/types';
import type {
  AdalabSyncMessage,
  AdalabPhase,
  AdalabAppState,
  AdalabCommandAction,
  AdalabCommandResponse,
  Settings,
} from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('adalab-bridge');

const VALID_PHASES: ReadonlySet<string> = new Set([
  'work',
  'short_break',
  'long_break',
  'idle',
]);

const VALID_COMMAND_ACTIONS: ReadonlySet<string> = new Set([
  'get-state',
  'timer-start',
  'timer-stop',
  'task-complete',
]);

const COMMAND_TIMEOUT_MS = 3000;
const MAX_TASK_TITLE_LENGTH = 200;

/**
 * Check whether this page is the adalab study web app.
 * localhost is only trusted on the Vite dev port to avoid arbitrary local
 * sites driving the blocking state.
 */
function isAdalabHost(): boolean {
  const { hostname, port } = window.location;
  if (hostname === 'study.adalabtech.com') {
    return true;
  }
  return (
    (hostname === 'localhost' || hostname === '127.0.0.1') && port === '5173'
  );
}

interface BridgeEventData {
  readonly source?: unknown;
  readonly type?: unknown;
  readonly payload?: unknown;
}

/**
 * Validate and extract the sync payload from a window message
 */
function parsePayload(
  data: BridgeEventData
): AdalabSyncMessage['payload'] | null {
  if (data.source !== 'adalab-study' || data.type !== 'timer-sync') {
    return null;
  }

  const p = data.payload as
    | {
        phase?: unknown;
        running?: unknown;
        endTime?: unknown;
        taskTitle?: unknown;
      }
    | undefined;

  if (
    p === undefined ||
    typeof p.phase !== 'string' ||
    !VALID_PHASES.has(p.phase) ||
    typeof p.running !== 'boolean' ||
    (p.endTime !== null && typeof p.endTime !== 'number')
  ) {
    return null;
  }

  const taskTitle =
    typeof p.taskTitle === 'string'
      ? p.taskTitle.slice(0, MAX_TASK_TITLE_LENGTH)
      : null;

  return {
    phase: p.phase as AdalabPhase,
    running: p.running,
    endTime: p.endTime,
    taskTitle,
  };
}

/**
 * Relay a popup command into the page and wait for the matching result
 */
function relayCommandToPage(
  action: AdalabCommandAction,
  taskId?: string
): Promise<AdalabCommandResponse> {
  return new Promise((resolve) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const cleanup = (): void => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('message', onResult);
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve({ success: false, error: 'adalab study did not respond' });
    }, COMMAND_TIMEOUT_MS);

    const onResult = (event: MessageEvent): void => {
      if (event.source !== window) {
        return;
      }
      const d = event.data as {
        source?: unknown;
        type?: unknown;
        requestId?: unknown;
        ok?: unknown;
        payload?: unknown;
      };
      if (
        d.source !== 'adalab-study' ||
        d.type !== 'command-result' ||
        d.requestId !== requestId
      ) {
        return;
      }
      cleanup();
      resolve({
        success: d.ok === true,
        data: d.payload as AdalabAppState,
      });
    };

    window.addEventListener('message', onResult);
    window.postMessage(
      { source: 'shortshield', type: 'command', requestId, action, taskId },
      window.location.origin
    );
  });
}

/**
 * Push block statistics into the adalab study app so it can show
 * "temptations blocked" in its reports
 */
function pushBlockStats(settings: Settings): void {
  window.postMessage(
    {
      source: 'shortshield',
      type: 'block-stats',
      payload: {
        date: settings.stats.lastResetDate,
        blockedToday: settings.stats.blockedToday,
        blockedTotal: settings.stats.blockedTotal,
      },
    },
    window.location.origin
  );
}

/**
 * Initialize the bridge (no-op outside the adalab study app)
 */
export function initAdalabBridge(): void {
  if (!isAdalabHost()) {
    return;
  }

  void (async () => {
    // Respect the integration toggle in the extension settings
    try {
      const raw: unknown = await browser.runtime.sendMessage(
        createMessage({ type: 'GET_SETTINGS' })
      );
      const response = raw as { success?: boolean; data?: Settings };
      if (response.success === true && response.data !== undefined) {
        if (!response.data.adalabSync.enabled) {
          logger.info('adalab sync disabled in settings');
          return;
        }
        pushBlockStats(response.data);
      }
    } catch {
      // Background unavailable: fall through and let messages fail quietly
    }

    // Mark the extension as present so the web app can show the link status
    document.documentElement.dataset.adalabShield =
      browser.runtime.getManifest().version;

    // Popup → page command relay (timer start/stop, task completion)
    browser.runtime.onMessage.addListener((msg: unknown) => {
      const m = msg as { type?: unknown; action?: unknown; taskId?: unknown };
      if (m === null || typeof m !== 'object' || m.type !== 'ADALAB_COMMAND') {
        return undefined;
      }
      if (
        typeof m.action !== 'string' ||
        !VALID_COMMAND_ACTIONS.has(m.action)
      ) {
        return undefined;
      }
      return relayCommandToPage(
        m.action as AdalabCommandAction,
        typeof m.taskId === 'string' ? m.taskId : undefined
      );
    });

    // Page → background timer sync
    window.addEventListener('message', (event: MessageEvent) => {
      // Only accept messages posted by the page itself
      if (event.source !== window) {
        return;
      }

      const payload = parsePayload(event.data as BridgeEventData);
      if (payload === null) {
        return;
      }

      const message = createMessage<AdalabSyncMessage>({
        type: 'ADALAB_SYNC',
        payload,
      });

      browser.runtime.sendMessage(message).catch((error: unknown) => {
        logger.debug('Failed to forward adalab sync', {
          error: String(error),
        });
      });
    });

    // Keep block stats fresh in the app (stats live inside settings)
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }
      const settingsChange = changes[STORAGE_KEYS.SETTINGS];
      const newSettings = settingsChange?.newValue as Settings | undefined;
      if (newSettings !== undefined) {
        pushBlockStats(newSettings);
      }
    });

    logger.info('adalab study bridge initialized');
  })();
}

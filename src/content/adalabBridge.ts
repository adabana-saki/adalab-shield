/**
 * adalab study integration bridge
 * Runs only on the adalab study web app and forwards its pomodoro timer
 * state to the background so blocking follows the external timer
 * (work = blocking active, break = unblocked).
 */

import browser from 'webextension-polyfill';
import { createMessage } from '@/shared/types';
import type {
  AdalabSyncMessage,
  AdalabPhase,
  AdalabAppState,
  AdalabCommandAction,
  AdalabCommandResponse,
} from '@/shared/types';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('adalab-bridge');

/**
 * Hostnames where the adalab study web app runs
 */
const ADALAB_HOSTNAMES: ReadonlySet<string> = new Set([
  'study.adalabtech.com',
  'localhost',
  '127.0.0.1',
]);

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
    | { phase?: unknown; running?: unknown; endTime?: unknown }
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

  return {
    phase: p.phase as AdalabPhase,
    running: p.running,
    endTime: p.endTime,
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
 * Initialize the bridge (no-op outside the adalab study app)
 */
export function initAdalabBridge(): void {
  if (!ADALAB_HOSTNAMES.has(window.location.hostname)) {
    return;
  }

  // Popup → page command relay (timer start/stop, task completion)
  browser.runtime.onMessage.addListener((msg: unknown) => {
    const m = msg as { type?: unknown; action?: unknown; taskId?: unknown };
    if (m === null || typeof m !== 'object' || m.type !== 'ADALAB_COMMAND') {
      return undefined;
    }
    if (typeof m.action !== 'string' || !VALID_COMMAND_ACTIONS.has(m.action)) {
      return undefined;
    }
    return relayCommandToPage(
      m.action as AdalabCommandAction,
      typeof m.taskId === 'string' ? m.taskId : undefined
    );
  });

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
      logger.debug('Failed to forward adalab sync', { error: String(error) });
    });
  });

  logger.info('adalab study bridge initialized');
}

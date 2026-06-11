/**
 * adalab study integration bridge
 * Runs only on the adalab study web app and forwards its pomodoro timer
 * state to the background so blocking follows the external timer
 * (work = blocking active, break = unblocked).
 */

import browser from 'webextension-polyfill';
import { createMessage } from '@/shared/types';
import type { AdalabSyncMessage, AdalabPhase } from '@/shared/types';
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
 * Initialize the bridge (no-op outside the adalab study app)
 */
export function initAdalabBridge(): void {
  if (!ADALAB_HOSTNAMES.has(window.location.hostname)) {
    return;
  }

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

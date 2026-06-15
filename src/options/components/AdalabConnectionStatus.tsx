/**
 * Live adalab study connection status for the settings page.
 *
 * Mirrors the popup widget's probing: it queries for an open adalab study tab
 * and pings its content script. From the result it shows one of three clear
 * states — connected, tab-open-but-unresponsive (needs reload), or not open —
 * each with the exact next step, so the integration is discoverable and its
 * health is obvious.
 */

import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import type {
  AdalabCommandRequest,
  AdalabCommandResponse,
} from '@/shared/types';

const ADALAB_TAB_PATTERNS = [
  'https://study.adalabtech.com/*',
  'http://localhost:5173/*',
];
const STUDY_URL = 'https://study.adalabtech.com';

type ConnState = 'connected' | 'stale' | 'closed';

export function AdalabConnectionStatus() {
  const { t } = useI18n();
  const [state, setState] = useState<ConnState>('closed');
  const [tabId, setTabId] = useState<number | null>(null);

  const probe = useCallback(async () => {
    try {
      const tabs = await browser.tabs.query({ url: ADALAB_TAB_PATTERNS });
      const tab = tabs.find((x) => x.id !== undefined);
      if (tab?.id === undefined) {
        setTabId(null);
        setState('closed');
        return;
      }
      setTabId(tab.id);
      try {
        const request: AdalabCommandRequest = {
          type: 'ADALAB_COMMAND',
          action: 'get-state',
        };
        const response: AdalabCommandResponse = await browser.tabs.sendMessage(
          tab.id,
          request
        );
        setState(response.success ? 'connected' : 'stale');
      } catch {
        setState('stale');
      }
    } catch {
      setState('closed');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async polling
    void probe();
    const interval = setInterval(() => void probe(), 3000);
    return () => clearInterval(interval);
  }, [probe]);

  const openStudy = (): void => {
    void (async () => {
      try {
        const tabs = await browser.tabs.query({ url: ADALAB_TAB_PATTERNS });
        const existing = tabs.find((x) => x.id !== undefined);
        if (existing?.id !== undefined) {
          await browser.tabs.update(existing.id, { active: true });
        } else {
          await browser.tabs.create({ url: STUDY_URL });
        }
      } catch {
        await browser.tabs.create({ url: STUDY_URL });
      }
    })();
  };

  return (
    <div className={`adalab-conn adalab-conn-${state}`}>
      <span className="adalab-conn-dot" aria-hidden="true" />
      <div className="adalab-conn-text">
        <span className="adalab-conn-title">
          {state === 'connected'
            ? t('adalabStatusConnected')
            : state === 'stale'
              ? t('adalabStatusStale')
              : t('adalabStatusDisconnected')}
        </span>
        <span className="adalab-conn-desc">
          {state === 'connected'
            ? t('adalabStatusConnectedDesc')
            : state === 'stale'
              ? t('adalabStatusStaleDesc')
              : t('adalabStatusDisconnectedDesc')}
        </span>
      </div>
      {state === 'stale' && tabId !== null ? (
        <button
          type="button"
          className="adalab-conn-btn"
          onClick={() => void browser.tabs.reload(tabId)}
        >
          {t('adalabStatusReloadBtn')}
        </button>
      ) : state === 'closed' ? (
        <button type="button" className="adalab-conn-btn" onClick={openStudy}>
          {t('adalabOpenStudyBtn')}
        </button>
      ) : null}
    </div>
  );
}

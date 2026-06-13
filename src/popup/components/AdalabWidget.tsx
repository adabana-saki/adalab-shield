/**
 * adalab study remote-control widget.
 * Shows the adalab study timer and today's open tasks, and lets the user
 * start/stop the pomodoro or complete tasks without leaving the popup.
 * When no adalab study tab is open, shows a subtle launcher to open it.
 */

import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import type {
  AdalabAppState,
  AdalabCommandAction,
  AdalabCommandRequest,
  AdalabCommandResponse,
} from '@/shared/types';

const ADALAB_TAB_PATTERNS = [
  'https://study.adalabtech.com/*',
  'http://localhost:5173/*',
];

const STUDY_URL = 'https://study.adalabtech.com';

function formatRemaining(endTime: number | null, now: number): string {
  if (endTime === null) {
    return '--:--';
  }
  const totalSec = Math.max(0, Math.round((endTime - now) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AdalabWidget() {
  const { t } = useI18n();
  const [tabId, setTabId] = useState<number | null>(null);
  const [state, setState] = useState<AdalabAppState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Last task completed from the popup, kept briefly so an accidental
  // completion can be undone with one click.
  const [lastCompleted, setLastCompleted] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const sendCommand = useCallback(
    async (
      targetTabId: number,
      action: AdalabCommandAction,
      taskId?: string
    ): Promise<void> => {
      try {
        const request: AdalabCommandRequest = {
          type: 'ADALAB_COMMAND',
          action,
          ...(taskId !== undefined ? { taskId } : {}),
        };
        const response: AdalabCommandResponse = await browser.tabs.sendMessage(
          targetTabId,
          request
        );
        if (response.success && response.data !== undefined) {
          setState(response.data);
        }
      } catch {
        // Tab closed or content script not ready
        setState(null);
      }
    },
    []
  );

  // Locate the adalab study tab and poll its state
  useEffect(() => {
    let cancelled = false;

    const refresh = async (): Promise<void> => {
      try {
        const tabs = await browser.tabs.query({ url: ADALAB_TAB_PATTERNS });
        const tab = tabs.find((x) => x.id !== undefined);
        if (cancelled) {
          return;
        }
        if (tab?.id === undefined) {
          setTabId(null);
          setState(null);
          return;
        }
        setTabId(tab.id);
        await sendCommand(tab.id, 'get-state');
      } catch {
        // tabs API unavailable
      }
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
      setNow(Date.now());
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sendCommand]);

  // Tick the countdown display every second while running
  useEffect(() => {
    if (state?.timer.running !== true) {
      return;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.timer.running]);

  // The undo affordance auto-dismisses after a short window
  useEffect(() => {
    if (lastCompleted === null) {
      return;
    }
    const timeout = setTimeout(() => setLastCompleted(null), 8000);
    return () => clearTimeout(timeout);
  }, [lastCompleted]);

  const completeTask = (id: string, title: string): void => {
    if (tabId === null) {
      return;
    }
    setLastCompleted({ id, title });
    void sendCommand(tabId, 'task-complete', id);
  };

  const undoComplete = (): void => {
    if (tabId === null || lastCompleted === null) {
      return;
    }
    void sendCommand(tabId, 'task-uncomplete', lastCompleted.id);
    setLastCompleted(null);
  };

  // Open adalab study: focus the existing tab if there is one, else open it.
  const openStudy = useCallback(() => {
    void (async () => {
      try {
        const tabs = await browser.tabs.query({ url: ADALAB_TAB_PATTERNS });
        const existing = tabs.find((x) => x.id !== undefined);
        if (existing?.id !== undefined) {
          await browser.tabs.update(existing.id, { active: true });
          if (existing.windowId !== undefined) {
            await browser.windows.update(existing.windowId, { focused: true });
          }
        } else {
          await browser.tabs.create({ url: STUDY_URL });
        }
      } catch {
        await browser.tabs.create({ url: STUDY_URL });
      }
    })();
  }, []);

  // No study tab open yet: show a subtle launcher so the link is discoverable.
  if (tabId === null || state === null) {
    return (
      <button
        type="button"
        className="adalab-open-launcher"
        onClick={openStudy}
      >
        <span className="adalab-open-launcher-title">
          {t('popupAdalabTitle')}
        </span>
        <span className="adalab-open-launcher-cta">
          {t('popupAdalabOpen')} ↗
        </span>
      </button>
    );
  }

  const { timer, tasks } = state;
  const phaseLabel =
    timer.phase === 'work'
      ? 'FOCUS'
      : timer.phase === 'short_break'
        ? 'SHORT BREAK'
        : timer.phase === 'long_break'
          ? 'LONG BREAK'
          : 'IDLE';

  return (
    <div className="adalab-widget">
      <div className="adalab-widget-header">
        <button
          type="button"
          className="adalab-widget-title adalab-widget-open"
          onClick={openStudy}
          title={t('popupAdalabOpen')}
        >
          {t('popupAdalabTitle')}
          <span aria-hidden="true"> ↗</span>
        </button>
        <span
          className={`adalab-widget-phase ${timer.running ? 'is-running' : ''}`}
        >
          {phaseLabel}
        </span>
      </div>

      <div className="adalab-widget-timer">
        <span className="adalab-widget-time">
          {timer.running ? formatRemaining(timer.endTime, now) : '--:--'}
        </span>
        {timer.running ? (
          <button
            type="button"
            className="adalab-widget-btn is-stop"
            onClick={() => void sendCommand(tabId, 'timer-stop')}
          >
            {t('popupAdalabStop')}
          </button>
        ) : (
          <button
            type="button"
            className="adalab-widget-btn is-start"
            onClick={() => void sendCommand(tabId, 'timer-start')}
          >
            {t('popupAdalabStart')}
          </button>
        )}
      </div>

      <div className="adalab-widget-tasks">
        <div className="adalab-widget-tasks-title">
          {t('popupAdalabTasksTitle')}
        </div>
        {tasks.length === 0 ? (
          <div className="adalab-widget-no-tasks">
            {t('popupAdalabNoTasks')}
          </div>
        ) : (
          <ul className="adalab-widget-task-list">
            {tasks.map((task) => (
              <li key={task.id} className="adalab-widget-task">
                <button
                  type="button"
                  className="adalab-widget-task-check"
                  title={t('popupAdalabComplete')}
                  aria-label={t('popupAdalabComplete')}
                  onClick={() => completeTask(task.id, task.title)}
                >
                  ✓
                </button>
                <span className="adalab-widget-task-title">{task.title}</span>
              </li>
            ))}
          </ul>
        )}
        {lastCompleted !== null && (
          <div className="adalab-widget-undo">
            <span className="adalab-widget-undo-text">
              {t('popupAdalabCompleted')}: {lastCompleted.title}
            </span>
            <button
              type="button"
              className="adalab-widget-undo-btn"
              onClick={undoComplete}
            >
              {t('popupAdalabUndo')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

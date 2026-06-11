/**
 * adalab study integration E2E
 * Loads the built extension (dist/chrome) in Chromium and verifies:
 *  - timer sync (work / break / idle) is mirrored into the pomodoro state
 *  - popup remote-control commands round-trip through the content bridge
 *  - declarativeNetRequest blocks custom domains before the page loads
 *
 * A tiny local server stands in for the adalab study app, so this suite
 * has no dependency on the adalab repo or external network.
 */

import { test, expect, chromium } from '@playwright/test';
import type { BrowserContext, Page, Worker } from '@playwright/test';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const EXT_PATH = path.resolve(process.cwd(), 'dist', 'chrome');
const APP_PORT = 5173; // the only localhost port the bridge trusts

/** Minimal stand-in for the adalab study app (answers remote commands) */
const FAKE_APP_HTML = `<!doctype html><html><body><h1>fake adalab</h1><script>
  window.addEventListener('message', (event) => {
    const d = event.data;
    if (!d || d.source !== 'shortshield' || d.type !== 'command') return;
    window.postMessage({
      source: 'adalab-study',
      type: 'command-result',
      requestId: d.requestId,
      ok: true,
      payload: {
        timer: { phase: d.action === 'timer-start' ? 'work' : 'idle', running: d.action === 'timer-start', endTime: d.action === 'timer-start' ? Date.now() + 1500000 : null },
        tasks: [{ id: 't1', title: 'E2E task' }],
      },
    }, window.location.origin);
  });
</script></body></html>`;

let server: http.Server;
let context: BrowserContext;
let sw: Worker;
let app: Page;

test.beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(FAKE_APP_HTML);
  });
  await new Promise<void>((resolve) =>
    server.listen(APP_PORT, '127.0.0.1', resolve)
  );

  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'adalab-shield-e2e-')
  );
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
    ],
  });

  sw =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker', { timeout: 15_000 }));

  app = await context.newPage();
  await app.goto(`http://127.0.0.1:${APP_PORT}/`, {
    waitUntil: 'domcontentloaded',
  });
  await app.waitForTimeout(1500); // content script init
});

test.afterAll(async () => {
  await context?.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function getPomodoroState(): Promise<{
  mode: string;
  isRunning: boolean;
} | null> {
  return sw.evaluate(async () => {
    const r = await chrome.storage.local.get('shortshield_pomodoro_state');
    return (
      (r['shortshield_pomodoro_state'] as {
        mode: string;
        isRunning: boolean;
      }) ?? null
    );
  });
}

function postSync(payload: Record<string, unknown>): Promise<void> {
  return app.evaluate((p) => {
    window.postMessage(
      { source: 'adalab-study', type: 'timer-sync', payload: p },
      window.location.origin
    );
  }, payload);
}

test('timer sync mirrors work / break / idle into the pomodoro state', async () => {
  await postSync({
    phase: 'work',
    running: true,
    endTime: Date.now() + 25 * 60_000,
    taskTitle: 'E2E task',
  });
  await app.waitForTimeout(1000);
  let state = await getPomodoroState();
  expect(state?.mode).toBe('work');
  expect(state?.isRunning).toBe(true);

  await postSync({
    phase: 'short_break',
    running: true,
    endTime: Date.now() + 5 * 60_000,
  });
  await app.waitForTimeout(1000);
  state = await getPomodoroState();
  expect(state?.mode).toBe('break');

  await postSync({ phase: 'idle', running: false, endTime: null });
  await app.waitForTimeout(1000);
  state = await getPomodoroState();
  expect(state?.mode).toBe('idle');
  expect(state?.isRunning).toBe(false);
});

test('popup commands round-trip through the content bridge', async () => {
  const send = (action: string) =>
    sw.evaluate(
      async ({ action, port }) => {
        const tabs = await chrome.tabs.query({
          url: [`http://127.0.0.1:${port}/*`],
        });
        if (tabs[0]?.id === undefined)
          return { success: false, error: 'no tab' };
        return chrome.tabs.sendMessage(tabs[0].id, {
          type: 'ADALAB_COMMAND',
          action,
        });
      },
      { action, port: APP_PORT }
    ) as Promise<{
      success: boolean;
      data?: { timer: { phase: string }; tasks: { id: string }[] };
    }>;

  const state = await send('get-state');
  expect(state.success).toBe(true);
  expect(state.data?.tasks[0]?.id).toBe('t1');

  const started = await send('timer-start');
  expect(started.success).toBe(true);
  expect(started.data?.timer.phase).toBe('work');
});

test('declarativeNetRequest blocks custom domains before load', async () => {
  // Enable a custom blocked domain via the regular settings path
  const extId = new URL(sw.url()).hostname;
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extId}/src/popup/index.html`, {
    waitUntil: 'domcontentloaded',
  });
  const updated = await popup.evaluate(async () => {
    return chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      timestamp: Date.now(),
      payload: {
        customDomains: [
          { id: 'e2e-dom', domain: 'example.com', createdAt: Date.now() },
        ],
      },
    });
  });
  expect((updated as { success: boolean }).success).toBe(true);
  await popup.close();
  await app.waitForTimeout(1000); // DNR rules update

  const page = await context.newPage();
  await page
    .goto('http://example.com/', { waitUntil: 'domcontentloaded' })
    .catch(() => undefined);
  await page.waitForTimeout(500);
  expect(page.url()).toContain('blocked.html');
  await expect(page.locator('#title')).toBeVisible();
  await page.close();
});

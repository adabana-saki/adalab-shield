/**
 * declarativeNetRequest dynamic rules
 * Blocks full-site platforms and custom domains at the network layer
 * (before the page loads), redirecting to the extension block page.
 * Rules are lifted during Pomodoro breaks and when blocking is disabled.
 */

import browser from 'webextension-polyfill';
import { getSettings } from './storage';
import { getPomodoroState, getFocusState } from './timers';
import { isScheduleActive } from '@/shared/utils/schedule';
import {
  YOUTUBE_CONFIG,
  INSTAGRAM_CONFIG,
  TIKTOK_CONFIG,
  isProtectedHost,
} from '@/shared/constants';
import type { FullSitePlatform } from '@/shared/types';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('dnr');

const FULLSITE_HOSTS: Record<
  FullSitePlatform,
  { hosts: readonly string[]; displayName: string }
> = {
  youtube_full: { hosts: YOUTUBE_CONFIG.hosts, displayName: 'YouTube' },
  instagram_full: { hosts: INSTAGRAM_CONFIG.hosts, displayName: 'Instagram' },
  tiktok_full: { hosts: TIKTOK_CONFIG.hosts, displayName: 'TikTok' },
};

const RULE_ID_FULLSITE_BASE = 1000;
const RULE_ID_CUSTOM_BASE = 2000;
const MAX_CUSTOM_RULES = 500;

type DnrApi = typeof browser.declarativeNetRequest;

function getDnr(): DnrApi | null {
  try {
    return browser.declarativeNetRequest ?? null;
  } catch {
    return null;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert allowlist patterns into DNR `excludedRequestDomains`.
 * DNR matches a domain and its subdomains automatically, but it has no notion
 * of wildcards, so we keep only plain-domain entries (stripping a leading
 * `*.`). Wildcard/substring patterns are still honoured by the content-script
 * allowlist gate, which is the robust path.
 */
function allowlistToExcludedDomains(allowlist: readonly string[]): string[] {
  const domains = new Set<string>();
  for (const raw of allowlist) {
    const pattern = raw
      .trim()
      .toLowerCase()
      .replace(/^www\./, '');
    if (pattern === '') {
      continue;
    }
    // Accept `*.example.com` → `example.com`; skip any other wildcard form.
    const stripped = pattern.replace(/^\*\./, '');
    if (stripped.includes('*')) {
      continue;
    }
    domains.add(stripped);
  }
  return [...domains];
}

/**
 * Build a redirect rule for a set of hosts
 */
function buildRule(
  id: number,
  hosts: readonly string[],
  displayName: string,
  excludedRequestDomains: readonly string[]
): browser.DeclarativeNetRequest.Rule {
  const hostPattern = hosts.map(escapeRegex).join('|');
  const blockedUrl = browser.runtime.getURL('blocked.html');
  return {
    id,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        regexSubstitution: `${blockedUrl}?p=${encodeURIComponent(displayName)}&u=\\0`,
      },
    },
    condition: {
      regexFilter: `^https?://(${hostPattern})(/.*)?$`,
      resourceTypes: ['main_frame'],
      ...(excludedRequestDomains.length > 0
        ? { excludedRequestDomains: [...excludedRequestDomains] }
        : {}),
    },
  };
}

/**
 * Recompute and apply dynamic blocking rules from the current state
 */
export async function updateDnrRules(): Promise<void> {
  const dnr = getDnr();
  if (!dnr) {
    return; // declarativeNetRequest unavailable on this browser
  }

  try {
    const settings = await getSettings();
    const pomodoro = await getPomodoroState();
    const focus = await getFocusState();

    // A paused break still counts as a break (pausing must not re-block)
    const inBreak = pomodoro.mode === 'break' || pomodoro.mode === 'longBreak';
    // Snooze: all blocking is temporarily paused until snoozeUntil
    const snoozed =
      settings.snoozeUntil !== null && settings.snoozeUntil > Date.now();
    // Focus Mode forces blocking on, even outside scheduled hours
    const focusActive =
      focus.isActive && focus.endTime !== null && focus.endTime > Date.now();
    const blockingActive =
      settings.enabled &&
      !inBreak &&
      !snoozed &&
      (focusActive || isScheduleActive(settings.schedule));

    // When a snooze is active, schedule a one-shot DNR recompute at its expiry
    // so blocking resumes promptly (the 1-min periodic alarm is the backstop).
    if (snoozed && settings.snoozeUntil !== null) {
      const delayMs = settings.snoozeUntil - Date.now();
      if (delayMs > 0 && delayMs < 6 * 60 * 60 * 1000) {
        await browser.alarms.create('shortshield_snooze_end', {
          when: settings.snoozeUntil,
        });
      }
    }

    const desired: browser.DeclarativeNetRequest.Rule[] = [];

    if (blockingActive) {
      // Hosts the user always allows are exempted from every block rule.
      const excludedDomains = allowlistToExcludedDomains(settings.allowlist);

      let fullsiteId = RULE_ID_FULLSITE_BASE;
      for (const [platform, cfg] of Object.entries(FULLSITE_HOSTS) as [
        FullSitePlatform,
        (typeof FULLSITE_HOSTS)[FullSitePlatform],
      ][]) {
        if (settings.platforms[platform]) {
          desired.push(
            buildRule(fullsiteId, cfg.hosts, cfg.displayName, excludedDomains)
          );
        }
        fullsiteId++;
      }

      let customId = RULE_ID_CUSTOM_BASE;
      for (const domain of settings.customDomains.slice(0, MAX_CUSTOM_RULES)) {
        const host = domain.domain.replace(/^www\./, '');
        // Never block protected hosts (e.g. the adalab study app).
        if (isProtectedHost(host)) {
          continue;
        }
        desired.push(
          buildRule(
            customId++,
            [host, `www.${host}`],
            domain.description !== undefined && domain.description !== ''
              ? domain.description
              : host,
            excludedDomains
          )
        );
      }
    }

    const existing = await dnr.getDynamicRules();
    const ownedIds = existing
      .map((r) => r.id)
      .filter(
        (id) =>
          (id >= RULE_ID_FULLSITE_BASE && id < RULE_ID_FULLSITE_BASE + 100) ||
          (id >= RULE_ID_CUSTOM_BASE &&
            id < RULE_ID_CUSTOM_BASE + MAX_CUSTOM_RULES)
      );

    await dnr.updateDynamicRules({
      removeRuleIds: ownedIds,
      addRules: desired,
    });

    logger.info('DNR rules updated', {
      active: blockingActive,
      ruleCount: desired.length,
    });
  } catch (error) {
    logger.error('Failed to update DNR rules', { error: String(error) });
  }
}

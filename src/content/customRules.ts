/**
 * Custom rules engine.
 *
 * Applies user-defined element-hiding rules (CSS selector → hide/blur/remove)
 * on pages whose host matches the rule. Rules are scoped by host pattern using
 * the same wildcard syntax as the allowlist; a rule with no hosts applies
 * everywhere. The engine owns its own MutationObserver so rules keep applying
 * as SPA content streams in, and can fully undo its effects when disabled.
 */

import browser from 'webextension-polyfill';
import type { CustomRule, SelectorRule } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/constants';
import { matchesAllowlistPattern } from '@/shared/utils/allowlist';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('custom-rules');

const HIDDEN_ATTR = 'shortshieldCustomHidden';
const BLURRED_ATTR = 'shortshieldCustomBlurred';

/**
 * True if a rule targets the given hostname.
 */
function ruleMatchesHost(rule: CustomRule, hostname: string): boolean {
  if (rule.hosts === undefined || rule.hosts.length === 0) {
    return true; // applies everywhere
  }
  return rule.hosts.some((pattern) =>
    matchesAllowlistPattern(hostname, pattern)
  );
}

export class CustomRulesEngine {
  private rules: readonly CustomRule[] = [];
  private active = false;
  private observer: MutationObserver | null = null;
  private scheduled = false;

  /**
   * Load custom rules from storage and start watching for changes.
   */
  async init(hostname: string): Promise<void> {
    this.rules = await this.load();
    this.hostname = hostname;
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') {
        return;
      }
      const change = changes[STORAGE_KEYS.CUSTOM_RULES];
      if (change !== undefined) {
        this.rules = (change.newValue as CustomRule[] | undefined) ?? [];
        this.refresh();
      }
    });
    this.refresh();
  }

  private hostname = '';

  /**
   * Enable or disable the engine (e.g. lifted during a Pomodoro break).
   */
  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }
    this.active = active;
    this.refresh();
  }

  private async load(): Promise<readonly CustomRule[]> {
    try {
      const result = await browser.storage.local.get(STORAGE_KEYS.CUSTOM_RULES);
      const stored = result[STORAGE_KEYS.CUSTOM_RULES];
      return Array.isArray(stored) ? (stored as CustomRule[]) : [];
    } catch (error) {
      logger.warn('Failed to load custom rules', { error: String(error) });
      return [];
    }
  }

  /**
   * The rules that apply to this page right now.
   */
  private applicable(): SelectorRule[] {
    return this.rules
      .filter(
        (r) =>
          r.enabled &&
          r.rule.type === 'selector' &&
          ruleMatchesHost(r, this.hostname)
      )
      .map((r) => r.rule as SelectorRule);
  }

  /**
   * Re-evaluate: apply rules and (dis)connect the observer.
   */
  private refresh(): void {
    if (!this.active) {
      this.disconnect();
      this.restoreAll();
      return;
    }

    const rules = this.applicable();
    if (rules.length === 0) {
      this.disconnect();
      this.restoreAll();
      return;
    }

    this.apply(rules);
    this.connect();
  }

  private apply(rules: SelectorRule[]): void {
    for (const rule of rules) {
      let elements: NodeListOf<HTMLElement>;
      try {
        elements = document.querySelectorAll<HTMLElement>(rule.selector);
      } catch {
        // Invalid selector saved somehow — skip rather than throw.
        continue;
      }
      for (const el of elements) {
        this.applyAction(el, rule.action);
      }
    }
  }

  private applyAction(el: HTMLElement, action: SelectorRule['action']): void {
    if (
      el.dataset[HIDDEN_ATTR] === 'true' ||
      el.dataset[BLURRED_ATTR] === 'true'
    ) {
      return;
    }
    switch (action) {
      case 'remove':
      case 'hide':
        el.style.setProperty('display', 'none', 'important');
        el.dataset[HIDDEN_ATTR] = 'true';
        break;
      case 'blur':
        el.style.setProperty('filter', 'blur(10px)', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.dataset[BLURRED_ATTR] = 'true';
        break;
      case 'redirect':
        // Not meaningful at element level; ignored.
        break;
    }
  }

  /**
   * Undo every effect this engine applied (used when disabled).
   */
  private restoreAll(): void {
    document
      .querySelectorAll<HTMLElement>(`[data-shortshield-custom-hidden]`)
      .forEach((el) => {
        el.style.removeProperty('display');
        delete el.dataset[HIDDEN_ATTR];
      });
    document
      .querySelectorAll<HTMLElement>(`[data-shortshield-custom-blurred]`)
      .forEach((el) => {
        el.style.removeProperty('filter');
        el.style.removeProperty('pointer-events');
        delete el.dataset[BLURRED_ATTR];
      });
  }

  private connect(): void {
    if (this.observer !== null) {
      return;
    }
    this.observer = new MutationObserver(() => {
      if (this.scheduled) {
        return;
      }
      this.scheduled = true;
      // Coalesce bursts of mutations into a single pass.
      requestAnimationFrame(() => {
        this.scheduled = false;
        if (this.active) {
          this.apply(this.applicable());
        }
      });
    });
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  private disconnect(): void {
    if (this.observer !== null) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

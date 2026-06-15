/**
 * Custom rules management.
 * Lets the user hide/blur/remove page elements by CSS selector, optionally
 * scoped to specific hosts. Rules are stored separately from settings under
 * STORAGE_KEYS.CUSTOM_RULES and applied by the content-script engine.
 */

import { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import { getCustomRules, saveCustomRules } from '@/shared/utils';
import { isValidSelector } from '@/shared/utils/validation';
import { STORAGE_KEYS, LIMITS } from '@/shared/constants';
import type { CustomRule, BlockingAction } from '@/shared/types';

const ACTIONS: readonly BlockingAction[] = ['hide', 'blur', 'remove'];

function generateId(): string {
  return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Split a comma/space separated host list into normalized patterns. */
function parseHosts(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map(
      (h) =>
        h
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0] ?? ''
    )
    .filter((h) => h !== '');
}

export function CustomRules() {
  const { t } = useI18n();
  const [rules, setRules] = useState<readonly CustomRule[]>([]);
  const [name, setName] = useState('');
  const [hosts, setHosts] = useState('');
  const [selector, setSelector] = useState('');
  const [action, setAction] = useState<BlockingAction>('hide');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setRules(await getCustomRules());
  }, []);

  useEffect(() => {
    void reload();
    const listener = (
      changes: Record<string, browser.Storage.StorageChange>,
      area: string
    ): void => {
      if (
        area === 'local' &&
        changes[STORAGE_KEYS.CUSTOM_RULES] !== undefined
      ) {
        void reload();
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [reload]);

  const persist = async (next: readonly CustomRule[]): Promise<void> => {
    setRules(next);
    await saveCustomRules(next);
  };

  const handleAdd = async (): Promise<void> => {
    const trimmedName = name.trim();
    const trimmedSelector = selector.trim();

    if (trimmedName === '') {
      setError(t('customRulesErrorName'));
      return;
    }
    if (!isValidSelector(trimmedSelector)) {
      setError(t('customRulesErrorSelector'));
      return;
    }
    if (rules.length >= LIMITS.MAX_CUSTOM_RULES) {
      setError(`Maximum ${LIMITS.MAX_CUSTOM_RULES} rules allowed`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const now = Date.now();
      const rule: CustomRule = {
        id: generateId(),
        name: trimmedName,
        enabled: true,
        platform: 'all',
        hosts: parseHosts(hosts),
        rule: {
          type: 'selector',
          selector: trimmedSelector,
          action,
          priority: 1,
        },
        createdAt: now,
        updatedAt: now,
      };
      await persist([...rules, rule]);
      setName('');
      setHosts('');
      setSelector('');
      setAction('hide');
    } catch {
      setError(t('customRulesErrorFailed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (id: string): Promise<void> => {
    await persist(
      rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r
      )
    );
  };

  const removeRule = async (id: string): Promise<void> => {
    await persist(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="custom-domains">
      <h2>{t('customRulesTitle')}</h2>
      <p className="section-description">{t('customRulesDescription')}</p>

      <div className="custom-domains-help">
        <details className="help-details">
          <summary className="help-summary">
            {t('customRulesHelpTitle')}
          </summary>
          <div className="help-content">
            <p className="help-intro">{t('customRulesHelpIntro')}</p>
            <div className="help-examples">
              <div className="help-example">
                <code>#comments</code>
                <span>{t('customRulesExampleId')}</span>
              </div>
              <div className="help-example">
                <code>.ad-banner</code>
                <span>{t('customRulesExampleClass')}</span>
              </div>
            </div>
            <p className="help-tip">{t('customRulesHelpTip')}</p>
          </div>
        </details>
      </div>

      <div className="custom-rule-form">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder={t('customRulesNamePlaceholder')}
          disabled={saving}
          className="domain-input"
        />
        <input
          type="text"
          value={hosts}
          onChange={(e) => setHosts(e.target.value)}
          placeholder={t('customRulesHostsPlaceholder')}
          disabled={saving}
          className="domain-input"
        />
        <input
          type="text"
          value={selector}
          onChange={(e) => {
            setSelector(e.target.value);
            setError(null);
          }}
          placeholder={t('customRulesSelectorPlaceholder')}
          disabled={saving}
          className="domain-input"
        />
        <div className="custom-rule-form-row">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as BlockingAction)}
            disabled={saving}
            className="domain-input"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {t(`customRulesAction_${a}` as 'customRulesAction_hide')}
              </option>
            ))}
          </select>
          <button
            onClick={() => void handleAdd()}
            disabled={saving || name.trim() === '' || selector.trim() === ''}
            className="add-domain-button"
          >
            {saving ? t('customDomainsAdding') : t('customDomainsAdd')}
          </button>
        </div>
      </div>

      {error !== null && error !== '' && (
        <div className="error-message">{error}</div>
      )}

      <div className="domain-list">
        {rules.length === 0 ? (
          <div className="empty-message">{t('customRulesEmpty')}</div>
        ) : (
          rules.map((r) => (
            <div key={r.id} className="domain-item custom-rule-item">
              <label className="custom-rule-toggle">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={() => void toggleRule(r.id)}
                />
                <span className="custom-rule-info">
                  <span className="domain-name">{r.name}</span>
                  <span className="custom-rule-meta">
                    {r.rule.type === 'selector' ? r.rule.selector : ''}
                    {r.hosts !== undefined && r.hosts.length > 0
                      ? ` · ${r.hosts.join(', ')}`
                      : ` · ${t('customRulesAllSites')}`}
                  </span>
                </span>
              </label>
              <button
                onClick={() => void removeRule(r.id)}
                className="remove-button"
                aria-label={t('customDomainsRemove')}
              >
                {t('customDomainsRemove')}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

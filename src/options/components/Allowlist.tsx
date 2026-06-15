/**
 * Allowlist management component.
 * Hosts added here are exempt from ALL blocking — the user's escape hatch for
 * a site they never want touched, regardless of platform/schedule/focus.
 */

import { useState } from 'react';
import { useI18n } from '@/shared/hooks/useI18n';
import { useSettings } from '@/shared/hooks/useSettings';

const MAX_ALLOWLIST = 100;

/**
 * Validate a host pattern (plain host or wildcard form).
 */
function isValidPattern(pattern: string): boolean {
  if (pattern.includes('*')) {
    return (
      pattern.length > 0 && pattern.length <= 253 && /^[\w*.-]+$/i.test(pattern)
    );
  }
  const domainPattern =
    // eslint-disable-next-line security/detect-unsafe-regex -- bounded, validated pattern
    /^(?!-)[\da-z][\da-z-]*[\da-z]?(?:\.(?!-)[\da-z][\da-z-]*[\da-z]?)*$/i;
  return (
    pattern.length > 0 &&
    pattern.length <= 253 &&
    pattern.includes('.') &&
    domainPattern.test(pattern)
  );
}

/**
 * Normalize input into a comparable host pattern.
 */
function normalize(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '');
  value = value.replace(/^www\./, '');
  value = value.split('/')[0] ?? value;
  value = value.split('?')[0] ?? value;
  return value;
}

export function Allowlist() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowlist = settings.allowlist ?? [];

  const handleAdd = async () => {
    const value = normalize(input);

    if (!value) {
      setError(t('allowlistErrorEmpty'));
      return;
    }
    if (!isValidPattern(value)) {
      setError(t('allowlistErrorInvalid'));
      return;
    }
    if (allowlist.some((entry) => entry.toLowerCase() === value)) {
      setError(t('allowlistErrorDuplicate'));
      return;
    }
    if (allowlist.length >= MAX_ALLOWLIST) {
      setError(`Maximum ${MAX_ALLOWLIST} entries allowed`);
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      await updateSettings({ allowlist: [...allowlist, value] });
      setInput('');
    } catch {
      setError(t('allowlistErrorFailed'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (value: string) => {
    try {
      await updateSettings({
        allowlist: allowlist.filter((entry) => entry !== value),
      });
    } catch {
      setError(t('allowlistErrorFailed'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAdding) {
      void handleAdd();
    }
  };

  return (
    <div className="custom-domains">
      <h2>{t('allowlistTitle')}</h2>
      <p className="section-description">{t('allowlistDescription')}</p>

      <div className="custom-domains-help">
        <details className="help-details">
          <summary className="help-summary">{t('allowlistHelpTitle')}</summary>
          <div className="help-content">
            <p className="help-intro">{t('allowlistHelpIntro')}</p>
            <div className="help-examples">
              <div className="help-example">
                <code>example.com</code>
                <span>{t('customDomainsExampleExact')}</span>
              </div>
              <div className="help-example">
                <code>*.example.com</code>
                <span>{t('customDomainsExampleSubdomain')}</span>
              </div>
            </div>
            <p className="help-tip">{t('allowlistHelpTip')}</p>
          </div>
        </details>
      </div>

      <div className="add-domain-form">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('allowlistPlaceholder')}
          disabled={isAdding}
          className="domain-input"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={isAdding || !input.trim()}
          className="add-domain-button"
        >
          {isAdding ? t('customDomainsAdding') : t('customDomainsAdd')}
        </button>
      </div>

      {error !== null && error !== '' && (
        <div className="error-message">{error}</div>
      )}

      <div className="domain-list">
        {allowlist.length === 0 ? (
          <div className="empty-message">{t('allowlistEmpty')}</div>
        ) : (
          allowlist.map((entry) => (
            <div key={entry} className="domain-item">
              <span className="domain-name">{entry}</span>
              <button
                onClick={() => void handleRemove(entry)}
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

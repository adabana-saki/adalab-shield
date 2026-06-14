/**
 * Custom blocked domains management component
 */

import { useState } from 'react';
import { useI18n } from '@/shared/hooks/useI18n';
import { useSettings } from '@/shared/hooks/useSettings';
import type { CustomBlockedDomain, CustomDomainId } from '@/shared/types';
import { LIMITS, isProtectedHost } from '@/shared/constants';

/**
 * Generate a unique ID for custom domains
 */
function generateDomainId(): CustomDomainId {
  return `cd_${Date.now()}_${Math.random().toString(36).slice(2, 11)}` as CustomDomainId;
}

/**
 * Validate domain format (supports wildcards)
 */
function isValidDomain(domain: string): boolean {
  // Allow wildcard patterns
  if (domain.includes('*')) {
    // Wildcard pattern validation
    // Allow patterns like: *.example.com, *example*, example*
    const wildcardPattern = /^[\w*.-]+$/i;
    return (
      domain.length > 0 && domain.length <= 253 && wildcardPattern.test(domain)
    );
  }

  // Basic domain validation - allows domains like example.com, sub.example.com
  const domainPattern =
    // eslint-disable-next-line security/detect-unsafe-regex -- validated pattern
    /^(?!-)[\da-z][\da-z-]*[\da-z]?(?:\.(?!-)[\da-z][\da-z-]*[\da-z]?)*$/i;
  return (
    domain.length > 0 &&
    domain.length <= 253 &&
    domainPattern.test(domain) &&
    domain.includes('.')
  );
}

/**
 * Normalize domain (remove protocol, www, trailing slash)
 */
function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');

  // Remove www.
  domain = domain.replace(/^www\./, '');

  // Remove path and query string
  domain = domain.split('/')[0] ?? domain;
  domain = domain.split('?')[0] ?? domain;

  return domain;
}

export function CustomDomains() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();
  const [domainInput, setDomainInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customDomains = settings.customDomains ?? [];

  const handleAddDomain = async () => {
    const normalizedDomain = normalizeDomain(domainInput);

    // Validate input
    if (!normalizedDomain) {
      setError(t('customDomainsErrorEmpty'));
      return;
    }

    if (!isValidDomain(normalizedDomain)) {
      setError(t('customDomainsErrorInvalid'));
      return;
    }

    // Some hosts must never be blocked (e.g. the adalab study app the
    // extension integrates with).
    if (isProtectedHost(normalizedDomain)) {
      setError(t('customDomainsErrorProtected'));
      return;
    }

    // Check for duplicates
    const isDuplicate = customDomains.some(
      (entry) => entry.domain.toLowerCase() === normalizedDomain
    );
    if (isDuplicate) {
      setError(t('customDomainsErrorDuplicate'));
      return;
    }

    // Check limit
    if (customDomains.length >= LIMITS.MAX_CUSTOM_DOMAINS) {
      setError(`Maximum ${LIMITS.MAX_CUSTOM_DOMAINS} domains allowed`);
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const newDomain: CustomBlockedDomain = {
        id: generateDomainId(),
        domain: normalizedDomain,
        createdAt: Date.now(),
      };

      await updateSettings({
        customDomains: [...customDomains, newDomain],
      });

      setDomainInput('');
    } catch {
      setError(t('customDomainsErrorFailed'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDomain = async (id: CustomDomainId) => {
    try {
      await updateSettings({
        customDomains: customDomains.filter((entry) => entry.id !== id),
      });
    } catch {
      setError(t('customDomainsErrorFailed'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAdding) {
      void handleAddDomain();
    }
  };

  return (
    <div className="custom-domains">
      <h2>{t('customDomainsTitle')}</h2>
      <p className="section-description">{t('customDomainsDescription')}</p>

      {/* Help section with examples */}
      <div className="custom-domains-help">
        <details className="help-details">
          <summary className="help-summary">
            {t('customDomainsHelpTitle')}
          </summary>
          <div className="help-content">
            <p className="help-intro">{t('customDomainsHelpIntro')}</p>
            <div className="help-examples">
              <div className="help-example">
                <code>example.com</code>
                <span>{t('customDomainsExampleExact')}</span>
              </div>
              <div className="help-example">
                <code>*.example.com</code>
                <span>{t('customDomainsExampleSubdomain')}</span>
              </div>
              <div className="help-example">
                <code>*game*</code>
                <span>{t('customDomainsExampleContains')}</span>
              </div>
              <div className="help-example">
                <code>news.*</code>
                <span>{t('customDomainsExampleStartsWith')}</span>
              </div>
            </div>
            <p className="help-tip">{t('customDomainsHelpTip')}</p>
          </div>
        </details>
      </div>

      {/* Add domain form */}
      <div className="add-domain-form">
        <input
          type="text"
          value={domainInput}
          onChange={(e) => {
            setDomainInput(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('customDomainsPlaceholder')}
          disabled={isAdding}
          className="domain-input"
        />
        <button
          onClick={() => void handleAddDomain()}
          disabled={isAdding || !domainInput.trim()}
          className="add-domain-button"
        >
          {isAdding ? t('customDomainsAdding') : t('customDomainsAdd')}
        </button>
      </div>

      {error !== null && error !== '' && (
        <div className="error-message">{error}</div>
      )}

      {/* Domain list */}
      <div className="domain-list">
        {customDomains.length === 0 ? (
          <div className="empty-message">{t('customDomainsEmpty')}</div>
        ) : (
          customDomains.map((entry) => (
            <div key={entry.id} className="domain-item">
              <span className="domain-name">{entry.domain}</span>
              <button
                onClick={() => void handleRemoveDomain(entry.id)}
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

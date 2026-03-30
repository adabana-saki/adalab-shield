/**
 * Block current site button component
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import type { CustomBlockedDomain, CustomDomainId } from '@/shared/types';

interface BlockSiteButtonProps {
  customDomains: readonly CustomBlockedDomain[];
  onDomainsChange: (domains: CustomBlockedDomain[]) => void;
}

export function BlockSiteButton({
  customDomains,
  onDomainsChange,
}: BlockSiteButtonProps) {
  const { t } = useI18n();
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get current tab's domain
  useEffect(() => {
    const getCurrentDomain = async () => {
      try {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs[0];
        if (tab?.url) {
          const url = new URL(tab.url);
          // Only allow blocking http/https sites
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            const domain = url.hostname.replace(/^www\./, '');
            setCurrentDomain(domain);
            // Check if already blocked
            const blocked = customDomains.some((d) => d.domain === domain);
            setIsBlocked(blocked);
          }
        }
      } catch {
        // Ignore errors (e.g., chrome:// pages)
      } finally {
        setIsLoading(false);
      }
    };

    void getCurrentDomain();
  }, [customDomains]);

  const handleToggleBlock = useCallback(() => {
    if (!currentDomain) {
      return;
    }

    setIsLoading(true);
    try {
      if (isBlocked) {
        // Remove from blocked domains
        const newDomains = customDomains.filter(
          (d) => d.domain !== currentDomain
        );
        onDomainsChange([...newDomains]);
        setIsBlocked(false);
      } else {
        // Add to blocked domains
        const newDomain: CustomBlockedDomain = {
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` as CustomDomainId,
          domain: currentDomain,
          createdAt: Date.now(),
          description: t('blockedFromPopup'),
        };
        onDomainsChange([...customDomains, newDomain]);
        setIsBlocked(true);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  }, [currentDomain, isBlocked, customDomains, onDomainsChange, t]);

  // Don't show for non-blockable pages
  if (!currentDomain) {
    return null;
  }

  return (
    <div className="block-site-section">
      <button
        type="button"
        className={`block-site-btn ${isBlocked ? 'blocked' : ''}`}
        onClick={() => void handleToggleBlock()}
        disabled={isLoading}
      >
        {isBlocked ? (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <span>{t('unblockThisSite')}</span>
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            <span>{t('blockThisSite')}</span>
          </>
        )}
      </button>
      <span className="block-site-domain">{currentDomain}</span>
    </div>
  );
}

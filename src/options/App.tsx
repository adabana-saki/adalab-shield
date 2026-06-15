/**
 * Options page main component with sidebar navigation
 */

import { useState } from 'react';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type {
  Platform,
  PlatformSettings,
  ScheduleConfig,
} from '@/shared/types';
import {
  SettingsLayout,
  type SectionId,
  type SubSectionId,
} from './components/layout';
import { Dashboard } from './components/dashboard';
import {
  BlockingSection,
  ScheduleSection,
  ProductivitySection,
  ReportsSection,
  LockSection,
  AdvancedSection,
  HelpSection,
} from './components/sections';
import { OnboardingWizard } from './components/onboarding';
import { TermsOfService, PrivacyPolicy } from './components/legal';

export function App() {
  const { t, isReady: i18nReady } = useI18n();
  const {
    settings,
    isLoading,
    error,
    togglePlatform,
    toggleEnabled,
    refreshSettings,
    updateSettings,
  } = useSettings();

  // Allow deep-linking to the help guide (e.g. from the popup: #help).
  const [activeSection, setActiveSection] = useState<SectionId>(() =>
    window.location.hash === '#help' ? 'help' : 'dashboard'
  );
  const [activeSubSection, setActiveSubSection] = useState<SubSectionId | null>(
    null
  );
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Onboarding completion handler
  const handleOnboardingComplete = (onboardingSettings: {
    platforms: Partial<PlatformSettings>;
    schedule?: Partial<ScheduleConfig>;
  }) => {
    console.debug(
      '[App] handleOnboardingComplete called with:',
      onboardingSettings
    );
    updateSettings({
      platforms: {
        ...settings.platforms,
        ...onboardingSettings.platforms,
      },
      schedule: onboardingSettings.schedule
        ? {
            ...settings.schedule,
            ...onboardingSettings.schedule,
          }
        : settings.schedule,
      onboardingCompleted: true,
    })
      .then(() => {
        console.debug('[App] updateSettings completed successfully');
      })
      .catch((err) => {
        console.error('[App] updateSettings failed:', err);
      });
  };

  const handleSectionChange = (
    section: SectionId,
    subSection?: SubSectionId
  ) => {
    setActiveSection(section);
    setActiveSubSection(subSection ?? null);

    // Auto-expand advanced section when navigating to it
    if (section === 'advanced' && !advancedExpanded) {
      setAdvancedExpanded(true);
    }
    // Auto-expand legal section when navigating to it
    if (section === 'legal') {
      // Legal section uses hasSubmenu, auto-expands itself
    }
  };

  const handleTogglePlatform = (platform: Platform) => {
    void togglePlatform(platform);
  };

  const handleToggleEnabled = () => {
    void toggleEnabled();
  };

  if (isLoading || !i18nReady) {
    return (
      <div className="options-loading">
        <div className="loading-spinner" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  // Lock rejections (commitment lock / lockdown) are NOT fatal errors:
  // show a dismissible banner with a path to unlock, instead of replacing
  // the whole page with a cryptic error code.
  const lockError =
    error === 'SETTINGS_LOCKED_COMMITMENT'
      ? {
          message: t('settingsLockedCommitment'),
          subSection: 'commitmentLock' as SubSectionId,
        }
      : error === 'SETTINGS_LOCKED_LOCKDOWN'
        ? {
            message: t('settingsLockedLockdown'),
            subSection: 'lockdown' as SubSectionId,
          }
        : null;

  if (error !== null && error !== '' && lockError === null) {
    return (
      <div className="options-error">
        <div className="error-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="error-message">{error}</p>
        <button
          type="button"
          className="error-retry"
          onClick={() => void refreshSettings()}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  // Show onboarding wizard for first-time users
  if (!settings.onboardingCompleted) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <Dashboard
            settings={settings}
            onToggleEnabled={handleToggleEnabled}
            onNavigate={handleSectionChange}
          />
        );

      case 'blocking':
        return (
          <BlockingSection
            settings={settings}
            subSection={
              (activeSubSection as
                | 'platforms'
                | 'customDomains'
                | 'allowlist'
                | 'customRules'
                | 'timeLimits') ?? 'platforms'
            }
            onTogglePlatform={handleTogglePlatform}
          />
        );

      case 'schedule':
        return (
          <ScheduleSection
            subSection={
              (activeSubSection as 'scheduleConfig' | 'timeLimits') ??
              'scheduleConfig'
            }
          />
        );

      case 'productivity':
        return (
          <ProductivitySection
            subSection={
              (activeSubSection as 'focusMode' | 'adalabSync') ?? 'focusMode'
            }
          />
        );

      case 'reports':
        return <ReportsSection />;

      case 'help':
        return (
          <HelpSection
            onReplayTour={() => {
              void updateSettings({ onboardingCompleted: false });
            }}
          />
        );

      case 'lock':
        return (
          <LockSection
            subSection={
              (activeSubSection as
                | 'challenge'
                | 'lockdown'
                | 'commitmentLock') ?? 'challenge'
            }
            onNavigate={handleSectionChange}
          />
        );

      case 'advanced':
        return (
          <AdvancedSection
            subSection={
              (activeSubSection as 'appearance' | 'language' | 'backup') ??
              'appearance'
            }
          />
        );

      case 'legal':
        switch (activeSubSection) {
          case 'privacyPolicy':
            return <PrivacyPolicy />;
          case 'termsOfService':
          default:
            return <TermsOfService />;
        }

      default:
        return (
          <Dashboard
            settings={settings}
            onToggleEnabled={handleToggleEnabled}
            onNavigate={handleSectionChange}
          />
        );
    }
  };

  return (
    <SettingsLayout
      activeSection={activeSection}
      activeSubSection={activeSubSection}
      onSectionChange={handleSectionChange}
      advancedExpanded={advancedExpanded}
      onAdvancedToggle={() => setAdvancedExpanded(!advancedExpanded)}
    >
      {lockError !== null && (
        <div className="options-lock-banner">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="options-lock-banner-text">{lockError.message}</span>
          <button
            type="button"
            className="options-lock-banner-btn"
            onClick={() => {
              handleSectionChange('lock', lockError.subSection);
              void refreshSettings();
            }}
          >
            {t('settingsLockedManage')}
          </button>
          <button
            type="button"
            className="options-lock-banner-dismiss"
            aria-label={t('dismiss')}
            onClick={() => void refreshSettings()}
          >
            ✕
          </button>
        </div>
      )}
      {renderContent()}
    </SettingsLayout>
  );
}

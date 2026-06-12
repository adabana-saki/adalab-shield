/**
 * Sidebar navigation component for options page
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SidebarItem } from './SidebarItem';
import { CollapsibleSection } from './CollapsibleSection';

export type SectionId =
  | 'dashboard'
  | 'blocking'
  | 'schedule'
  | 'productivity'
  | 'reports'
  | 'lock'
  | 'advanced'
  | 'legal';

export type SubSectionId =
  | 'platforms'
  | 'customDomains'
  | 'scheduleConfig'
  | 'timeLimits'
  | 'focusMode'
  | 'pomodoro'
  | 'streak'
  | 'challenge'
  | 'lockdown'
  | 'commitmentLock'
  | 'appearance'
  | 'language'
  | 'backup'
  | 'adalabSync'
  | 'termsOfService'
  | 'privacyPolicy';

interface SidebarProps {
  activeSection: SectionId;
  activeSubSection: SubSectionId | null;
  onSectionChange: (section: SectionId, subSection?: SubSectionId) => void;
  advancedExpanded: boolean;
  onAdvancedToggle: () => void;
}

export function Sidebar({
  activeSection,
  activeSubSection,
  onSectionChange,
  advancedExpanded,
  onAdvancedToggle,
}: SidebarProps) {
  const { t } = useI18n();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg
            className="sidebar-logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="sidebar-logo-text">adalab shield</span>
        </div>
      </div>

      <div className="sidebar-content">
        {/* Dashboard */}
        <SidebarItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
          label={t('sidebarDashboard')}
          active={activeSection === 'dashboard'}
          onClick={() => onSectionChange('dashboard')}
        />

        {/* Blocking */}
        <SidebarItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
          label={t('sidebarBlocking')}
          active={activeSection === 'blocking'}
          onClick={() => onSectionChange('blocking', 'platforms')}
          hasSubmenu
          subItems={[
            {
              id: 'platforms',
              label: t('optionsTabPlatforms'),
              active: activeSubSection === 'platforms',
              onClick: () => onSectionChange('blocking', 'platforms'),
            },
            {
              id: 'customDomains',
              label: t('optionsTabCustomDomains'),
              active: activeSubSection === 'customDomains',
              onClick: () => onSectionChange('blocking', 'customDomains'),
            },
          ]}
          expanded={activeSection === 'blocking'}
        />

        {/* Schedule */}
        <SidebarItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          }
          label={t('sidebarSchedule')}
          active={activeSection === 'schedule'}
          onClick={() => onSectionChange('schedule', 'scheduleConfig')}
          hasSubmenu
          subItems={[
            {
              id: 'scheduleConfig',
              label: t('optionsTabSchedule'),
              active: activeSubSection === 'scheduleConfig',
              onClick: () => onSectionChange('schedule', 'scheduleConfig'),
            },
            {
              id: 'timeLimits',
              label: t('timeLimitsTitle'),
              active: activeSubSection === 'timeLimits',
              onClick: () => onSectionChange('schedule', 'timeLimits'),
            },
          ]}
          expanded={activeSection === 'schedule'}
        />

        {/* Productivity */}
        <SidebarItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          }
          label={t('sidebarProductivity')}
          active={activeSection === 'productivity'}
          onClick={() => onSectionChange('productivity', 'focusMode')}
          hasSubmenu
          subItems={[
            {
              id: 'focusMode',
              label: t('focusModeTitle'),
              active: activeSubSection === 'focusMode',
              onClick: () => onSectionChange('productivity', 'focusMode'),
            },
            {
              id: 'pomodoro',
              label: t('pomodoroTitle'),
              active: activeSubSection === 'pomodoro',
              onClick: () => onSectionChange('productivity', 'pomodoro'),
            },
            {
              id: 'streak',
              label: t('optionsTabStreak'),
              active: activeSubSection === 'streak',
              onClick: () => onSectionChange('productivity', 'streak'),
            },
            {
              id: 'adalabSync',
              label: t('optionsTabAdalab'),
              active: activeSubSection === 'adalabSync',
              onClick: () => onSectionChange('productivity', 'adalabSync'),
            },
          ]}
          expanded={activeSection === 'productivity'}
        />

        {/* Reports */}
        <SidebarItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          }
          label={t('sidebarReports')}
          active={activeSection === 'reports'}
          onClick={() => onSectionChange('reports')}
        />

        {/* Lock (anti-bypass) */}
        <SidebarItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          label={t('sidebarLock')}
          active={activeSection === 'lock'}
          onClick={() => onSectionChange('lock', 'challenge')}
          hasSubmenu
          subItems={[
            {
              id: 'challenge',
              label: t('challengeTitle'),
              active: activeSubSection === 'challenge',
              onClick: () => onSectionChange('lock', 'challenge'),
            },
            {
              id: 'lockdown',
              label: t('lockdownTitle'),
              active: activeSubSection === 'lockdown',
              onClick: () => onSectionChange('lock', 'lockdown'),
            },
            {
              id: 'commitmentLock',
              label: t('commitmentLockTitle'),
              active: activeSubSection === 'commitmentLock',
              onClick: () => onSectionChange('lock', 'commitmentLock'),
            },
          ]}
          expanded={activeSection === 'lock'}
        />

        {/* Advanced (Collapsible) */}
        <CollapsibleSection
          title={t('sidebarAdvanced')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
          expanded={advancedExpanded}
          onToggle={onAdvancedToggle}
          active={activeSection === 'advanced'}
        >
          <SidebarItem
            label={t('blockPageTitle')}
            active={activeSubSection === 'appearance'}
            onClick={() => onSectionChange('advanced', 'appearance')}
            nested
          />
          <SidebarItem
            label={t('optionsTabLanguage')}
            active={activeSubSection === 'language'}
            onClick={() => onSectionChange('advanced', 'language')}
            nested
          />
          <SidebarItem
            label={t('optionsTabBackup')}
            active={activeSubSection === 'backup'}
            onClick={() => onSectionChange('advanced', 'backup')}
            nested
          />
        </CollapsibleSection>

        {/* Legal Section */}
        <div className="sidebar-divider" />
        <SidebarItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
          }
          label={t('legalSidebarTitle')}
          active={activeSection === 'legal'}
          onClick={() => onSectionChange('legal', 'termsOfService')}
          hasSubmenu
          subItems={[
            {
              id: 'termsOfService',
              label: t('termsOfServiceTitle'),
              active: activeSubSection === 'termsOfService',
              onClick: () => onSectionChange('legal', 'termsOfService'),
            },
            {
              id: 'privacyPolicy',
              label: t('privacyPolicyTitle'),
              active: activeSubSection === 'privacyPolicy',
              onClick: () => onSectionChange('legal', 'privacyPolicy'),
            },
          ]}
          expanded={activeSection === 'legal'}
        />
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-version">adalab shield v0.2.0</span>
      </div>
    </nav>
  );
}

/**
 * Advanced settings section - Challenge, Lockdown, Appearance, Language, Backup
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SectionHeader } from '../common/SectionHeader';
import { ChallengeSettings } from '../ChallengeSettings';
import { LockdownSettings } from '../LockdownSettings';
import { CommitmentLockSettings } from '../CommitmentLockSettings';
import { BlockPageCustomizer } from '../BlockPageCustomizer';
import { LanguageSettings } from '../LanguageSettings';
import { ExportImport } from '../ExportImport';

type AdvancedSubSection =
  | 'challenge'
  | 'lockdown'
  | 'commitmentLock'
  | 'appearance'
  | 'language'
  | 'backup';

interface AdvancedSectionProps {
  subSection: AdvancedSubSection;
}

export function AdvancedSection({ subSection }: AdvancedSectionProps) {
  const { t } = useI18n();

  if (subSection === 'lockdown') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('lockdownTitle')}
          description={t('lockdownDescription')}
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
        />
        <LockdownSettings />
      </div>
    );
  }

  if (subSection === 'commitmentLock') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('commitmentLockTitle')}
          description={t('commitmentLockDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <rect x="9" y="9" width="6" height="8" rx="1" />
              <path d="M10 9V6a2 2 0 0 1 4 0v3" />
            </svg>
          }
        />
        <CommitmentLockSettings />
      </div>
    );
  }

  if (subSection === 'appearance') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('optionsTabAppearance')}
          description={t('appearanceDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          }
        />
        <BlockPageCustomizer />
      </div>
    );
  }

  if (subSection === 'language') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('optionsTabLanguage')}
          description={t('languageDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        />
        <LanguageSettings />
      </div>
    );
  }

  if (subSection === 'backup') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('optionsTabBackup')}
          description={t('backupDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          }
        />
        <ExportImport />
      </div>
    );
  }

  // Default: challenge
  return (
    <div className="settings-section">
      <SectionHeader
        title={t('challengeTitle')}
        description={t('challengeDescription')}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        }
      />
      <ChallengeSettings />
    </div>
  );
}

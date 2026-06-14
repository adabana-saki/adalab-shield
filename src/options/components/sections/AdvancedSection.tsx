/**
 * Advanced settings section - Block page, Language, Backup
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SectionHeader } from '../common/SectionHeader';
import { BlockPageCustomizer } from '../BlockPageCustomizer';
import { LanguageSettings } from '../LanguageSettings';
import { ExportImport } from '../ExportImport';

type AdvancedSubSection = 'appearance' | 'language' | 'backup';

interface AdvancedSectionProps {
  subSection: AdvancedSubSection;
}

export function AdvancedSection({ subSection }: AdvancedSectionProps) {
  const { t } = useI18n();

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

  // Default: appearance (block page customization)
  return (
    <div className="settings-section">
      <SectionHeader
        title={t('blockPageTitle')}
        description={t('blockPageDescription')}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        }
      />
      <p className="section-hint">{t('blockPageHint')}</p>
      <BlockPageCustomizer />
    </div>
  );
}

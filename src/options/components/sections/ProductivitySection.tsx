/**
 * Productivity settings section - Focus Mode, Pomodoro, adalab sync
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SectionHeader } from '../common/SectionHeader';
import { FocusModeSettings } from '../FocusModeSettings';
import { AdalabSettings } from '../AdalabSettings';

type ProductivitySubSection = 'focusMode' | 'adalabSync';

interface ProductivitySectionProps {
  subSection: ProductivitySubSection;
}

export function ProductivitySection({ subSection }: ProductivitySectionProps) {
  const { t } = useI18n();

  if (subSection === 'adalabSync') {
    return (
      <div className="settings-section">
        <SectionHeader
          title={t('adalabSyncTitle')}
          description={t('adalabSyncDescription')}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <p className="section-hint">{t('adalabSyncHint')}</p>
        <AdalabSettings />
      </div>
    );
  }

  // Default: focusMode
  return (
    <div className="settings-section">
      <SectionHeader
        title={t('focusModeTitle')}
        description={t('focusModeDescription')}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      />
      <p className="section-hint">{t('focusModeHint')}</p>
      <FocusModeSettings />
    </div>
  );
}

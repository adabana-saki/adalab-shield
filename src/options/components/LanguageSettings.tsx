/**
 * Language settings component
 */

import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import { reloadTranslations } from '@/shared/utils/i18n';
import type { SupportedLanguage } from '@/shared/types';

interface LanguageOption {
  value: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'auto', label: 'Auto (Browser)', nativeLabel: 'Auto' },
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { value: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { value: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { value: 'fr', label: 'French', nativeLabel: 'Français' },
  { value: 'ko', label: 'Korean', nativeLabel: '한국어' },
  {
    value: 'pt_BR',
    label: 'Portuguese (Brazil)',
    nativeLabel: 'Português (Brasil)',
  },
  { value: 'zh_CN', label: 'Chinese (Simplified)', nativeLabel: '简体中文' },
  { value: 'zh_TW', label: 'Chinese (Traditional)', nativeLabel: '繁體中文' },
];

export function LanguageSettings() {
  const { t, locale } = useI18n();
  const { settings, updateSettings } = useSettings();

  const handleLanguageChange = async (language: SupportedLanguage) => {
    // Save to settings first
    await updateSettings({
      preferences: {
        ...settings.preferences,
        language,
      },
    });

    // Wait a bit for the throttled storage write to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Reload translations for the new language
    await reloadTranslations(language);

    // Reload the page to apply language changes everywhere
    window.location.reload();
  };

  const currentLanguage = settings.preferences.language ?? 'auto';

  return (
    <div className="language-settings">
      <div className="setting-group">
        <label className="setting-label">{t('languageLabel')}</label>
        <p className="setting-description">{t('languageDescription')}</p>

        <div className="language-selector">
          <select
            className="language-select"
            value={currentLanguage}
            onChange={(e) =>
              void handleLanguageChange(e.target.value as SupportedLanguage)
            }
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.nativeLabel}{' '}
                {option.value !== 'auto' && `(${option.label})`}
              </option>
            ))}
          </select>
        </div>

        {currentLanguage === 'auto' && (
          <p className="language-detected">
            {t('languageDetected')}: <strong>{locale}</strong>
          </p>
        )}
      </div>

      <div className="language-note">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>{t('languageReloadNote')}</p>
      </div>
    </div>
  );
}

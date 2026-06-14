/**
 * Help section — a plain-language guide to the main features, plus a button
 * to replay the intro tour. Reuses existing strings where possible so the
 * guide stays in sync with the actual feature descriptions.
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SectionHeader } from '../common/SectionHeader';

interface HelpSectionProps {
  onReplayTour: () => void;
}

export function HelpSection({ onReplayTour }: HelpSectionProps) {
  const { t } = useI18n();

  const features: { title: string; desc: string }[] = [
    { title: t('sidebarBlocking'), desc: t('onboardingFeature1') },
    { title: t('focusModeTitle'), desc: t('focusModeDescription') },
    { title: t('sidebarSchedule'), desc: t('scheduleDescription') },
    {
      title: t('commitmentLockTitle'),
      desc: t('commitmentLockEnabledDescription'),
    },
    { title: t('optionsTabAdalab'), desc: t('adalabSyncDescription') },
  ];

  return (
    <div className="settings-section">
      <SectionHeader
        title={t('helpTitle')}
        description={t('helpIntro')}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        }
      />

      <div className="help-features">
        {features.map((f) => (
          <div className="help-feature" key={f.title}>
            <h3 className="help-feature-title">{f.title}</h3>
            <p className="help-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="help-replay">
        <div className="help-replay-text">
          <h3 className="help-feature-title">{t('helpReplayTour')}</h3>
          <p className="help-feature-desc">{t('helpReplayTourDesc')}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onReplayTour}
        >
          {t('helpReplayTour')}
        </button>
      </div>
    </div>
  );
}

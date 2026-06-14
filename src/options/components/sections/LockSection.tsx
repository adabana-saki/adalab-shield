/**
 * Lock settings section - friction features that make blocking hard to bypass.
 * Challenge: solve a quiz to bypass a block page
 * Lockdown: protect settings with a PIN
 * Commitment Lock: friction (wait / intention / challenges) before disabling
 */

import { useI18n } from '@/shared/hooks/useI18n';
import type { SectionId, SubSectionId } from '../layout';
import { SectionHeader } from '../common/SectionHeader';
import { ChallengeSettings } from '../ChallengeSettings';
import { LockdownSettings } from '../LockdownSettings';
import { CommitmentLockSettings } from '../CommitmentLockSettings';

type LockSubSection = 'challenge' | 'lockdown' | 'commitmentLock';

interface LockSectionProps {
  subSection: LockSubSection;
  onNavigate: (section: SectionId, subSection?: SubSectionId) => void;
}

/**
 * Comparison strip so users can tell the three lock features apart at a
 * glance — and switch between them by clicking, without going back to the
 * sidebar.
 */
function LockOverview({
  active,
  onNavigate,
}: {
  active: LockSubSection;
  onNavigate: (section: SectionId, subSection?: SubSectionId) => void;
}) {
  const { t } = useI18n();
  const items: { id: LockSubSection; title: string; desc: string }[] = [
    {
      id: 'challenge',
      title: t('challengeTitle'),
      desc: t('challengeDescription'),
    },
    {
      id: 'lockdown',
      title: t('lockdownTitle'),
      desc: t('lockdownDescription'),
    },
    {
      id: 'commitmentLock',
      title: t('commitmentLockTitle'),
      desc: t('commitmentLockDescription'),
    },
  ];

  return (
    <div className="lock-overview">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`lock-overview-card ${active === item.id ? 'active' : ''}`}
          onClick={() => onNavigate('lock', item.id)}
          aria-pressed={active === item.id}
        >
          <span className="lock-overview-title">{item.title}</span>
          <span className="lock-overview-desc">{item.desc}</span>
        </button>
      ))}
    </div>
  );
}

export function LockSection({ subSection, onNavigate }: LockSectionProps) {
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
        <LockOverview active="lockdown" onNavigate={onNavigate} />
        <p className="lock-help-callout">{t('lockdownHelp')}</p>
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
        <LockOverview active="commitmentLock" onNavigate={onNavigate} />
        <p className="lock-help-callout">{t('commitmentLockHelp')}</p>
        <CommitmentLockSettings />
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
      <LockOverview active="challenge" onNavigate={onNavigate} />
      <p className="lock-help-callout">{t('challengeHelp')}</p>
      <ChallengeSettings />
    </div>
  );
}

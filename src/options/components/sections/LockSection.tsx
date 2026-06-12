/**
 * Lock settings section - friction features that make blocking hard to bypass.
 * Challenge: solve a quiz to bypass a block page
 * Lockdown: protect settings with a PIN
 * Commitment Lock: friction (wait / intention / challenges) before disabling
 */

import { useI18n } from '@/shared/hooks/useI18n';
import { SectionHeader } from '../common/SectionHeader';
import { ChallengeSettings } from '../ChallengeSettings';
import { LockdownSettings } from '../LockdownSettings';
import { CommitmentLockSettings } from '../CommitmentLockSettings';

type LockSubSection = 'challenge' | 'lockdown' | 'commitmentLock';

interface LockSectionProps {
  subSection: LockSubSection;
}

export function LockSection({ subSection }: LockSectionProps) {
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

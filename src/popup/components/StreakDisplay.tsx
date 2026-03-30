/**
 * Streak display component for popup
 * Shows current streak, longest streak, and milestones
 */

import type { StreakData } from '@/shared/types';
import { useI18n } from '@/shared/hooks/useI18n';
import { STREAK_MILESTONES } from '@/shared/constants';

interface StreakDisplayProps {
  readonly streakData: StreakData;
}

export function StreakDisplay({ streakData }: StreakDisplayProps) {
  const { t } = useI18n();

  const { currentStreak, longestStreak, totalFocusDays, achievedMilestones } =
    streakData;

  // Find next milestone
  const nextMilestone =
    STREAK_MILESTONES.find((m) => m > currentStreak) ?? null;
  const progressToNext = nextMilestone
    ? Math.min(100, (currentStreak / nextMilestone) * 100)
    : 100;

  return (
    <div className="streak-display">
      {/* Main streak counter */}
      <div className="streak-main">
        <div className="streak-flame">
          <svg
            viewBox="0 0 24 24"
            className={`streak-icon ${currentStreak > 0 ? 'active' : ''}`}
            fill="currentColor"
          >
            <path d="M12 23c-3.59 0-6.5-2.91-6.5-6.5 0-2.52 1.4-4.77 3.5-6.03v-5.4c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5.4c2.1 1.26 3.5 3.51 3.5 6.03 0 3.59-2.91 6.5-6.5 6.5zm0-11.5c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z" />
          </svg>
        </div>
        <div className="streak-count">
          <span className="streak-number">{currentStreak}</span>
          <span className="streak-label">{t('streakDays')}</span>
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && currentStreak > 0 && (
        <div className="streak-progress">
          <div className="streak-progress-bar">
            <div
              className="streak-progress-fill"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <span className="streak-progress-label">
            {currentStreak} / {nextMilestone} {t('streakToMilestone')}
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-stat-value">{longestStreak}</span>
          <span className="streak-stat-label">{t('streakLongest')}</span>
        </div>
        <div className="streak-stat">
          <span className="streak-stat-value">{totalFocusDays}</span>
          <span className="streak-stat-label">{t('streakTotalDays')}</span>
        </div>
      </div>

      {/* Achieved milestones */}
      {achievedMilestones.length > 0 && (
        <div className="streak-milestones">
          <span className="streak-milestones-label">
            {t('streakMilestones')}
          </span>
          <div className="streak-milestone-badges">
            {achievedMilestones.map((milestone) => (
              <span key={milestone} className="streak-milestone-badge">
                {milestone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Snooze control — temporarily pause all blocking for a short window.
 * Shows quick-duration buttons when idle, or a live countdown with a cancel
 * action while a snooze is active.
 */

import { useI18n } from '@/shared/hooks/useI18n';

const SNOOZE_OPTIONS_MIN = [5, 15, 30] as const;

interface SnoozeControlProps {
  enabled: boolean;
  snoozeUntil: number | null;
  now: number;
  onSnooze: (minutes: number) => void;
  onCancel: () => void;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SnoozeControl({
  enabled,
  snoozeUntil,
  now,
  onSnooze,
  onCancel,
}: SnoozeControlProps) {
  const { t } = useI18n();

  const active = snoozeUntil !== null && snoozeUntil > now;

  // Nothing to pause when blocking is already off and no snooze is running.
  if (!enabled && !active) {
    return null;
  }

  if (active && snoozeUntil !== null) {
    return (
      <div className="snooze-control is-active">
        <div className="snooze-active-info">
          <span className="snooze-active-label">{t('snoozeActiveLabel')}</span>
          <span className="snooze-active-time">
            {formatRemaining(snoozeUntil - now)}
          </span>
        </div>
        <button type="button" className="snooze-cancel-btn" onClick={onCancel}>
          {t('snoozeResume')}
        </button>
      </div>
    );
  }

  return (
    <div className="snooze-control">
      <span className="snooze-label">{t('snoozeLabel')}</span>
      <div className="snooze-buttons">
        {SNOOZE_OPTIONS_MIN.map((min) => (
          <button
            key={min}
            type="button"
            className="snooze-btn"
            onClick={() => onSnooze(min)}
          >
            {min}
            {t('minutesShort')}
          </button>
        ))}
      </div>
    </div>
  );
}

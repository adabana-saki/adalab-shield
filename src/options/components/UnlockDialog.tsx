/**
 * Unlock dialog for Commitment Lock — intentionally a single, minimal screen.
 *
 * The lock is just a speed bump: to weaken protection you must wait a few
 * seconds and then confirm. There is no multi-step flow, no intention essay,
 * no challenges and no cooldown — those proved confusing and easy to get
 * trapped by. Waiting a moment is enough to stop a purely impulsive unlock.
 */

import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';

interface UnlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export function UnlockDialog({
  isOpen,
  onClose,
  onUnlockSuccess,
}: UnlockDialogProps) {
  const { settings } = useSettings();
  const { t } = useI18n();

  const waitSeconds = settings.commitmentLock.confirmationWaitSeconds || 10;

  const [secondsRemaining, setSecondsRemaining] = useState(waitSeconds);
  const [isReady, setIsReady] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This component is mounted only while open (see parent), so the effect
  // runs once per unlock attempt: kick off the backend flow (the unlock
  // window opens on confirm) and run a simple local countdown.
  useEffect(() => {
    void (async () => {
      try {
        const res: { success: boolean; error?: string } =
          await browser.runtime.sendMessage({
            type: 'COMMITMENT_LOCK_START_UNLOCK',
            timestamp: Date.now(),
          });
        if (res.success === false) {
          setError(res.error ?? t('commitmentLockNotAllowed'));
        }
      } catch (err) {
        console.error('Failed to start unlock:', err);
        setError(t('commitmentLockErrorStart'));
      }
    })();

    const id = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [t]);

  const confirmUnlock = async () => {
    setIsConfirming(true);
    setError(null);
    try {
      const res: { success: boolean; error?: string } =
        await browser.runtime.sendMessage({
          type: 'COMMITMENT_LOCK_CONFIRM_UNLOCK',
          timestamp: Date.now(),
        });
      if (res.success === true) {
        onUnlockSuccess();
      } else {
        setError(res.error ?? t('commitmentLockErrorConfirm'));
        setIsConfirming(false);
      }
    } catch (err) {
      console.error('Failed to confirm unlock:', err);
      setError(t('commitmentLockErrorConfirm'));
      setIsConfirming(false);
    }
  };

  const cancel = async () => {
    try {
      await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_CANCEL_UNLOCK',
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Failed to cancel unlock:', err);
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="unlock-dialog-overlay" onClick={() => void cancel()}>
      <div className="unlock-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="unlock-dialog-header">
          <h2>{t('commitmentLockUnlockTitle')}</h2>
          <button
            type="button"
            className="close-button"
            onClick={() => void cancel()}
            aria-label={t('close')}
          >
            &times;
          </button>
        </div>

        <div className="unlock-dialog-content">
          <div className="unlock-step final-step">
            <p className="unlock-question">{t('commitmentLockAreYouSure')}</p>

            {!isReady && error === null && (
              <div className="unlock-countdown">
                <span className="unlock-countdown-num">{secondsRemaining}</span>
                <p className="unlock-countdown-label">
                  {t('commitmentLockWaiting')}
                </p>
              </div>
            )}

            {error !== null && <p className="error-message">{error}</p>}

            <div className="unlock-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void cancel()}
              >
                {t('goBack')}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void confirmUnlock()}
                disabled={!isReady || isConfirming || error !== null}
              >
                {isConfirming
                  ? t('loading')
                  : isReady
                    ? t('commitmentLockConfirmUnlock')
                    : `${secondsRemaining} ${t('seconds')}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

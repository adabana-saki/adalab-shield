/**
 * Unlock Dialog component for Commitment Lock
 * Implements the multi-step unlock flow with friction layers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type {
  UnlockFlowStep,
  CommitmentLockState,
  UnlockCheckResult,
  ChallengeData,
} from '@/shared/types';

interface UnlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

// Motivational quotes to show during wait period
const MOTIVATIONAL_QUOTES = [
  'The ability to concentrate is the ability to prevent distraction.',
  'What you do today determines who you become tomorrow.',
  'Discipline is choosing between what you want now and what you want most.',
  'Small steps every day lead to big changes over time.',
  'The secret of getting ahead is getting started.',
];

export function UnlockDialog({
  isOpen,
  onClose,
  onUnlockSuccess,
}: UnlockDialogProps) {
  const { settings } = useSettings();
  const { t } = useI18n();

  // Flow state
  const [step, setStep] = useState<UnlockFlowStep>('initial');
  const [waitSecondsRemaining, setWaitSecondsRemaining] = useState(0);
  const [intentionText, setIntentionText] = useState('');
  const [challengeProgress, setChallengeProgress] = useState({
    current: 0,
    total: 0,
    correctCount: 0,
  });
  const [currentChallenge, setCurrentChallenge] =
    useState<ChallengeData | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lockState, setLockState] = useState<CommitmentLockState | null>(null);
  const [quote, setQuote] = useState('');

  // Timer ref for countdown
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize quote on mount
  useEffect(() => {
    setQuote(
      MOTIVATIONAL_QUOTES[
        Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
      ] ??
        MOTIVATIONAL_QUOTES[0] ??
        ''
    );
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const checkUnlockAllowed = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: {
        success: boolean;
        data?: UnlockCheckResult;
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_CHECK_UNLOCK',
        timestamp: Date.now(),
      });

      if (response.success === true && response.data !== null) {
        if (!response.data.allowed) {
          setError(
            t(`commitmentLockError_${response.data.reason}`) ||
              response.data.message ||
              t('commitmentLockNotAllowed')
          );
          setStep('failed');
        }
      }

      // Also get current state
      const stateResponse: {
        success: boolean;
        data?: CommitmentLockState;
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_GET_STATE',
        timestamp: Date.now(),
      });

      if (stateResponse.success === true && stateResponse.data !== null) {
        setLockState(stateResponse.data);
      }
    } catch (err) {
      console.error('Failed to check unlock:', err);
      setError(t('commitmentLockErrorCheck'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setWaitSecondsRemaining(0);
      setIntentionText('');
      setChallengeProgress({ current: 0, total: 0, correctCount: 0 });
      setCurrentChallenge(null);
      setChallengeAnswer('');
      setError(null);
      setQuote(
        MOTIVATIONAL_QUOTES[
          Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
        ] ?? ''
      );
      void checkUnlockAllowed();
    }
  }, [isOpen, checkUnlockAllowed]);

  const requestChallenge = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setChallengeAnswer('');

    try {
      const response: {
        success: boolean;
        data?: ChallengeData;
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_REQUEST_CHALLENGE',
        timestamp: Date.now(),
      });

      if (response.success === true && response.data !== null) {
        setCurrentChallenge(response.data);
        setChallengeProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
          total: settings.commitmentLock.challengeCount,
        }));
        setStep('challenges');
      } else {
        setError(response.error || t('commitmentLockErrorChallenge'));
      }
    } catch (err) {
      console.error('Failed to request challenge:', err);
      setError(t('commitmentLockErrorChallenge'));
    } finally {
      setIsLoading(false);
    }
  }, [settings.commitmentLock.challengeCount, t]);

  // Countdown timer effect
  useEffect(() => {
    if (step === 'waiting' && waitSecondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setWaitSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            // Move to next step based on level
            if (settings.commitmentLock.requireIntentionStatement) {
              setStep('intention');
            } else if (settings.commitmentLock.level >= 2) {
              void requestChallenge();
            } else {
              setStep('final_confirm');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
    return undefined;
  }, [step, waitSecondsRemaining, settings.commitmentLock, requestChallenge]);

  const startUnlock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: {
        success: boolean;
        data?: { waitSecondsRemaining: number; state: CommitmentLockState };
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_START_UNLOCK',
        timestamp: Date.now(),
      });

      if (response.success === true && response.data !== null) {
        setWaitSecondsRemaining(
          response.data.waitSecondsRemaining ||
            settings.commitmentLock.confirmationWaitSeconds
        );
        setLockState(response.data.state);
        setStep('waiting');
      } else {
        setError(response.error || t('commitmentLockErrorStart'));
      }
    } catch (err) {
      console.error('Failed to start unlock:', err);
      setError(t('commitmentLockErrorStart'));
    } finally {
      setIsLoading(false);
    }
  };

  const submitIntention = async () => {
    if (intentionText.length < settings.commitmentLock.intentionMinLength) {
      setError(
        t('commitmentLockIntentionTooShort', [
          settings.commitmentLock.intentionMinLength.toString(),
        ])
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: { success: boolean; data?: unknown; error?: string } =
        await browser.runtime.sendMessage({
          type: 'COMMITMENT_LOCK_SUBMIT_INTENTION',
          timestamp: Date.now(),
          payload: { intention: intentionText },
        });

      if (response.success === true) {
        // Move to challenges if Level 2+, otherwise final confirm
        if (settings.commitmentLock.level >= 2) {
          await requestChallenge();
        } else {
          setStep('final_confirm');
        }
      } else {
        setError(response.error || t('commitmentLockErrorIntention'));
      }
    } catch (err) {
      console.error('Failed to submit intention:', err);
      setError(t('commitmentLockErrorIntention'));
    } finally {
      setIsLoading(false);
    }
  };

  const submitChallenge = async () => {
    if (!challengeAnswer.trim()) {
      setError(t('commitmentLockAnswerRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: {
        success: boolean;
        data?: {
          correct: boolean;
          allCompleted: boolean;
          nextChallenge?: ChallengeData;
          state: CommitmentLockState;
        };
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_SUBMIT_CHALLENGE',
        timestamp: Date.now(),
        payload: { answer: challengeAnswer },
      });

      if (response.success === true && response.data !== null) {
        setLockState(response.data.state);

        if (response.data.correct) {
          setChallengeProgress((prev) => ({
            ...prev,
            correctCount: prev.correctCount + 1,
          }));

          if (response.data.allCompleted) {
            setStep('final_confirm');
          } else if (response.data.nextChallenge !== undefined) {
            setCurrentChallenge(response.data.nextChallenge);
            setChallengeAnswer('');
            setChallengeProgress((prev) => ({
              ...prev,
              current: prev.current + 1,
            }));
          }
        } else {
          // Wrong answer
          if (settings.commitmentLock.challengesMustBeConsecutive) {
            // Reset progress
            setChallengeProgress({
              current: 0,
              total: settings.commitmentLock.challengeCount,
              correctCount: 0,
            });
            setError(t('commitmentLockWrongAnswerReset'));
            // Start over with new challenge
            await requestChallenge();
          } else {
            setError(t('commitmentLockWrongAnswer'));
            setChallengeAnswer('');
            // Get next challenge
            if (response.data.nextChallenge !== undefined) {
              setCurrentChallenge(response.data.nextChallenge);
              setChallengeProgress((prev) => ({
                ...prev,
                current: prev.current + 1,
              }));
            }
          }
        }
      } else {
        setError(response.error || t('commitmentLockErrorSubmit'));
      }
    } catch (err) {
      console.error('Failed to submit challenge:', err);
      setError(t('commitmentLockErrorSubmit'));
    } finally {
      setIsLoading(false);
    }
  };

  const confirmUnlock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: {
        success: boolean;
        data?: CommitmentLockState;
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'COMMITMENT_LOCK_CONFIRM_UNLOCK',
        timestamp: Date.now(),
      });

      if (response.success === true) {
        setStep('completed');
        setTimeout(() => {
          onUnlockSuccess();
        }, 1500);
      } else {
        setError(response.error || t('commitmentLockErrorConfirm'));
      }
    } catch (err) {
      console.error('Failed to confirm unlock:', err);
      setError(t('commitmentLockErrorConfirm'));
    } finally {
      setIsLoading(false);
    }
  };

  const cancelUnlock = async () => {
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

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="unlock-dialog-overlay" onClick={() => void cancelUnlock()}>
      <div className="unlock-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="unlock-dialog-header">
          <h2>{t('commitmentLockUnlockTitle')}</h2>
          <button
            type="button"
            className="close-button"
            onClick={() => void cancelUnlock()}
            aria-label={t('close')}
          >
            &times;
          </button>
        </div>

        <div className="unlock-dialog-content">
          {/* Warning banner */}
          {lockState &&
            lockState.todayAttempts >=
              (settings.commitmentLock.dailyAttemptWarningThreshold || 3) && (
              <div className="warning-banner">
                <span className="warning-icon">!</span>
                <p>
                  {t('commitmentLockManyAttempts', [
                    lockState.todayAttempts.toString(),
                  ])}
                </p>
              </div>
            )}

          {/* Initial step */}
          {step === 'initial' && (
            <div className="unlock-step initial-step">
              <p className="unlock-question">{t('commitmentLockAreYouSure')}</p>
              <p className="unlock-explanation">
                {t('commitmentLockExplanation', [
                  settings.commitmentLock.level.toString(),
                ])}
              </p>

              <div className="unlock-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void cancelUnlock()}
                >
                  {t('goBack')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void startUnlock()}
                  disabled={isLoading}
                >
                  {isLoading ? t('loading') : t('continue')}
                </button>
              </div>
            </div>
          )}

          {/* Waiting step */}
          {step === 'waiting' && (
            <div className="unlock-step waiting-step">
              <div className="quote-box">
                <p className="quote-text">&ldquo;{quote}&rdquo;</p>
              </div>

              <div className="countdown-display">
                <div className="countdown-circle">
                  <span className="countdown-time">
                    {formatTime(waitSecondsRemaining)}
                  </span>
                </div>
                <p className="countdown-label">{t('commitmentLockWaiting')}</p>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((settings.commitmentLock.confirmationWaitSeconds - waitSecondsRemaining) / settings.commitmentLock.confirmationWaitSeconds) * 100}%`,
                  }}
                />
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void cancelUnlock()}
              >
                {t('cancel')}
              </button>
            </div>
          )}

          {/* Intention step */}
          {step === 'intention' && (
            <div className="unlock-step intention-step">
              <h3>{t('commitmentLockIntentionTitle')}</h3>
              <p className="intention-prompt">
                {t('commitmentLockIntentionPrompt')}
              </p>

              <textarea
                className="intention-input"
                value={intentionText}
                onChange={(e) => setIntentionText(e.target.value)}
                placeholder={t('commitmentLockIntentionPlaceholder')}
                rows={4}
              />

              <p className="character-count">
                {intentionText.length} /{' '}
                {settings.commitmentLock.intentionMinLength} {t('characters')}
                {intentionText.length <
                  settings.commitmentLock.intentionMinLength && (
                  <span className="count-warning">
                    (
                    {settings.commitmentLock.intentionMinLength -
                      intentionText.length}{' '}
                    {t('more')})
                  </span>
                )}
              </p>

              {error && <p className="error-message">{error}</p>}

              <div className="unlock-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void cancelUnlock()}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void submitIntention()}
                  disabled={
                    isLoading ||
                    intentionText.length <
                      settings.commitmentLock.intentionMinLength
                  }
                >
                  {isLoading ? t('loading') : t('continue')}
                </button>
              </div>
            </div>
          )}

          {/* Challenges step */}
          {step === 'challenges' && currentChallenge && (
            <div className="unlock-step challenges-step">
              <div className="challenge-progress">
                <span>
                  {t('commitmentLockChallengeProgress', [
                    challengeProgress.current.toString(),
                    challengeProgress.total.toString(),
                  ])}
                </span>
                <div className="progress-dots">
                  {Array.from({ length: challengeProgress.total }).map(
                    (_, i) => (
                      <span
                        key={i}
                        className={`dot ${i < challengeProgress.correctCount ? 'completed' : i === challengeProgress.correctCount ? 'current' : ''}`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="challenge-box">
                <p className="challenge-question">
                  {currentChallenge.question}
                </p>
                <input
                  type="text"
                  className="challenge-input"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  placeholder={t('commitmentLockAnswerPlaceholder')}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && challengeAnswer.trim()) {
                      void submitChallenge();
                    }
                  }}
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="unlock-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void cancelUnlock()}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void submitChallenge()}
                  disabled={isLoading || !challengeAnswer.trim()}
                >
                  {isLoading ? t('loading') : t('submit')}
                </button>
              </div>
            </div>
          )}

          {/* Final confirm step */}
          {step === 'final_confirm' && (
            <div className="unlock-step final-step">
              <div className="success-icon">&#10003;</div>
              <h3>{t('commitmentLockFinalConfirmTitle')}</h3>
              <p>{t('commitmentLockFinalConfirmMessage')}</p>

              {error && <p className="error-message">{error}</p>}

              <div className="unlock-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void cancelUnlock()}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void confirmUnlock()}
                  disabled={isLoading}
                >
                  {isLoading ? t('loading') : t('commitmentLockConfirmUnlock')}
                </button>
              </div>
            </div>
          )}

          {/* Completed step */}
          {step === 'completed' && (
            <div className="unlock-step completed-step">
              <div className="success-icon large">&#10003;</div>
              <h3>{t('commitmentLockUnlockSuccess')}</h3>
              <p>
                {t('commitmentLockCooldownStarted', [
                  settings.commitmentLock.cooldownAfterUnlockMinutes.toString(),
                ])}
              </p>
            </div>
          )}

          {/* Failed step */}
          {step === 'failed' && (
            <div className="unlock-step failed-step">
              <div className="error-icon">&#10007;</div>
              <h3>{t('commitmentLockUnlockFailed')}</h3>
              <p className="error-message">{error}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                {t('close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

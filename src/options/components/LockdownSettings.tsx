/**
 * Lockdown mode settings component for options page
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type { LockdownState, EmergencyBypassCheckResult } from '@/shared/types';
import { isValidPinFormat } from '@/shared/utils/crypto';

export function LockdownSettings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  // Local state
  const [lockdownState, setLockdownState] = useState<LockdownState | null>(
    null
  );
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [activatePin, setActivatePin] = useState('');
  const [deactivatePin, setDeactivatePin] = useState('');
  const [activateError, setActivateError] = useState<string | null>(null);
  const [bypassStatus, setBypassStatus] =
    useState<EmergencyBypassCheckResult | null>(null);
  const [bypassCountdown, setBypassCountdown] = useState<number | null>(null);

  // Check if PIN is set
  const hasPinSet = settings.lockdown.pinHash !== null;

  const checkEmergencyBypassStatus = useCallback(async () => {
    try {
      const response: { success: boolean; data?: EmergencyBypassCheckResult } =
        await browser.runtime.sendMessage({
          type: 'LOCKDOWN_CHECK_EMERGENCY_BYPASS',
        });

      if (response.success && response.data) {
        setBypassStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to check emergency bypass:', error);
    }
  }, []);

  const loadLockdownState = useCallback(async () => {
    try {
      const response: { success: boolean; data?: LockdownState } =
        await browser.runtime.sendMessage({
          type: 'LOCKDOWN_GET_STATE',
        });

      if (response.success && response.data) {
        setLockdownState(response.data);

        // If lockdown is active, check bypass status
        if (response.data.isActive) {
          await checkEmergencyBypassStatus();
        }
      }
    } catch (error) {
      console.error('Failed to load lockdown state:', error);
    }
  }, [checkEmergencyBypassStatus]);

  // Load lockdown state on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await loadLockdownState();
    };
    if (!cancelled) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [loadLockdownState]);

  // Initialize countdown when bypass status changes
  useEffect(() => {
    if (
      bypassStatus?.requested &&
      !bypassStatus.ready &&
      bypassStatus.remainingSeconds > 0
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing derived countdown state from bypass status
      setBypassCountdown(bypassStatus.remainingSeconds);
    }
  }, [bypassStatus]);

  // Countdown timer for emergency bypass
  useEffect(() => {
    if (
      !bypassStatus?.requested ||
      bypassStatus.ready ||
      bypassStatus.remainingSeconds <= 0
    ) {
      return;
    }

    const interval = setInterval(() => {
      setBypassCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          void checkEmergencyBypassStatus();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bypassStatus, checkEmergencyBypassStatus]);

  const handleToggleEnabled = async () => {
    await updateSettings({
      lockdown: {
        enabled: !settings.lockdown.enabled,
      },
    });
  };

  const handleEmergencyBypassMinutesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && minutes >= 1 && minutes <= 1440) {
      await updateSettings({
        lockdown: {
          emergencyBypassMinutes: minutes,
        },
      });
    }
  };

  const handleSetPin = async () => {
    setPinError(null);
    setPinSuccess(null);

    // Validate new PIN format
    if (!isValidPinFormat(newPin)) {
      setPinError(t('lockdownPinInvalidFormat'));
      return;
    }

    // Check confirmation matches
    if (newPin !== confirmPin) {
      setPinError(t('lockdownPinMismatch'));
      return;
    }

    // If changing PIN, current PIN is required
    if (hasPinSet && !currentPin) {
      setPinError(t('lockdownCurrentPinRequired'));
      return;
    }

    try {
      const response: { success: boolean; error?: string } =
        await browser.runtime.sendMessage({
          type: 'LOCKDOWN_SET_PIN',
          payload: {
            pin: newPin,
            currentPin: hasPinSet ? currentPin : undefined,
          },
        });

      if (response.success) {
        setPinSuccess(t('lockdownPinSaved'));
        setNewPin('');
        setConfirmPin('');
        setCurrentPin('');
      } else {
        setPinError(response.error ?? t('lockdownPinError'));
      }
    } catch (error) {
      console.error('Failed to set PIN:', error);
      setPinError(t('lockdownPinError'));
    }
  };

  const handleActivateLockdown = async () => {
    setActivateError(null);

    if (!activatePin) {
      setActivateError(t('lockdownPinRequired'));
      return;
    }

    try {
      const response: {
        success: boolean;
        data?: LockdownState;
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'LOCKDOWN_ACTIVATE',
        payload: { pin: activatePin },
      });

      if (response.success && response.data) {
        setLockdownState(response.data);
        setActivatePin('');
      } else {
        setActivateError(response.error ?? t('lockdownActivateError'));
      }
    } catch (error) {
      console.error('Failed to activate lockdown:', error);
      setActivateError(t('lockdownActivateError'));
    }
  };

  const handleDeactivateLockdown = async () => {
    setActivateError(null);

    if (!deactivatePin) {
      setActivateError(t('lockdownPinRequired'));
      return;
    }

    try {
      const response: {
        success: boolean;
        data?: LockdownState;
        error?: string;
      } = await browser.runtime.sendMessage({
        type: 'LOCKDOWN_DEACTIVATE',
        payload: { pin: deactivatePin },
      });

      if (response.success && response.data) {
        setLockdownState(response.data);
        setDeactivatePin('');
        setBypassStatus(null);
        setBypassCountdown(null);
      } else {
        setActivateError(response.error ?? t('lockdownDeactivateError'));
      }
    } catch (error) {
      console.error('Failed to deactivate lockdown:', error);
      setActivateError(t('lockdownDeactivateError'));
    }
  };

  const handleRequestEmergencyBypass = async () => {
    try {
      const response: { success: boolean; data?: LockdownState } =
        await browser.runtime.sendMessage({
          type: 'LOCKDOWN_REQUEST_EMERGENCY_BYPASS',
        });

      if (response.success && response.data) {
        setLockdownState(response.data);
        await checkEmergencyBypassStatus();
      }
    } catch (error) {
      console.error('Failed to request emergency bypass:', error);
    }
  };

  // Format countdown time
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="lockdown-settings">
      {/* Enable toggle */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.lockdown.enabled}
            onChange={() => void handleToggleEnabled()}
          />
          <span className="toggle-text">{t('lockdownEnabled')}</span>
        </label>
        <p className="setting-description">{t('lockdownEnabledDescription')}</p>
      </div>

      {settings.lockdown.enabled && (
        <>
          {/* Current lockdown status */}
          {lockdownState?.isActive && (
            <div className="lockdown-active-banner">
              <div className="banner-content">
                <span className="banner-icon">🔒</span>
                <span className="banner-text">{t('lockdownActiveStatus')}</span>
              </div>
            </div>
          )}

          {/* PIN Setup Section */}
          <div className="pin-setup-section">
            <h3 className="subsection-title">
              {hasPinSet ? t('lockdownChangePin') : t('lockdownSetPin')}
            </h3>

            {hasPinSet && (
              <div className="setting-row">
                <label className="input-label">
                  <span className="label-text">{t('lockdownCurrentPin')}</span>
                  <input
                    type="password"
                    maxLength={8}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="****"
                    autoComplete="off"
                  />
                </label>
              </div>
            )}

            <div className="setting-row">
              <label className="input-label">
                <span className="label-text">{t('lockdownNewPin')}</span>
                <input
                  type="password"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="****"
                  autoComplete="off"
                />
              </label>
              <p className="setting-description">{t('lockdownPinHint')}</p>
            </div>

            <div className="setting-row">
              <label className="input-label">
                <span className="label-text">{t('lockdownConfirmPin')}</span>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="****"
                  autoComplete="off"
                />
              </label>
            </div>

            {pinError && <p className="error-message">{pinError}</p>}
            {pinSuccess && <p className="success-message">{pinSuccess}</p>}

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleSetPin()}
              disabled={!newPin || !confirmPin}
            >
              {hasPinSet
                ? t('lockdownChangePinButton')
                : t('lockdownSetPinButton')}
            </button>
          </div>

          {/* Emergency bypass minutes */}
          <div className="setting-row">
            <label className="input-label">
              <span className="label-text">{t('lockdownEmergencyBypass')}</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.lockdown.emergencyBypassMinutes}
                  onChange={(e) => void handleEmergencyBypassMinutesChange(e)}
                />
                <span className="unit">{t('minutes')}</span>
              </div>
            </label>
            <p className="setting-description">
              {t('lockdownEmergencyBypassDescription')}
            </p>
          </div>

          {/* Activate/Deactivate Section */}
          {hasPinSet && (
            <div className="lockdown-control-section">
              <h3 className="subsection-title">{t('lockdownControl')}</h3>

              {!lockdownState?.isActive ? (
                // Activate lockdown
                <div className="lockdown-activate">
                  <div className="setting-row">
                    <label className="input-label">
                      <span className="label-text">
                        {t('lockdownEnterPin')}
                      </span>
                      <input
                        type="password"
                        maxLength={8}
                        value={activatePin}
                        onChange={(e) => setActivatePin(e.target.value)}
                        placeholder="****"
                        autoComplete="off"
                      />
                    </label>
                  </div>

                  {activateError && (
                    <p className="error-message">{activateError}</p>
                  )}

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => void handleActivateLockdown()}
                    disabled={!activatePin}
                  >
                    {t('lockdownActivateButton')}
                  </button>
                  <p className="warning-text">{t('lockdownActivateWarning')}</p>
                </div>
              ) : (
                // Deactivate lockdown
                <div className="lockdown-deactivate">
                  <div className="setting-row">
                    <label className="input-label">
                      <span className="label-text">
                        {t('lockdownEnterPin')}
                      </span>
                      <input
                        type="password"
                        maxLength={8}
                        value={deactivatePin}
                        onChange={(e) => setDeactivatePin(e.target.value)}
                        placeholder="****"
                        autoComplete="off"
                      />
                    </label>
                  </div>

                  {activateError && (
                    <p className="error-message">{activateError}</p>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void handleDeactivateLockdown()}
                    disabled={!deactivatePin}
                  >
                    {t('lockdownDeactivateButton')}
                  </button>

                  {/* Emergency bypass section */}
                  <div className="emergency-bypass-section">
                    <h4>{t('lockdownEmergencyBypassTitle')}</h4>
                    <p className="setting-description">
                      {t('lockdownEmergencyBypassInfo')}
                    </p>

                    {!bypassStatus?.requested ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void handleRequestEmergencyBypass()}
                      >
                        {t('lockdownRequestBypass')}
                      </button>
                    ) : bypassStatus.ready ? (
                      <p className="success-message">
                        {t('lockdownBypassReady')}
                      </p>
                    ) : (
                      <div className="bypass-countdown">
                        <p className="countdown-text">
                          {t('lockdownBypassCountdown')}:{' '}
                          <span className="countdown-time">
                            {bypassCountdown !== null
                              ? formatCountdown(bypassCountdown)
                              : formatCountdown(bypassStatus.remainingSeconds)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info about lockdown */}
          <div className="lockdown-info">
            <h3>{t('lockdownInfoTitle')}</h3>
            <ul>
              <li>{t('lockdownInfoItem1')}</li>
              <li>{t('lockdownInfoItem2')}</li>
              <li>{t('lockdownInfoItem3')}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

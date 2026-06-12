/**
 * Main popup application component - Single scroll view design
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import { createMessage } from '@/shared/types/messages';
import type {
  Platform,
  FocusModeState,
  PomodoroState,
  StreakData,
  TimeLimitsState,
} from '@/shared/types';
import {
  DEFAULT_FOCUS_STATE,
  DEFAULT_POMODORO_STATE,
  DEFAULT_STREAK_DATA,
  DEFAULT_TIME_LIMITS_STATE,
} from '@/shared/constants';
import { ActiveTimerWidget } from './components/ActiveTimerWidget';
import { AdalabWidget } from './components/AdalabWidget';
import { ActiveWatchingWidget } from './components/ActiveWatchingWidget';
import { CompactStats } from './components/CompactStats';
import { PlatformGrid } from './components/PlatformGrid';
import { FocusLauncher } from './components/FocusLauncher';
import { ScheduleBadge } from './components/ScheduleBadge';
import { BlockSiteButton } from './components/BlockSiteButton';

export function App() {
  const { t, isReady: i18nReady } = useI18n();
  const {
    settings,
    isLoading,
    error,
    toggleEnabled,
    togglePlatform,
    refreshSettings,
    updateSettings,
  } = useSettings();

  const [focusState, setFocusState] =
    useState<FocusModeState>(DEFAULT_FOCUS_STATE);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(
    DEFAULT_POMODORO_STATE
  );
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK_DATA);
  const [timeLimitsState, setTimeLimitsState] = useState<TimeLimitsState>(
    DEFAULT_TIME_LIMITS_STATE
  );

  const fetchFocusState = useCallback(async () => {
    try {
      const message = createMessage({ type: 'FOCUS_GET_STATE' as const });
      const response: { success: boolean; data?: FocusModeState } =
        await browser.runtime.sendMessage(message);
      if (response?.success === true && response.data !== undefined) {
        setFocusState(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchPomodoroState = useCallback(async () => {
    try {
      const message = createMessage({ type: 'POMODORO_GET_STATE' as const });
      const response: { success: boolean; data?: PomodoroState } =
        await browser.runtime.sendMessage(message);
      if (response?.success === true && response.data !== undefined) {
        setPomodoroState(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchStreakData = useCallback(async () => {
    try {
      const message = createMessage({ type: 'STREAK_GET_DATA' as const });
      const response: { success: boolean; data?: StreakData } =
        await browser.runtime.sendMessage(message);
      if (response?.success === true && response.data !== undefined) {
        setStreakData(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchTimeUsage = useCallback(async () => {
    try {
      const message = createMessage({ type: 'TIME_GET_USAGE' as const });
      const response: { success: boolean; data?: TimeLimitsState } =
        await browser.runtime.sendMessage(message);
      if (response?.success === true && response.data !== undefined) {
        setTimeLimitsState(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- async data fetching: setState is called after await in callbacks, not synchronously */
    void fetchFocusState();
    void fetchPomodoroState();
    void fetchStreakData();
    void fetchTimeUsage();

    const interval = setInterval(() => {
      void fetchFocusState();
      void fetchPomodoroState();
      void fetchTimeUsage();
    }, 1000);
    /* eslint-enable react-hooks/set-state-in-effect */

    return () => clearInterval(interval);
  }, [fetchFocusState, fetchPomodoroState, fetchStreakData, fetchTimeUsage]);

  const handleToggleEnabled = () => {
    void toggleEnabled();
  };

  const handleTogglePlatform = (platform: Platform) => {
    void togglePlatform(platform);
  };

  const handleCancelFocus = async () => {
    try {
      const message = createMessage({ type: 'FOCUS_CANCEL' as const });
      const response: { success: boolean; data?: FocusModeState } =
        await browser.runtime.sendMessage(message);
      if (response?.success === true && response.data !== undefined) {
        setFocusState(response.data);
      }
    } catch {
      // Ignore errors
    }
  };

  const handlePomodoroAction = async (
    action: 'pause' | 'resume' | 'skip' | 'stop'
  ) => {
    try {
      const typeMap: Record<
        'pause' | 'resume' | 'skip' | 'stop',
        'POMODORO_PAUSE' | 'POMODORO_RESUME' | 'POMODORO_SKIP' | 'POMODORO_STOP'
      > = {
        pause: 'POMODORO_PAUSE',
        resume: 'POMODORO_RESUME',
        skip: 'POMODORO_SKIP',
        stop: 'POMODORO_STOP',
      };

      const message = createMessage({ type: typeMap[action] });
      const response: { success: boolean; data?: PomodoroState } =
        await browser.runtime.sendMessage(message);
      if (response?.success === true && response.data !== undefined) {
        setPomodoroState(response.data);
      }
    } catch {
      // Ignore errors
    }
  };

  const openOptions = () => {
    void browser.runtime.openOptionsPage();
  };

  const handleCustomDomainsChange = (
    domains: typeof settings.customDomains extends readonly (infer T)[]
      ? T[]
      : never
  ) => {
    void updateSettings({ customDomains: domains });
  };

  // Check if pomodoro is paused (not running but not in idle mode)
  const isPaused = !pomodoroState.isRunning && pomodoroState.mode !== 'idle';
  const hasActiveTimer =
    focusState.isActive || pomodoroState.isRunning || isPaused;

  // Number of platforms currently selected for blocking (for the status hero)
  const activePlatformCount = Object.values(settings.platforms).filter(
    Boolean
  ).length;

  // Find the most recently active platform (active within last 60 seconds)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const activeUsage = useMemo(
    () =>
      timeLimitsState.usage
        .filter(
          (u) => u.lastActiveAt !== null && now - (u.lastActiveAt ?? 0) < 60000
        )
        .sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0))[0] ??
      null,
    [timeLimitsState.usage, now]
  );

  // Loading state
  if (isLoading || !i18nReady) {
    return (
      <div className="popup-container">
        <div className="popup-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  // Error state
  if (error !== null && error !== '') {
    return (
      <div className="popup-container">
        <div className="popup-error">
          <p>{error}</p>
          <button type="button" onClick={() => void refreshSettings()}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header-new">
        <div className="popup-header-left">
          <svg
            className="popup-logo"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="popup-title-new">{t('popupTitle')}</span>
        </div>
        <label className="popup-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={handleToggleEnabled}
          />
          <span className="popup-toggle-slider" />
        </label>
      </header>

      {/* Scrollable content */}
      <div className="popup-scroll-content">
        {/* 1. Current state: running timer, or a clear protection status */}
        {hasActiveTimer ? (
          <ActiveTimerWidget
            focusState={focusState}
            pomodoroState={pomodoroState}
            pomodoroSettings={settings.pomodoro}
            onCancelFocus={() => void handleCancelFocus()}
            onPomodoroAction={(action) => void handlePomodoroAction(action)}
          />
        ) : (
          <div className={`status-hero ${settings.enabled ? 'on' : ''}`}>
            <svg
              className="status-hero-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              {settings.enabled && <path d="M9 12l2 2 4-4" />}
            </svg>
            <div className="status-hero-body">
              <div className="status-hero-title">
                {settings.enabled
                  ? t('popupStatusEnabled')
                  : t('popupStatusDisabled')}
              </div>
              <div className="status-hero-sub">
                {t('popupSectionPlatforms')}: {activePlatformCount} /{' '}
                {t('optionsTabCustomDomains')}: {settings.customDomains.length}
              </div>
            </div>
          </div>
        )}

        {/* Watching indicator + adalab study remote (contextual) */}
        <ActiveWatchingWidget activeUsage={activeUsage} />
        <AdalabWidget />

        {/* 2. Primary action: start a focus session */}
        {!hasActiveTimer && (
          <FocusLauncher
            focusEnabled={settings.focusMode.enabled}
            pomodoroEnabled={settings.pomodoro.enabled}
            focusState={focusState}
            pomodoroState={pomodoroState}
            onFocusStateChange={setFocusState}
            onPomodoroStateChange={setPomodoroState}
          />
        )}

        {/* 3. Contextual: block the site you are on */}
        <BlockSiteButton
          customDomains={settings.customDomains}
          onDomainsChange={handleCustomDomainsChange}
        />

        {/* 4. What is being blocked (collapsed by default) */}
        <PlatformGrid
          platforms={settings.platforms}
          enabled={settings.enabled}
          onTogglePlatform={handleTogglePlatform}
        />

        {/* Schedule status (only meaningful when configured) */}
        <ScheduleBadge schedule={settings.schedule} />

        {/* 5. Today's numbers */}
        <CompactStats
          stats={settings.stats}
          streakData={streakData}
          streakEnabled={settings.streak.enabled}
          todayUsageMs={timeLimitsState.usage.reduce(
            (sum, u) => sum + u.usedTodayMs,
            0
          )}
        />
      </div>

      {/* Footer */}
      <footer className="popup-footer-new">
        <button
          type="button"
          className="popup-settings-btn"
          onClick={openOptions}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {t('popupOpenOptions')}
        </button>
      </footer>
    </div>
  );
}

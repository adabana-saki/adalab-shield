/**
 * Main dashboard component
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useI18n } from '@/shared/hooks/useI18n';
import { createMessage } from '@/shared/types/messages';
import type {
  Settings,
  FocusModeState,
  TimeLimitsState,
  TimeTrackingState,
  TimeGetHistoryMessage,
  MessageResponse,
} from '@/shared/types';
import {
  DEFAULT_FOCUS_STATE,
  DEFAULT_TIME_LIMITS_STATE,
  DEFAULT_TIME_TRACKING_STATE,
} from '@/shared/constants';
import { StatusCard } from './StatusCard';
import { PlatformSummary } from './PlatformSummary';
import { QuickActions } from './QuickActions';
import { ScheduleStatus } from './ScheduleStatus';
import { TimeUsageCard } from './TimeUsageCard';
import { ActivityHeatmap } from './ActivityHeatmap';
import type { SectionId, SubSectionId } from '../layout';

interface DashboardProps {
  settings: Settings;
  onToggleEnabled: () => void;
  onNavigate: (section: SectionId, subSection?: SubSectionId) => void;
}

export function Dashboard({
  settings,
  onToggleEnabled,
  onNavigate,
}: DashboardProps) {
  const { t, formatNumber } = useI18n();
  const [focusState, setFocusState] =
    useState<FocusModeState>(DEFAULT_FOCUS_STATE);
  const [timeLimitsState, setTimeLimitsState] = useState<TimeLimitsState>(
    DEFAULT_TIME_LIMITS_STATE
  );
  const [timeHistory, setTimeHistory] = useState<TimeTrackingState>(
    DEFAULT_TIME_TRACKING_STATE
  );

  const fetchFocusState = useCallback(async () => {
    try {
      const message = createMessage({ type: 'FOCUS_GET_STATE' as const });
      const response: MessageResponse<FocusModeState> =
        await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        setFocusState(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchTimeUsage = useCallback(async () => {
    try {
      const message = createMessage({ type: 'TIME_GET_USAGE' as const });
      const response: MessageResponse<TimeLimitsState> =
        await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        setTimeLimitsState(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchTimeHistory = useCallback(async () => {
    try {
      const message = createMessage<TimeGetHistoryMessage>({
        type: 'TIME_GET_HISTORY',
        payload: { days: 7 },
      });
      const response: MessageResponse<TimeTrackingState> =
        await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        setTimeHistory(response.data);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetching on mount
    void fetchFocusState();
    void fetchTimeUsage();
    void fetchTimeHistory();
  }, [fetchFocusState, fetchTimeUsage, fetchTimeHistory]);

  // Poll focus state and time usage every second
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchFocusState();
      void fetchTimeUsage();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchFocusState, fetchTimeUsage]);

  return (
    <div className="dashboard">
      {/* Header with global toggle */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">{t('dashboardTitle')}</h1>
          <p className="dashboard-subtitle">{t('dashboardSubtitle')}</p>
        </div>
        <div className="dashboard-header-right">
          <label className="dashboard-toggle">
            <span className="dashboard-toggle-label">
              {settings.enabled
                ? t('popupStatusEnabled')
                : t('popupStatusDisabled')}
            </span>
            <div className="toggle-switch toggle-switch-lg">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={onToggleEnabled}
              />
              <span className="toggle-slider" />
            </div>
          </label>
        </div>
      </div>

      {/* Status cards */}
      <div className="dashboard-stats">
        <StatusCard
          title={t('popupStatsToday')}
          value={formatNumber(settings.stats.blockedToday)}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
          variant="default"
        />
        <StatusCard
          title={t('popupStatsTotal')}
          value={formatNumber(settings.stats.blockedTotal)}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          variant="accent"
        />
      </div>

      {/* Main content grid */}
      <div className="dashboard-grid">
        {/* Platform summary */}
        <div className="dashboard-card">
          <PlatformSummary
            platforms={settings.platforms}
            onEditClick={() => onNavigate('blocking', 'platforms')}
          />
        </div>

        {/* Schedule status */}
        <div className="dashboard-card">
          <ScheduleStatus
            schedule={settings.schedule}
            onEditClick={() => onNavigate('schedule', 'scheduleConfig')}
          />
        </div>

        {/* Time usage card */}
        <TimeUsageCard
          timeLimitsState={timeLimitsState}
          onViewDetails={() => onNavigate('reports')}
        />

        {/* Activity heatmap */}
        <ActivityHeatmap history={timeHistory.history} />

        {/* Quick actions */}
        <div className="dashboard-card dashboard-card-wide">
          <QuickActions
            focusEnabled={settings.focusMode.enabled}
            focusState={focusState}
            onFocusStateChange={setFocusState}
          />
        </div>
      </div>
    </div>
  );
}

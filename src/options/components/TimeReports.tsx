/**
 * Time Reports component for options page
 * Displays historical time tracking data with charts
 */

import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type {
  TimeTrackingState,
  DailyTimeRecord,
  Platform,
  TimeGetHistoryMessage,
  TimeClearHistoryMessage,
} from '@/shared/types';
import { createMessage } from '@/shared/types';
import { DEFAULT_TIME_TRACKING_STATE } from '@/shared/constants';

/** Platform display configuration */
const PLATFORM_CONFIG: {
  platform: Platform;
  labelKey: string;
  color: string;
}[] = [
  { platform: 'youtube', labelKey: 'platformYouTube', color: '#FF0000' },
  { platform: 'tiktok', labelKey: 'platformTikTok', color: '#000000' },
  { platform: 'instagram', labelKey: 'platformInstagram', color: '#E1306C' },
  { platform: 'twitter', labelKey: 'platformTwitter', color: '#1DA1F2' },
  { platform: 'facebook', labelKey: 'platformFacebook', color: '#4267B2' },
  { platform: 'reddit', labelKey: 'platformReddit', color: '#FF4500' },
];

/** Date range options */
const DATE_RANGE_OPTIONS = [
  { days: 7, labelKey: 'reportsLast7Days' },
  { days: 30, labelKey: 'reportsLast30Days' },
  { days: 90, labelKey: 'reportsLast90Days' },
];

export function TimeReports() {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();
  const [history, setHistory] = useState<TimeTrackingState>(
    DEFAULT_TIME_TRACKING_STATE
  );
  const [selectedDays, setSelectedDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const message = createMessage<TimeGetHistoryMessage>({
        type: 'TIME_GET_HISTORY',
        payload: { days: selectedDays },
      });
      const response: {
        success: boolean;
        data?: TimeTrackingState;
        error?: string;
      } = await browser.runtime.sendMessage(message);
      if (response.success === true && response.data !== undefined) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch time history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const handleToggleEnabled = async () => {
    await updateSettings({
      timeTracking: {
        enabled: !settings.timeTracking.enabled,
      },
    });
  };

  const handleRetentionChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const days = parseInt(e.target.value, 10);
    await updateSettings({
      timeTracking: {
        retentionDays: days,
      },
    });
  };

  const handleClearHistory = async () => {
    if (!confirm(t('reportsClearConfirm'))) {
      return;
    }

    try {
      const message = createMessage<TimeClearHistoryMessage>({
        type: 'TIME_CLEAR_HISTORY',
      });
      await browser.runtime.sendMessage(message);
      await fetchHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}${t('minutesShort')}`;
    }
    if (minutes === 0) {
      return `${hours}${t('hoursShort')}`;
    }
    return `${hours}${t('hoursShort')} ${minutes}${t('minutesShort')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotalMs = (records: readonly DailyTimeRecord[]): number => {
    return records.reduce((sum, record) => sum + record.totalMs, 0);
  };

  const calculatePlatformTotal = (
    records: readonly DailyTimeRecord[],
    platform: Platform
  ): number => {
    return records.reduce((sum, record) => {
      return sum + (record.byPlatform[platform] ?? 0);
    }, 0);
  };

  const getMaxDailyTotal = (): number => {
    if (history.history.length === 0) {
      return 0;
    }
    return Math.max(...history.history.map((r) => r.totalMs));
  };

  const renderBarChart = (record: DailyTimeRecord) => {
    const maxTotal = getMaxDailyTotal();
    if (maxTotal === 0) {
      return null;
    }

    const barHeight = 24;
    const totalWidth = 200;

    let currentX = 0;
    const segments: JSX.Element[] = [];

    for (const { platform, color } of PLATFORM_CONFIG) {
      const ms = record.byPlatform[platform] ?? 0;
      if (ms === 0) {
        continue;
      }

      const width = (ms / maxTotal) * totalWidth;
      segments.push(
        <div
          key={platform}
          className="chart-segment"
          style={{
            left: currentX,
            width: Math.max(2, width),
            height: barHeight,
            backgroundColor: color,
          }}
          title={`${t(`platform${platform.charAt(0).toUpperCase()}${platform.slice(1)}` as keyof typeof t)}: ${formatDuration(ms)}`}
        />
      );
      currentX += width;
    }

    return (
      <div
        className="chart-bar"
        style={{ width: totalWidth, height: barHeight }}
      >
        {segments}
      </div>
    );
  };

  const totalMs = calculateTotalMs(history.history);
  const averageMs =
    history.history.length > 0 ? totalMs / history.history.length : 0;

  return (
    <div className="time-reports">
      {/* Enable toggle */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.timeTracking.enabled}
            onChange={() => void handleToggleEnabled()}
          />
          <span className="toggle-text">{t('reportsEnabled')}</span>
        </label>
        <p className="setting-description">{t('reportsEnabledDescription')}</p>
      </div>

      {settings.timeTracking.enabled && (
        <>
          {/* Retention period */}
          <div className="setting-row">
            <label className="select-label">
              <span className="label-text">{t('reportsRetention')}</span>
              <select
                value={settings.timeTracking.retentionDays}
                onChange={(e) => void handleRetentionChange(e)}
              >
                <option value={30}>30 {t('days')}</option>
                <option value={60}>60 {t('days')}</option>
                <option value={90}>90 {t('days')}</option>
                <option value={180}>180 {t('days')}</option>
              </select>
            </label>
          </div>

          {/* Date range filter */}
          <div className="setting-row">
            <div className="date-range-buttons">
              {DATE_RANGE_OPTIONS.map(({ days, labelKey }) => (
                <button
                  key={days}
                  className={`date-range-btn ${selectedDays === days ? 'active' : ''}`}
                  onClick={() => setSelectedDays(days)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="loading">{t('loading')}</div>
          ) : history.history.length === 0 ? (
            <div className="no-data">
              <p>{t('reportsNoData')}</p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="reports-summary">
                <div className="summary-card">
                  <span className="summary-label">{t('reportsTotalTime')}</span>
                  <span className="summary-value">
                    {formatDuration(totalMs)}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">
                    {t('reportsDailyAverage')}
                  </span>
                  <span className="summary-value">
                    {formatDuration(averageMs)}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">
                    {t('reportsDaysTracked')}
                  </span>
                  <span className="summary-value">
                    {history.history.length}
                  </span>
                </div>
              </div>

              {/* Platform breakdown */}
              <div className="platform-breakdown">
                <h3 className="subsection-title">{t('reportsByPlatform')}</h3>
                <div className="platform-totals">
                  {PLATFORM_CONFIG.map(({ platform, labelKey, color }) => {
                    const platformTotal = calculatePlatformTotal(
                      history.history,
                      platform
                    );
                    if (platformTotal === 0) {
                      return null;
                    }

                    const percentage =
                      totalMs > 0 ? (platformTotal / totalMs) * 100 : 0;

                    return (
                      <div key={platform} className="platform-total-row">
                        <span
                          className="platform-color"
                          style={{ backgroundColor: color }}
                        />
                        <span className="platform-name">{t(labelKey)}</span>
                        <span className="platform-time">
                          {formatDuration(platformTotal)}
                        </span>
                        <span className="platform-percent">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily history */}
              <div className="daily-history">
                <h3 className="subsection-title">{t('reportsDailyHistory')}</h3>
                <div className="history-list">
                  {history.history.map((record) => (
                    <div key={record.date} className="history-row">
                      <span className="history-date">
                        {formatDate(record.date)}
                      </span>
                      {renderBarChart(record)}
                      <span className="history-total">
                        {formatDuration(record.totalMs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear history button */}
              <div className="actions-row">
                <button
                  className="btn-danger"
                  onClick={() => void handleClearHistory()}
                >
                  {t('reportsClearHistory')}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

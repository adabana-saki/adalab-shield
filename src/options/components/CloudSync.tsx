/**
 * Cloud sync UI — explicit save/restore of the configuration subset to
 * browser.storage.sync, so settings can roam between the user's browsers.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import {
  isCloudSyncAvailable,
  saveConfigToCloud,
  loadConfigFromCloud,
} from '@/shared/utils/cloudSync';

export function CloudSync() {
  const { t, formatDate } = useI18n();
  const { settings, importSettings } = useSettings();
  const available = isCloudSyncAvailable();

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState<'save' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!available) {
      return;
    }
    const payload = await loadConfigFromCloud();
    setSavedAt(payload?.savedAt ?? null);
  }, [available]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSave = async (): Promise<void> => {
    setError(null);
    setSuccess(null);
    setBusy('save');
    try {
      await saveConfigToCloud(settings);
      await refresh();
      setSuccess(t('cloudSyncSaveSuccess'));
    } catch {
      setError(t('cloudSyncError'));
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async (): Promise<void> => {
    setError(null);
    setSuccess(null);
    setBusy('restore');
    try {
      const payload = await loadConfigFromCloud();
      if (payload === null) {
        setError(t('cloudSyncEmpty'));
        return;
      }
      await importSettings(payload.settings);
      setSuccess(t('cloudSyncRestoreSuccess'));
    } catch {
      setError(t('cloudSyncError'));
    } finally {
      setBusy(null);
    }
  };

  if (!available) {
    return (
      <div className="cloud-sync">
        <p className="action-description">{t('cloudSyncUnavailable')}</p>
      </div>
    );
  }

  return (
    <div className="cloud-sync">
      <h3 className="cloud-sync-title">{t('cloudSyncTitle')}</h3>
      <p className="action-description">{t('cloudSyncDescription')}</p>

      <p className="cloud-sync-status">
        {savedAt !== null
          ? `${t('cloudSyncSavedAt')}: ${formatDate(new Date(savedAt))}`
          : t('cloudSyncNever')}
      </p>

      <div className="export-import-actions">
        <div className="export-import-action">
          <button
            className="export-button"
            onClick={() => void handleSave()}
            disabled={busy !== null}
          >
            {busy === 'save' ? t('cloudSyncSaving') : t('cloudSyncSave')}
          </button>
          <p className="action-description">{t('cloudSyncSaveDesc')}</p>
        </div>
        <div className="export-import-action">
          <button
            className="import-button"
            onClick={() => void handleRestore()}
            disabled={busy !== null || savedAt === null}
          >
            {busy === 'restore'
              ? t('cloudSyncRestoring')
              : t('cloudSyncRestore')}
          </button>
          <p className="action-description">{t('cloudSyncRestoreDesc')}</p>
        </div>
      </div>

      {error !== null && error !== '' && (
        <p className="export-import-error">{error}</p>
      )}
      {success !== null && success !== '' && (
        <p className="export-import-success">{success}</p>
      )}
    </div>
  );
}

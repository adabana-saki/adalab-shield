/**
 * Export/Import component
 * Allows users to backup and restore their settings
 */

import { useState, useCallback, useRef } from 'react';
import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import { validateSettings } from '@/shared/utils/validation';
import { createLogger } from '@/shared/utils/logger';
import type { Settings } from '@/shared/types';

const logger = createLogger('export-import');

/** Maximum import file size (1MB) */
const MAX_FILE_SIZE = 1024 * 1024;

/** Allowed file types */
const ALLOWED_TYPES = ['application/json'];

/**
 * Create exportable settings (excludes sensitive data)
 */
function createExportData(settings: Settings): Partial<Settings> {
  return {
    enabled: settings.enabled,
    platforms: { ...settings.platforms },
    preferences: { ...settings.preferences },
    version: settings.version,
    // Note: stats are intentionally excluded from export
  };
}

/**
 * Export/Import component
 */
export function ExportImport() {
  const { t, formatDate } = useI18n();
  const { settings, importSettings } = useSettings();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Export settings to JSON file
   */
  const handleExport = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsExporting(true);

    try {
      const exportData = createExportData(settings);
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const timestamp = formatDate(new Date()).replace(/[/\\:]/g, '-');
      const filename = `shortshield-settings-${timestamp}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);

      logger.info('Settings exported successfully');
      setSuccess(t('exportSuccess'));
    } catch (err) {
      logger.error('Failed to export settings', { error: err });
      setError(t('exportError'));
    } finally {
      setIsExporting(false);
    }
  }, [settings, formatDate, t]);

  /**
   * Handle file selection for import
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setSuccess(null);

      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.json')) {
        setError(t('importErrorInvalidType'));
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(t('importErrorTooLarge'));
        return;
      }

      setIsImporting(true);

      try {
        const text = await file.text();

        // Parse JSON
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          setError(t('importErrorInvalidJson'));
          return;
        }

        // Validate structure
        if (typeof data !== 'object' || data === null) {
          setError(t('importErrorInvalidStructure'));
          return;
        }

        // Validate settings
        const validation = validateSettings(data);
        if (!validation.isValid) {
          setError(validation.error ?? t('importErrorValidation'));
          return;
        }

        // Import settings
        await importSettings(data);

        logger.info('Settings imported successfully');
        setSuccess(t('importSuccess'));
      } catch (err) {
        logger.error('Failed to import settings', { error: err });
        setError(t('importError'));
      } finally {
        setIsImporting(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [importSettings, t]
  );

  /**
   * Trigger file input click
   */
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="export-import-section">
      <div className="export-import-actions">
        {/* Export button */}
        <div className="export-import-action">
          <button
            className="export-button"
            onClick={() => void handleExport()}
            disabled={isExporting}
          >
            {isExporting ? t('exporting') : t('exportButton')}
          </button>
          <p className="action-description">{t('exportDescription')}</p>
        </div>

        {/* Import button */}
        <div className="export-import-action">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void handleFileSelect(e)}
            style={{ display: 'none' }}
          />
          <button
            className="import-button"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? t('importing') : t('importButton')}
          </button>
          <p className="action-description">{t('importDescription')}</p>
        </div>
      </div>

      {/* Status messages */}
      {error !== null && error !== '' && (
        <p className="export-import-error">{error}</p>
      )}
      {success !== null && success !== '' && (
        <p className="export-import-success">{success}</p>
      )}

      {/* Warning */}
      <div className="export-import-warning">
        <p>{t('importWarning')}</p>
      </div>
    </div>
  );
}

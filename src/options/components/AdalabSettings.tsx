/**
 * adalab study integration settings
 */

import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import { ToggleRow } from './common/ToggleRow';
import { AdalabConnectionStatus } from './AdalabConnectionStatus';

export function AdalabSettings() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();

  return (
    <div className="settings-card">
      {/* Live connection status (connected / needs reload / not open) */}
      <AdalabConnectionStatus />

      <ToggleRow
        label={t('adalabSyncToggleLabel')}
        description={t('adalabSyncToggleDescription')}
        checked={settings.adalabSync.enabled}
        onChange={(checked) =>
          void updateSettings({ adalabSync: { enabled: checked } })
        }
      />

      {/* How to connect */}
      <div className="adalab-setup">
        <h4 className="adalab-setup-title">{t('adalabSetupTitle')}</h4>
        <ol className="adalab-setup-steps">
          <li>{t('adalabSetupStep1')}</li>
          <li>{t('adalabSetupStep2')}</li>
          <li>{t('adalabSetupStep3')}</li>
        </ol>
        <p className="adalab-setup-link">
          <a
            href="https://study.adalabtech.com"
            target="_blank"
            rel="noreferrer"
          >
            study.adalabtech.com ↗
          </a>
        </p>
      </div>
    </div>
  );
}

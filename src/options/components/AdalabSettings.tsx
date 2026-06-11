/**
 * adalab study integration settings
 */

import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import { ToggleRow } from './common/ToggleRow';

export function AdalabSettings() {
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();

  return (
    <div className="settings-card">
      <ToggleRow
        label={t('adalabSyncToggleLabel')}
        description={t('adalabSyncToggleDescription')}
        checked={settings.adalabSync.enabled}
        onChange={(checked) =>
          void updateSettings({ adalabSync: { enabled: checked } })
        }
      />
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: 12 }}>
        <a href="https://study.adalabtech.com" target="_blank" rel="noreferrer">
          study.adalabtech.com
        </a>
      </p>
    </div>
  );
}

/**
 * Challenge mode settings component for options page
 */

import { useSettings } from '@/shared/hooks/useSettings';
import { useI18n } from '@/shared/hooks/useI18n';
import type { ChallengeDifficulty, ChallengeType } from '@/shared/types';

export function ChallengeSettings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  const handleToggleEnabled = async () => {
    const enabling = !settings.challenge.enabled;
    await updateSettings({
      challenge: {
        enabled: enabling,
      },
      // Challenge only matters if the block page actually shows a bypass
      // button - enable it together so the feature works out of the box
      ...(enabling && !settings.blockPage.showBypassButton
        ? { blockPage: { showBypassButton: true } }
        : {}),
    });
  };

  const handleDifficultyChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const difficulty = e.target.value as ChallengeDifficulty;
    await updateSettings({
      challenge: {
        difficulty,
      },
    });
  };

  const handleChallengeTypeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const challengeType = e.target.value as ChallengeType;
    await updateSettings({
      challenge: {
        challengeType,
      },
    });
  };

  const handleCooldownChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cooldownSeconds = parseInt(e.target.value, 10);
    if (!isNaN(cooldownSeconds) && cooldownSeconds >= 0) {
      await updateSettings({
        challenge: {
          cooldownSeconds,
        },
      });
    }
  };

  const handleToggleDisableBypass = async () => {
    await updateSettings({
      challenge: {
        disableBypassEntirely: !settings.challenge.disableBypassEntirely,
      },
    });
  };

  // Convert cooldown seconds to minutes for display
  const cooldownMinutes = Math.floor(settings.challenge.cooldownSeconds / 60);

  return (
    <div className="challenge-settings">
      {/* Enable toggle */}
      <div className="setting-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.challenge.enabled}
            onChange={() => void handleToggleEnabled()}
          />
          <span className="toggle-text">{t('challengeEnabled')}</span>
        </label>
        <p className="setting-description">
          {t('challengeEnabledDescription')}
        </p>
      </div>

      {settings.challenge.enabled && (
        <>
          {/* Disable bypass entirely */}
          <div className="setting-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.challenge.disableBypassEntirely}
                onChange={() => void handleToggleDisableBypass()}
              />
              <span className="toggle-text">{t('challengeDisableBypass')}</span>
            </label>
            <p className="setting-description">
              {t('challengeDisableBypassDescription')}
            </p>
          </div>

          {!settings.challenge.disableBypassEntirely && (
            <>
              {/* Challenge type selection */}
              <div className="setting-row">
                <label className="select-label">
                  <span className="label-text">{t('challengeType')}</span>
                  <select
                    value={settings.challenge.challengeType}
                    onChange={(e) => void handleChallengeTypeChange(e)}
                  >
                    <option value="math">{t('challengeTypeMath')}</option>
                    <option value="typing">{t('challengeTypeTyping')}</option>
                    <option value="pattern">{t('challengeTypePattern')}</option>
                  </select>
                </label>
                <p className="setting-description">
                  {t('challengeTypeDescription')}
                </p>
              </div>

              {/* Difficulty selection */}
              <div className="setting-row">
                <label className="select-label">
                  <span className="label-text">{t('challengeDifficulty')}</span>
                  <select
                    value={settings.challenge.difficulty}
                    onChange={(e) => void handleDifficultyChange(e)}
                  >
                    <option value="easy">{t('challengeDifficultyEasy')}</option>
                    <option value="medium">
                      {t('challengeDifficultyMedium')}
                    </option>
                    <option value="hard">{t('challengeDifficultyHard')}</option>
                  </select>
                </label>
                <p className="setting-description">
                  {t('challengeDifficultyDescription')}
                </p>
              </div>

              {/* Cooldown setting */}
              <div className="setting-row">
                <label className="input-label">
                  <span className="label-text">{t('challengeCooldown')}</span>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={cooldownMinutes}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value, 10);
                        if (!isNaN(minutes)) {
                          const event = {
                            target: { value: String(minutes * 60) },
                          } as React.ChangeEvent<HTMLInputElement>;
                          void handleCooldownChange(event);
                        }
                      }}
                    />
                    <span className="unit">{t('minutes')}</span>
                  </div>
                </label>
                <p className="setting-description">
                  {t('challengeCooldownDescription')}
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

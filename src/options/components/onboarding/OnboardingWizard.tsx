/**
 * Onboarding wizard component for first-time users
 */

import { useState } from 'react';
import { useI18n } from '@/shared/hooks/useI18n';
import type { PlatformSettings, ScheduleConfig } from '@/shared/types';
import { WelcomeStep } from './WelcomeStep';
import { PlatformStep } from './PlatformStep';
import { ScheduleStep } from './ScheduleStep';
import { CompleteStep } from './CompleteStep';

interface OnboardingWizardProps {
  onComplete: (settings: {
    platforms: Partial<PlatformSettings>;
    schedule?: Partial<ScheduleConfig>;
  }) => void;
}

type Step = 'welcome' | 'platforms' | 'schedule' | 'complete';

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Partial<PlatformSettings>
  >({
    youtube: true,
    tiktok: true,
    instagram: true,
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  const handleNext = () => {
    console.debug('[Onboarding] handleNext called, currentStep:', currentStep);
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('platforms');
        break;
      case 'platforms':
        setCurrentStep('schedule');
        break;
      case 'schedule':
        setCurrentStep('complete');
        break;
      case 'complete':
        console.debug('[Onboarding] Calling onComplete with:', {
          platforms: selectedPlatforms,
          scheduleEnabled,
        });
        onComplete({
          platforms: selectedPlatforms,
          schedule: scheduleEnabled
            ? {
                enabled: true,
                activeDays: [1, 2, 3, 4, 5], // Mon-Fri
                timeRanges: [
                  { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
                ],
              }
            : undefined,
        });
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'platforms':
        setCurrentStep('welcome');
        break;
      case 'schedule':
        setCurrentStep('platforms');
        break;
      case 'complete':
        setCurrentStep('schedule');
        break;
    }
  };

  const handleSkip = () => {
    console.debug('[Onboarding] handleSkip called');
    onComplete({ platforms: selectedPlatforms });
  };

  const steps: Step[] = ['welcome', 'platforms', 'schedule', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress indicator */}
        <div className="onboarding-progress">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`onboarding-progress-step ${
                index < currentStepIndex
                  ? 'completed'
                  : index === currentStepIndex
                    ? 'active'
                    : ''
              }`}
            >
              <div className="onboarding-progress-dot" />
              {index < steps.length - 1 && (
                <div className="onboarding-progress-line" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="onboarding-content">
          {currentStep === 'welcome' && <WelcomeStep />}

          {currentStep === 'platforms' && (
            <PlatformStep
              selectedPlatforms={selectedPlatforms}
              onPlatformToggle={(platform, enabled) =>
                setSelectedPlatforms((prev) => ({
                  ...prev,
                  [platform]: enabled,
                }))
              }
            />
          )}

          {currentStep === 'schedule' && (
            <ScheduleStep
              enabled={scheduleEnabled}
              onToggle={setScheduleEnabled}
            />
          )}

          {currentStep === 'complete' && (
            <CompleteStep
              selectedPlatforms={selectedPlatforms}
              scheduleEnabled={scheduleEnabled}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="onboarding-actions">
          {currentStep !== 'welcome' && currentStep !== 'complete' && (
            <button
              type="button"
              className="onboarding-btn secondary"
              onClick={handleBack}
            >
              {t('onboardingBack')}
            </button>
          )}

          {currentStep !== 'complete' && (
            <button
              type="button"
              className="onboarding-btn skip"
              onClick={handleSkip}
            >
              {t('onboardingSkip')}
            </button>
          )}

          <button
            type="button"
            className="onboarding-btn primary"
            onClick={handleNext}
          >
            {currentStep === 'complete'
              ? t('onboardingFinish')
              : currentStep === 'welcome'
                ? t('onboardingGetStarted')
                : t('onboardingNext')}
          </button>
        </div>
      </div>
    </div>
  );
}

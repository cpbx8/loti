import { useOnboarding, type HealthState } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/lib/i18n'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, SelectionCard } from '@/components/OnboardingLayout'

const OPTIONS: { value: HealthState; titleKey: string; subtitleKey: string; icon: string }[] = [
  { value: 'healthy', icon: '\u{1F7E2}', titleKey: 'onboarding.healthState.healthy', subtitleKey: 'onboarding.healthState.healthySub' },
  { value: 'prediabetic', icon: '\u{1F7E1}', titleKey: 'onboarding.healthState.prediabetic', subtitleKey: 'onboarding.healthState.prediabeticSub' },
  { value: 'type2', icon: '\u{1F534}', titleKey: 'onboarding.healthState.type2', subtitleKey: 'onboarding.healthState.type2Sub' },
  { value: 'gestational', icon: '\u{1F930}', titleKey: 'onboarding.healthState.gestational', subtitleKey: 'onboarding.healthState.gestationalSub' },
]

export default function HealthStateScreen() {
  const { state, update, next } = useOnboarding()
  const { t } = useLanguage()

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.healthState.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.healthState.sub')}</OnboardingSubtext>

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <SelectionCard
            key={opt.value}
            selected={state.healthState === opt.value}
            onClick={() => update({ healthState: opt.value })}
            icon={opt.icon}
            title={t(opt.titleKey)}
            subtitle={t(opt.subtitleKey)}
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={!state.healthState}>
        {t('onboarding.continue')}
      </OnboardingCTA>
    </OnboardingLayout>
  )
}

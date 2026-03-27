import { useOnboarding, type Goal } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, SelectionCard } from '@/components/OnboardingLayout'
import { useLanguage } from '@/lib/i18n'

export default function GoalScreen() {
  const { state, update, next } = useOnboarding()
  const { t } = useLanguage()

  const OPTIONS: { value: Goal; icon: string; title: string; subtitle: string }[] = [
    { value: 'lower_a1c', icon: '\u{1F4C9}', title: t('onboarding.goal.lowerA1c'), subtitle: t('onboarding.goal.lowerA1cSub') },
    { value: 'lose_weight', icon: '\u{2696}\u{FE0F}', title: t('onboarding.goal.loseWeight'), subtitle: t('onboarding.goal.loseWeightSub') },
    { value: 'learn', icon: '\u{1F4DA}', title: t('onboarding.goal.learn'), subtitle: t('onboarding.goal.learnSub') },
    { value: 'wellness', icon: '\u{1F49A}', title: t('onboarding.goal.wellness'), subtitle: t('onboarding.goal.wellnessSub') },
  ]

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.goal.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.goal.sub')}</OnboardingSubtext>

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <SelectionCard
            key={opt.value}
            selected={state.goal === opt.value}
            onClick={() => update({ goal: opt.value })}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={!state.goal}>
        {t('onboarding.continue')}
      </OnboardingCTA>
    </OnboardingLayout>
  )
}

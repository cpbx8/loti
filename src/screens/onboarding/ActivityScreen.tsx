import { useOnboarding, type ActivityLevel } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionCard } from '@/components/OnboardingLayout'
import { useLanguage } from '@/lib/i18n'

export default function ActivityScreen() {
  const { state, update, next, skip } = useOnboarding()
  const { t } = useLanguage()

  const OPTIONS: { value: ActivityLevel; icon: string; title: string; subtitle: string }[] = [
    { value: 'sedentary', icon: '\u{1FA91}', title: t('onboarding.activity.sedentary'), subtitle: t('onboarding.activity.sedentarySub') },
    { value: 'light', icon: '\u{1F6B6}', title: t('onboarding.activity.light'), subtitle: t('onboarding.activity.lightSub') },
    { value: 'moderate', icon: '\u{1F3C3}', title: t('onboarding.activity.moderate'), subtitle: t('onboarding.activity.moderateSub') },
    { value: 'very_active', icon: '\u{1F4AA}', title: t('onboarding.activity.very'), subtitle: t('onboarding.activity.verySub') },
  ]

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.activity.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.activity.sub')}</OnboardingSubtext>

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <SelectionCard
            key={opt.value}
            selected={state.activityLevel === opt.value}
            onClick={() => update({ activityLevel: opt.value })}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={!state.activityLevel}>
        {t('onboarding.continue')}
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

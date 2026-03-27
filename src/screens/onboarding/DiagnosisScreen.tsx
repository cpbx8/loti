import { useOnboarding } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/lib/i18n'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionCard } from '@/components/OnboardingLayout'

const OPTIONS = [
  { value: 'less_than_6mo', key: 'onboarding.diagnosis.less6m' },
  { value: '6mo_to_2yr', key: 'onboarding.diagnosis.6m2y' },
  { value: '2yr_to_5yr', key: 'onboarding.diagnosis.2y5y' },
  { value: 'more_than_5yr', key: 'onboarding.diagnosis.more5y' },
  { value: 'unsure', key: 'onboarding.diagnosis.unsure' },
]

export default function DiagnosisScreen() {
  const { state, update, next, skip } = useOnboarding()
  const { t } = useLanguage()

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.diagnosis.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.diagnosis.sub')}</OnboardingSubtext>

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <SelectionCard
            key={opt.value}
            selected={state.diagnosisDuration === opt.value}
            onClick={() => update({ diagnosisDuration: opt.value })}
            title={t(opt.key)}
            subtitle=""
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={!state.diagnosisDuration}>
        {t('onboarding.continue')}
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

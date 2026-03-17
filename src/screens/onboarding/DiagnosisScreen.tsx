import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionCard } from '@/components/OnboardingLayout'

const OPTIONS = [
  { value: 'less_than_6mo', title: 'Less than 6 months ago' },
  { value: '6mo_to_2yr', title: '6 months \u2013 2 years' },
  { value: '2yr_to_5yr', title: '2 \u2013 5 years' },
  { value: 'more_than_5yr', title: 'More than 5 years' },
  { value: 'unsure', title: "I'm not sure" },
]

export default function DiagnosisScreen() {
  const { state, update, next, skip } = useOnboarding()

  return (
    <OnboardingLayout>
      <OnboardingHeadline>When were you diagnosed?</OnboardingHeadline>
      <OnboardingSubtext>This helps us understand your journey</OnboardingSubtext>

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <SelectionCard
            key={opt.value}
            selected={state.diagnosisDuration === opt.value}
            onClick={() => update({ diagnosisDuration: opt.value })}
            title={opt.title}
            subtitle=""
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={!state.diagnosisDuration}>
        Continue
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

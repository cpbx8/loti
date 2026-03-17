import { useOnboarding, type HealthState } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, SelectionCard } from '@/components/OnboardingLayout'

const OPTIONS: { value: HealthState; icon: string; title: string; subtitle: string }[] = [
  { value: 'healthy', icon: '\u{1F7E2}', title: "I'm healthy / curious", subtitle: 'No diabetes diagnosis' },
  { value: 'prediabetic', icon: '\u{1F7E1}', title: 'Prediabetic', subtitle: 'Borderline or at risk' },
  { value: 'type2', icon: '\u{1F534}', title: 'Type 2 diabetes', subtitle: 'Diagnosed with T2D' },
  { value: 'gestational', icon: '\u{1F930}', title: 'Gestational diabetes', subtitle: 'Pregnancy-related' },
]

export default function HealthStateScreen() {
  const { state, update, next } = useOnboarding()

  return (
    <OnboardingLayout>
      <OnboardingHeadline>What describes you best?</OnboardingHeadline>
      <OnboardingSubtext>This helps Loti adjust how we rate foods for you</OnboardingSubtext>

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <SelectionCard
            key={opt.value}
            selected={state.healthState === opt.value}
            onClick={() => update({ healthState: opt.value })}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={!state.healthState}>
        Continue
      </OnboardingCTA>
    </OnboardingLayout>
  )
}

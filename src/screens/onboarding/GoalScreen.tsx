import { useOnboarding, type Goal } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, SelectionCard } from '@/components/OnboardingLayout'

const OPTIONS: { value: Goal; icon: string; title: string; subtitle: string }[] = [
  { value: 'lower_a1c', icon: '\u{1F4C9}', title: 'Lower my A1C', subtitle: 'Get my numbers under control' },
  { value: 'lose_weight', icon: '\u{2696}\u{FE0F}', title: 'Lose weight', subtitle: 'Manage weight through better food choices' },
  { value: 'learn', icon: '\u{1F4DA}', title: 'Learn about food', subtitle: 'Understand how food affects my glucose' },
  { value: 'wellness', icon: '\u{1F49A}', title: 'General wellness', subtitle: 'Stay healthy and prevent problems' },
]

export default function GoalScreen() {
  const { state, update, next } = useOnboarding()

  return (
    <OnboardingLayout>
      <OnboardingHeadline>What's your main goal?</OnboardingHeadline>
      <OnboardingSubtext>We'll tailor your experience around this</OnboardingSubtext>

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
        Continue
      </OnboardingCTA>
    </OnboardingLayout>
  )
}

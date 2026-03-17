import { useOnboarding, type ActivityLevel } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionCard } from '@/components/OnboardingLayout'

const OPTIONS: { value: ActivityLevel; icon: string; title: string; subtitle: string }[] = [
  { value: 'sedentary', icon: '\u{1FA91}', title: 'Sedentary', subtitle: 'Little to no exercise' },
  { value: 'light', icon: '\u{1F6B6}', title: 'Lightly active', subtitle: 'Light exercise 1-3 days/week' },
  { value: 'moderate', icon: '\u{1F3C3}', title: 'Moderately active', subtitle: 'Exercise 3-5 days/week' },
  { value: 'very_active', icon: '\u{1F4AA}', title: 'Very active', subtitle: 'Hard exercise 6-7 days/week' },
]

export default function ActivityScreen() {
  const { state, update, next, skip } = useOnboarding()

  return (
    <OnboardingLayout>
      <OnboardingHeadline>How active are you?</OnboardingHeadline>
      <OnboardingSubtext>Physical activity affects how your body handles glucose</OnboardingSubtext>

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
        Continue
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

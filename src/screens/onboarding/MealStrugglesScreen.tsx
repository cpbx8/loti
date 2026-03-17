import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionChip } from '@/components/OnboardingLayout'

const MEALS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Drinks / beverages',
  'Eating out / social meals',
]

export default function MealStrugglesScreen() {
  const { state, update, next, skip } = useOnboarding()
  const selected = state.mealStruggles

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      update({ mealStruggles: selected.filter(s => s !== item) })
    } else {
      update({ mealStruggles: [...selected, item] })
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>Which meals are hardest to manage?</OnboardingHeadline>
      <OnboardingSubtext>We'll prioritize tips and swaps for these</OnboardingSubtext>

      <div className="mt-6 flex flex-wrap gap-2">
        {MEALS.map(m => (
          <SelectionChip
            key={m}
            selected={selected.includes(m)}
            onClick={() => toggle(m)}
            label={m}
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={selected.length === 0}>
        Continue
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

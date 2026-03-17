import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionChip } from '@/components/OnboardingLayout'

const RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free / Celiac',
  'Lactose intolerant',
  'Dairy-free',
  'Keto / Low carb',
  'Paleo',
  'Mediterranean',
  'Low sodium',
  'Low fat',
  'Nut allergy',
  'Shellfish allergy',
  'Soy-free',
  'Egg-free',
  'Halal',
  'Kosher',
  'None',
]

export default function DietaryScreen() {
  const { state, update, next, skip } = useOnboarding()
  const selected = state.dietaryRestrictions

  const toggle = (item: string) => {
    if (item === 'None') {
      update({ dietaryRestrictions: selected.includes(item) ? [] : [item] })
    } else {
      const without = selected.filter(s => s !== 'None')
      if (without.includes(item)) {
        update({ dietaryRestrictions: without.filter(s => s !== item) })
      } else {
        update({ dietaryRestrictions: [...without, item] })
      }
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>Any dietary restrictions?</OnboardingHeadline>
      <OnboardingSubtext>We'll filter swap suggestions accordingly</OnboardingSubtext>

      <div className="mt-6 flex flex-wrap gap-2">
        {RESTRICTIONS.map(r => (
          <SelectionChip
            key={r}
            selected={selected.includes(r)}
            onClick={() => toggle(r)}
            label={r}
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

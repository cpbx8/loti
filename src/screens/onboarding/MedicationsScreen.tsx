import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionChip } from '@/components/OnboardingLayout'

const MEDICATIONS = [
  'Metformin',
  'Glibenclamida / Glibenclamide',
  'Insulin',
  'Sitagliptin',
  'Pioglitazone',
  'Other',
  'None / not applicable',
]

export default function MedicationsScreen() {
  const { state, update, next, skip } = useOnboarding()
  const meds = state.medications

  const toggle = (med: string) => {
    if (med === 'None / not applicable') {
      update({ medications: meds.includes(med) ? [] : [med] })
    } else {
      const without = meds.filter(m => m !== 'None / not applicable')
      if (without.includes(med)) {
        update({ medications: without.filter(m => m !== med) })
      } else {
        update({ medications: [...without, med] })
      }
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>Are you taking any diabetes medications?</OnboardingHeadline>
      <OnboardingSubtext>This won't affect your food ratings — it's for your personal records</OnboardingSubtext>

      <div className="mt-6 flex flex-wrap gap-2">
        {MEDICATIONS.map(med => (
          <SelectionChip
            key={med}
            selected={meds.includes(med)}
            onClick={() => toggle(med)}
            label={med}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-text-tertiary">
        Loti never provides medication advice. Always follow your doctor's guidance.
      </p>

      <OnboardingCTA onClick={next} disabled={meds.length === 0}>
        Continue
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

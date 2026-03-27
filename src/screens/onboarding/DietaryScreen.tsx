import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionChip } from '@/components/OnboardingLayout'
import { useLanguage } from '@/lib/i18n'

type DietKey = 'vegetarian' | 'vegan' | 'glutenFree' | 'lactoseIntolerant' | 'dairyFree' | 'keto' | 'paleo' | 'mediterranean' | 'lowSodium' | 'lowFat' | 'nutAllergy' | 'shellfishAllergy' | 'soyFree' | 'eggFree' | 'halal' | 'kosher' | 'none'

const DIET_KEYS: DietKey[] = [
  'vegetarian', 'vegan', 'glutenFree', 'lactoseIntolerant', 'dairyFree',
  'keto', 'paleo', 'mediterranean', 'lowSodium', 'lowFat',
  'nutAllergy', 'shellfishAllergy', 'soyFree', 'eggFree',
  'halal', 'kosher', 'none',
]

export default function DietaryScreen() {
  const { state, update, next, skip } = useOnboarding()
  const { t } = useLanguage()
  const selected = state.dietaryRestrictions

  const RESTRICTIONS = DIET_KEYS.map(key => ({
    key,
    label: t(`onboarding.dietary.${key}` as any),
  }))

  const toggle = (label: string) => {
    const noneLabel = t('onboarding.dietary.none' as any)
    if (label === noneLabel) {
      update({ dietaryRestrictions: selected.includes(label) ? [] : [label] })
    } else {
      const without = selected.filter(s => s !== noneLabel)
      if (without.includes(label)) {
        update({ dietaryRestrictions: without.filter(s => s !== label) })
      } else {
        update({ dietaryRestrictions: [...without, label] })
      }
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.dietary.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.dietary.sub')}</OnboardingSubtext>

      <div className="mt-6 flex flex-wrap gap-2">
        {RESTRICTIONS.map(r => (
          <SelectionChip
            key={r.key}
            selected={selected.includes(r.label)}
            onClick={() => toggle(r.label)}
            label={r.label}
          />
        ))}
      </div>

      <OnboardingCTA onClick={next} disabled={selected.length === 0}>
        {t('onboarding.continue')}
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

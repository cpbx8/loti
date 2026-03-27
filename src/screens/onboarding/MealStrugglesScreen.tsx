import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionChip } from '@/components/OnboardingLayout'
import { useLanguage } from '@/lib/i18n'

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'drinks' | 'eatingOut'

const MEAL_KEYS: MealKey[] = ['breakfast', 'lunch', 'dinner', 'snacks', 'drinks', 'eatingOut']

export default function MealStrugglesScreen() {
  const { state, update, next, skip } = useOnboarding()
  const { t } = useLanguage()
  const selected = state.mealStruggles

  const MEALS = MEAL_KEYS.map(key => ({
    key,
    label: t(`onboarding.struggles.${key}` as any),
  }))

  const toggle = (label: string) => {
    if (selected.includes(label)) {
      update({ mealStruggles: selected.filter(s => s !== label) })
    } else {
      update({ mealStruggles: [...selected, label] })
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.struggles.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.struggles.sub')}</OnboardingSubtext>

      <div className="mt-6 flex flex-wrap gap-2">
        {MEALS.map(m => (
          <SelectionChip
            key={m.key}
            selected={selected.includes(m.label)}
            onClick={() => toggle(m.label)}
            label={m.label}
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

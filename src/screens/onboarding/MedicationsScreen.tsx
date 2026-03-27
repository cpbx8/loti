import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip, SelectionChip } from '@/components/OnboardingLayout'
import { useLanguage } from '@/lib/i18n'

type MedKey = 'metformin' | 'glibenclamide' | 'insulin' | 'sitagliptin' | 'pioglitazone' | 'other' | 'none'

const MED_KEYS: MedKey[] = ['metformin', 'glibenclamide', 'insulin', 'sitagliptin', 'pioglitazone', 'other', 'none']

export default function MedicationsScreen() {
  const { state, update, next, skip } = useOnboarding()
  const { t } = useLanguage()
  const meds = state.medications

  const MEDICATIONS = MED_KEYS.map(key => ({
    key,
    label: t(`onboarding.meds.${key}` as any),
  }))

  const toggle = (label: string) => {
    const noneLabel = t('onboarding.meds.none' as any)
    if (label === noneLabel) {
      update({ medications: meds.includes(label) ? [] : [label] })
    } else {
      const without = meds.filter(m => m !== noneLabel)
      if (without.includes(label)) {
        update({ medications: without.filter(m => m !== label) })
      } else {
        update({ medications: [...without, label] })
      }
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.meds.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.meds.sub')}</OnboardingSubtext>

      <div className="mt-6 flex flex-wrap gap-2">
        {MEDICATIONS.map(med => (
          <SelectionChip
            key={med.key}
            selected={meds.includes(med.label)}
            onClick={() => toggle(med.label)}
            label={med.label}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-text-tertiary">
        {t('onboarding.meds.disclaimer')}
      </p>

      <OnboardingCTA onClick={next} disabled={meds.length === 0}>
        {t('onboarding.continue')}
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

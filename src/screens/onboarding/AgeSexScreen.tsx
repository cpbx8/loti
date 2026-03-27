import { useState } from 'react'
import { useOnboarding, type Sex } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA } from '@/components/OnboardingLayout'
import { useLanguage } from '@/lib/i18n'

export default function AgeSexScreen() {
  const { state, update, next } = useOnboarding()
  const { t } = useLanguage()
  const [ageInput, setAgeInput] = useState(state.age?.toString() ?? '')
  const ageNum = parseInt(ageInput, 10)
  const ageValid = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 100
  const canContinue = ageValid && !!state.sex

  const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: 'male', label: t('onboarding.ageSex.male') },
    { value: 'female', label: t('onboarding.ageSex.female') },
    { value: 'not_specified', label: t('onboarding.ageSex.preferNot') },
  ]

  const handleContinue = () => {
    if (canContinue) {
      update({ age: ageNum })
      next()
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.ageSex.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.ageSex.sub')}</OnboardingSubtext>

      <div className="mt-8 flex flex-col gap-6">
        {/* Age */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-text-secondary mb-2">{t('onboarding.ageSex.age')}</label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            min="13"
            max="100"
            placeholder={t('onboarding.ageSex.age')}
            value={ageInput}
            onChange={e => setAgeInput(e.target.value)}
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-3.5 text-lg text-text-primary focus:border-primary focus:outline-none min-h-[48px]"
          />
          {ageInput && !ageValid && (
            <p className="mt-1 text-sm text-error">{t('onboarding.ageSex.ageRange')}</p>
          )}
        </div>

        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('onboarding.ageSex.sex')}</label>
          <div className="flex gap-2">
            {SEX_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ sex: opt.value })}
                className={`flex-1 rounded-full border-2 px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  state.sex === opt.value
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-border bg-card text-text-secondary hover:border-primary/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <OnboardingCTA onClick={handleContinue} disabled={!canContinue}>
        {t('onboarding.continue')}
      </OnboardingCTA>
    </OnboardingLayout>
  )
}

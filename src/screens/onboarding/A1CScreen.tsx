import { useState } from 'react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip } from '@/components/OnboardingLayout'
import { useLanguage } from '@/lib/i18n'

export default function A1CScreen() {
  const { state, update, next, skip } = useOnboarding()
  const { t } = useLanguage()
  const [inputVal, setInputVal] = useState(state.a1cValue?.toString() ?? '')
  const numVal = parseFloat(inputVal)
  const isValid = !isNaN(numVal) && numVal >= 4.0 && numVal <= 14.0

  const RANGES = [
    { label: t('onboarding.a1c.normal'), min: 0, max: 5.69 },
    { label: t('onboarding.a1c.prediabetic'), min: 5.7, max: 6.4 },
    { label: t('onboarding.a1c.diabetic'), min: 6.5, max: 100 },
  ]

  const handleContinue = () => {
    if (isValid) {
      update({ a1cValue: numVal })
      next()
    }
  }

  const handleDontKnow = () => {
    update({ a1cValue: null })
    skip()
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{t('onboarding.a1c.title')}</OnboardingHeadline>
      <OnboardingSubtext>{t('onboarding.a1c.sub')}</OnboardingSubtext>

      <div className="mx-auto mt-4 rounded-2xl bg-card border border-border px-4 py-3 max-w-sm">
        <p className="text-xs text-text-tertiary leading-relaxed">
          <span className="font-medium text-text-secondary">{t('onboarding.a1c.whatIs')}</span> {t('onboarding.a1c.explanation')}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative w-full max-w-[200px]">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="4.0"
            max="14.0"
            placeholder={t('onboarding.a1c.placeholder')}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-center text-2xl font-semibold text-text-primary focus:border-primary focus:outline-none min-h-[56px]"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-text-tertiary">%</span>
        </div>

        {inputVal && !isValid && (
          <p className="mt-2 text-sm text-error">{t('onboarding.a1c.range')}</p>
        )}

        <div className="mt-6 flex flex-col gap-2 w-full">
          {RANGES.map(range => {
            const isActive = isValid && numVal >= range.min && numVal <= range.max
            return (
              <div
                key={range.label}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-primary-light text-primary font-medium' : 'text-text-tertiary'
                }`}
              >
                {range.label}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleDontKnow}
        className="mt-6 w-full rounded-xl border border-border px-4 py-3 text-sm text-text-secondary hover:bg-card min-h-[44px]"
      >
        {t('onboarding.a1c.dontKnow')}
      </button>

      <OnboardingCTA onClick={handleContinue} disabled={!isValid}>
        {t('onboarding.continue')}
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

import { useState } from 'react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext, OnboardingCTA, OnboardingSkip } from '@/components/OnboardingLayout'

const RANGES = [
  { label: 'Below 5.7% = Normal', min: 0, max: 5.69 },
  { label: '5.7 \u2013 6.4% = Prediabetic range', min: 5.7, max: 6.4 },
  { label: '6.5%+ = Diabetic range', min: 6.5, max: 100 },
]

export default function A1CScreen() {
  const { state, update, next, skip } = useOnboarding()
  const [inputVal, setInputVal] = useState(state.a1cValue?.toString() ?? '')
  const numVal = parseFloat(inputVal)
  const isValid = !isNaN(numVal) && numVal >= 4.0 && numVal <= 14.0

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
      <OnboardingHeadline>Do you know your most recent A1C?</OnboardingHeadline>
      <OnboardingSubtext>Don't worry if you don't — we can work without it</OnboardingSubtext>

      <div className="mx-auto mt-4 rounded-xl bg-card border border-border px-4 py-3 max-w-sm">
        <p className="text-xs text-text-tertiary leading-relaxed">
          <span className="font-medium text-text-secondary">What is A1C?</span> It's a blood test that measures your average blood sugar over the past 2-3 months. Your doctor may also call it HbA1c or glycated hemoglobin.
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
            placeholder="e.g., 7.2"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-center text-2xl font-semibold text-text-primary focus:border-primary focus:outline-none min-h-[56px]"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-text-tertiary">%</span>
        </div>

        {inputVal && !isValid && (
          <p className="mt-2 text-sm text-error">A1C values are typically between 4.0 and 14.0</p>
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
        I don't know my A1C
      </button>

      <OnboardingCTA onClick={handleContinue} disabled={!isValid}>
        Continue
      </OnboardingCTA>
      <OnboardingSkip onClick={skip} />
    </OnboardingLayout>
  )
}

import type { ReactNode } from 'react'
import { useOnboarding } from '@/contexts/OnboardingContext'

interface Props {
  children: ReactNode
  /** Hide progress bar (e.g. welcome screen) */
  hideProgress?: boolean
  /** Hide back button */
  hideBack?: boolean
}

export default function OnboardingLayout({ children, hideProgress, hideBack }: Props) {
  const { back, stepNumber, totalSteps } = useOnboarding()

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-[100svh]">
      {/* Progress dots + back button */}
      {!hideProgress && (
        <div className="relative">
          <div className="flex items-center justify-between px-5 pt-4 pb-1">
            {!hideBack ? (
              <button
                onClick={back}
                className="flex items-center text-sm text-text-secondary hover:text-text-primary min-h-[44px]"
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i + 1 === stepNumber
                      ? 'h-2 w-2 bg-primary'
                      : i + 1 < stepNumber
                        ? 'h-1.5 w-1.5 bg-primary/40'
                        : 'h-1.5 w-1.5 bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Screen content */}
      <div className="flex flex-1 flex-col px-6 pb-8">
        {children}
      </div>
    </div>
  )
}

// ─── Reusable sub-components ─────────────────────────────────

export function OnboardingHeadline({ children }: { children: ReactNode }) {
  return <h1 className="mt-6 text-center text-headline text-on-surface">{children}</h1>
}

export function OnboardingSubtext({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-center text-body text-on-surface-variant">{children}</p>
}

export function OnboardingCTA({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-auto w-full rounded-3xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed h-[52px] min-h-[48px] transition-colors active:opacity-85 active:scale-[0.98]"
    >
      {children}
    </button>
  )
}

export function OnboardingSkip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 w-full text-center text-sm text-text-tertiary hover:text-text-secondary min-h-[44px]"
    >
      Skip this step
    </button>
  )
}

/** Single-select card grid */
export function SelectionCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean
  onClick: () => void
  icon?: string
  title: string
  subtitle: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors min-h-[48px] w-full ${
        selected
          ? 'border-primary bg-primary-light'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      {icon && <span className="text-xl mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-text-primary">{title}</span>
          {selected && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm text-text-secondary">{subtitle}</span>
      </div>
    </button>
  )
}

/** Multi-select chip */
export function SelectionChip({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
        selected
          ? 'border-primary bg-primary-light text-primary'
          : 'border-border bg-card text-text-secondary hover:border-primary/30'
      }`}
    >
      {label}
    </button>
  )
}

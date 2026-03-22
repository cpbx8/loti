import { useSubscription } from '@/hooks/useSubscription'

interface TrialBannerProps {
  onUpgrade: () => void
}

export default function TrialBanner({ onUpgrade }: TrialBannerProps) {
  const { is_premium, isTrialActive, isTrialExpired, trialDaysRemaining, scansRemaining, trialDay } = useSubscription()

  // Don't show for premium users
  if (is_premium) return null

  // Post-trial expired banner
  if (isTrialExpired) {
    return (
      <button
        onClick={onUpgrade}
        className="mx-5 mt-3 flex items-center justify-between rounded-xl bg-tl-red-bg px-4 py-3 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🔒</span>
          <p className="text-sm font-medium text-tl-red-fill">Trial ended · Subscribe to scan</p>
        </div>
        <span className="text-xs font-semibold text-tl-red-fill">Upgrade →</span>
      </button>
    )
  }

  // During trial
  if (!isTrialActive) return null

  // Urgency colors based on trial day
  let bgClass = 'bg-primary-light'
  let textClass = 'text-primary-dark'

  if (trialDay >= 5) {
    bgClass = 'bg-tl-red-bg'
    textClass = 'text-tl-red-fill'
  } else if (trialDay >= 4) {
    bgClass = 'bg-tl-yellow-bg'
    textClass = 'text-tl-yellow-fill'
  }

  const dayLabel = trialDay >= 5
    ? 'Last day!'
    : `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} left`

  return (
    <button
      onClick={onUpgrade}
      className={`mx-5 mt-3 flex items-center justify-between rounded-xl ${bgClass} px-4 py-2.5 shadow-sm`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">⏱</span>
        <p className={`text-xs font-medium ${textClass}`}>
          {dayLabel} · {scansRemaining} scan{scansRemaining !== 1 ? 's' : ''} left today
        </p>
      </div>
      <span className={`text-xs font-semibold ${textClass}`}>Upgrade →</span>
    </button>
  )
}

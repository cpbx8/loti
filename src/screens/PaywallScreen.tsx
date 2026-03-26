import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription, type PaywallVariant, type BlockedFeature } from '@/hooks/useSubscription'

const FEATURE_SUBTEXTS: Record<BlockedFeature, string> = {
  scan: 'Unlock unlimited food scanning',
  barcode: 'Unlock unlimited barcode scanning',
  text: 'Unlock unlimited meal logging',
  ai_assistant: 'Unlock personalized meal suggestions',
  favorite: 'Unlock unlimited saved foods',
}

interface PaywallScreenProps {
  variant?: PaywallVariant
  blockedFeature?: BlockedFeature
  onClose?: () => void
  inline?: boolean // renders without fixed positioning (for embedding)
}

export default function PaywallScreen({ variant: variantProp, blockedFeature, onClose, inline }: PaywallScreenProps) {
  const navigate = useNavigate()
  const sub = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual')

  const variant = variantProp ?? sub.getPaywallVariant(blockedFeature)

  const handleClose = () => {
    if (onClose) onClose()
    else navigate(-1)
  }

  const handlePurchase = () => {
    // Stub: in production, trigger Apple IAP via Capacitor plugin
    // For now, activate premium directly for testing
    sub.activatePremium(selectedPlan)
    if (onClose) onClose()
    else navigate('/')
  }

  const handleRestore = () => {
    // Stub: restore Apple IAP purchases
    alert('Restore purchases will be available when the app is on the App Store.')
  }

  // Headlines and subtexts by variant
  let headline = 'Unlock unlimited scanning'
  let subtext = 'Get the most out of Loti:'

  switch (variant) {
    case 'scan_limit':
      headline = "You've used all 3 scans today"
      subtext = 'Go unlimited — scan everything, anytime'
      break
    case 'mid_trial':
      headline = 'Get the most out of Loti'
      subtext = `Your trial ends in ${sub.trialDaysRemaining} day${sub.trialDaysRemaining !== 1 ? 's' : ''}`
      break
    case 'expired':
      headline = 'Your trial has ended'
      subtext = 'Unlock unlimited scanning to keep going'
      break
    case 'blocked_feature':
      headline = 'This feature requires Loti Premium'
      subtext = blockedFeature ? FEATURE_SUBTEXTS[blockedFeature] : 'Unlock all features'
      break
  }

  const content = (
    <div className="flex flex-col items-center px-6 pt-8 pb-10 max-w-md mx-auto">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-secondary min-h-[44px] min-w-[44px]"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Mascot placeholder */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-light mb-4">
        <span className="text-5xl">🌸</span>
      </div>

      {/* Headline */}
      <h1 className="text-title text-on-surface text-center">{headline}</h1>
      <p className="text-sm text-text-secondary text-center mt-1 mb-6">{subtext}</p>

      {/* Feature list */}
      <div className="w-full bg-surface rounded-xl p-4 mb-6">
        {[
          { title: 'Unlimited food scans', desc: 'Photo, barcode & text' },
          { title: 'AI food assistant', desc: 'Personalized meal ideas' },
          { title: 'Full meal history', desc: 'Track your progress' },
          { title: 'Unlimited favorites', desc: 'Quick-access your go-to foods' },
        ].map((feat) => (
          <div key={feat.title} className="flex items-start gap-3 py-2">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-tl-green-fill">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{feat.title}</p>
              <p className="text-xs text-text-secondary">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan selection */}
      <div className="w-full space-y-3 mb-6">
        {/* Annual */}
        <button
          onClick={() => setSelectedPlan('annual')}
          className={`relative w-full rounded-xl border-2 p-4 text-left transition-colors ${
            selectedPlan === 'annual'
              ? 'border-primary bg-primary-light'
              : 'border-border bg-card'
          }`}
        >
          {/* Best value badge */}
          <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            Best Value
          </span>
          <div className="flex items-center justify-between mt-1">
            <div>
              <p className="text-sm font-semibold text-text-primary">Annual</p>
              <p className="text-xs text-text-secondary">MX$699/year · MX$58/mo</p>
              <p className="text-xs font-semibold text-primary">Save 42%</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
              selectedPlan === 'annual' ? 'border-primary' : 'border-border'
            }`}>
              {selectedPlan === 'annual' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </div>
          </div>
        </button>

        {/* Monthly */}
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
            selectedPlan === 'monthly'
              ? 'border-primary bg-primary-light'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Monthly</p>
              <p className="text-xs text-text-secondary">MX$99/month</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
              selectedPlan === 'monthly' ? 'border-primary' : 'border-border'
            }`}>
              {selectedPlan === 'monthly' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </div>
          </div>
        </button>
      </div>

      {/* CTA */}
      <button
        onClick={handlePurchase}
        className="w-full rounded-3xl bg-primary py-4 text-base font-semibold text-white shadow-lg min-h-[48px] transition-transform active:scale-[0.98]"
      >
        Continue · {selectedPlan === 'annual' ? 'MX$699/year' : 'MX$99/month'}
      </button>

      {/* Legal */}
      <p className="text-[10px] text-text-tertiary text-center mt-3 leading-relaxed">
        Renews automatically. Cancel anytime in Settings.
        {selectedPlan === 'annual' ? ' MX$699 billed annually.' : ' MX$99 billed monthly.'}
      </p>

      {/* Restore */}
      <button
        onClick={handleRestore}
        className="mt-4 text-xs text-text-tertiary underline"
      >
        Restore Purchase
      </button>
    </div>
  )

  if (inline) return <div className="relative bg-card">{content}</div>

  return (
    <div className="fixed inset-0 z-[60] bg-card overflow-y-auto">
      <div className="relative min-h-screen">
        {content}
      </div>
    </div>
  )
}

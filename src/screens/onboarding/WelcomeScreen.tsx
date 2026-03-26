/**
 * WelcomeScreen — swipeable intro carousel (3 cards).
 * Shows what Loti does before the health profile onboarding begins.
 */
import { useState, useRef, useCallback } from 'react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/lib/i18n'
import FatSecretAttribution from '@/components/FatSecretAttribution'

const CARDS = [
  { emoji: '📸', titleKey: 'splash.card1Title', subKey: 'splash.card1Sub' },
  { emoji: '📊', titleKey: 'splash.card2Title', subKey: 'splash.card2Sub' },
  { emoji: '🌿', titleKey: 'splash.card3Title', subKey: 'splash.card3Sub' },
] as const

export default function WelcomeScreen() {
  const { next } = useOnboarding()
  const { t } = useLanguage()
  const [active, setActive] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActive(idx)
  }, [])

  const goToCard = (idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * scrollRef.current.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-primary/10 to-surface min-h-[100svh]">
      {/* Skip button */}
      <div className="flex justify-end px-6 pt-6 flex-shrink-0">
        <button
          onClick={next}
          className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] px-2"
        >
          {t('splash.skip')}
        </button>
      </div>

      {/* Loti branding */}
      <div className="flex flex-col items-center pt-8 pb-4 flex-shrink-0">
        <span className="text-[56px] leading-none">🦎</span>
        <h1 className="text-headline text-on-surface mt-3 italic">Loti</h1>
      </div>

      {/* Swipeable cards */}
      <div className="flex-1 flex flex-col justify-center">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-full snap-center flex flex-col items-center justify-center px-10"
            >
              <div className="w-24 h-24 rounded-3xl bg-white/80 shadow-sm flex items-center justify-center text-[48px] mb-6">
                {card.emoji}
              </div>
              <h2 className="text-title text-on-surface text-center leading-snug">
                {t(card.titleKey)}
              </h2>
              <p className="mt-3 text-body text-on-surface-variant text-center max-w-[280px] leading-relaxed">
                {t(card.subKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => goToCard(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? 'w-6 bg-primary' : 'w-2 bg-primary/25'
              }`}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-10 flex-shrink-0">
        <button
          onClick={active === CARDS.length - 1 ? next : () => goToCard(active + 1)}
          className="w-full btn-gradient min-h-[52px] text-lg"
        >
          {active === CARDS.length - 1 ? t('splash.getStarted') : t('splash.next')}
        </button>

        <div className="mt-6 flex justify-center">
          <FatSecretAttribution />
        </div>
      </div>
    </div>
  )
}

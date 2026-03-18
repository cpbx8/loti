/**
 * TipCarousel — horizontally-swipeable educational card carousel.
 * Snap scroll, dot indicators, auto-advance every 6s (pauses on touch).
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import { getTipsForToday } from '@/data/tipCards'
import TipCard from './TipCard'

export default function TipCarousel() {
  const [tips] = useState(() => getTipsForToday(7))
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const interacting = useRef(false)
  const interactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Track active card via scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild?.clientWidth ?? 1
    const index = Math.round(el.scrollLeft / cardWidth)
    setActiveIndex(Math.min(index, tips.length - 1))
  }, [tips.length])

  // Auto-advance every 6s when not interacting
  useEffect(() => {
    const interval = setInterval(() => {
      if (interacting.current) return
      const el = scrollRef.current
      if (!el) return
      const next = (activeIndex + 1) % tips.length
      const cardWidth = el.firstElementChild?.clientWidth ?? 0
      el.scrollTo({ left: next * cardWidth, behavior: 'smooth' })
    }, 6000)
    return () => clearInterval(interval)
  }, [activeIndex, tips.length])

  const handleTouchStart = () => {
    interacting.current = true
    if (interactionTimer.current) clearTimeout(interactionTimer.current)
  }

  const handleTouchEnd = () => {
    interactionTimer.current = setTimeout(() => {
      interacting.current = false
    }, 3000)
  }

  return (
    <div className="mt-3">
      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-5 no-scrollbar"
      >
        {tips.map(tip => (
          <div
            key={tip.id}
            className="flex-shrink-0 snap-start"
            style={{ width: 'calc(100% - 40px)' }}
          >
            <TipCard tip={tip} />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {tips.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

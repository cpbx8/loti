/**
 * AxolotlTip — a wobbling axolotl mascot with a rotating speech bubble tip.
 * Cycles through seeded tips every 6 seconds. Tap to dismiss.
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { getTipsForToday } from '@/data/tipCards'

export default function AxolotlTip() {
  const [dismissed, setDismissed] = useState(false)
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)

  const tips = useMemo(() => getTipsForToday(7), [])

  const advance = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setIndex(i => (i + 1) % tips.length)
      setFading(false)
    }, 250)
  }, [tips.length])

  useEffect(() => {
    if (dismissed || tips.length <= 1) return
    const id = setInterval(advance, 10000)
    return () => clearInterval(id)
  }, [dismissed, tips.length, advance])

  if (dismissed || tips.length === 0) return null

  const tip = tips[index]

  return (
    <div className="mx-5 mt-5 flex items-end gap-3">
      {/* Axolotl mascot */}
      <div className="flex-shrink-0 axolotl-wobble">
        <div className="relative h-14 w-14">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <ellipse cx="32" cy="38" rx="18" ry="14" fill="#F8B4C8" />
            <circle cx="32" cy="22" r="14" fill="#F8B4C8" />
            {/* Gills left */}
            <path d="M16 14 C12 8, 8 10, 10 16" stroke="#E8849E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M14 16 C10 12, 6 14, 8 20" stroke="#E8849E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M15 18 C11 16, 7 18, 10 22" stroke="#E8849E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Gills right */}
            <path d="M48 14 C52 8, 56 10, 54 16" stroke="#E8849E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M50 16 C54 12, 58 14, 56 20" stroke="#E8849E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M49 18 C53 16, 57 18, 54 22" stroke="#E8849E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Eyes */}
            <circle cx="26" cy="20" r="3" fill="#2D1B33" />
            <circle cx="38" cy="20" r="3" fill="#2D1B33" />
            <circle cx="27.5" cy="19" r="1" fill="white" />
            <circle cx="39.5" cy="19" r="1" fill="white" />
            {/* Smile */}
            <path d="M28 26 Q32 30, 36 26" stroke="#D4637A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Cheeks */}
            <ellipse cx="22" cy="24" rx="3" ry="2" fill="#F4A0B5" opacity="0.6" />
            <ellipse cx="42" cy="24" rx="3" ry="2" fill="#F4A0B5" opacity="0.6" />
            {/* Tail */}
            <path d="M50 40 Q58 36, 56 44 Q54 48, 52 44" fill="#F8B4C8" stroke="#E8849E" strokeWidth="1" />
            {/* Feet */}
            <ellipse cx="22" cy="50" rx="5" ry="3" fill="#F8B4C8" />
            <ellipse cx="42" cy="50" rx="5" ry="3" fill="#F8B4C8" />
          </svg>
        </div>
      </div>

      {/* Speech bubble */}
      <button
        onClick={() => setDismissed(true)}
        className="relative flex-1 rounded-2xl rounded-bl-md bg-surface-container-low p-3 text-left transition-all active:scale-[0.98]"
      >
        {/* Bubble tail */}
        <div
          className="absolute -left-2 bottom-3 h-0 w-0"
          style={{
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '8px solid var(--md-sys-color-surface-container-low, #f5f0eb)',
          }}
        />
        <div
          className="transition-opacity duration-250"
          style={{ opacity: fading ? 0 : 1 }}
        >
          <p className="text-xs font-medium text-text-primary leading-relaxed">
            {tip.headline}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1 leading-snug">
            {tip.body}
          </p>
        </div>
        {/* Dot indicators */}
        <div className="flex gap-1 mt-2">
          {tips.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === index ? 'w-3 bg-primary' : 'w-1 bg-border'
              }`}
            />
          ))}
        </div>
      </button>
    </div>
  )
}

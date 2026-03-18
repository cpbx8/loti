/**
 * SuggestionCard — displays a single AI food suggestion with traffic light badge.
 * Left colored bar, food name, GL estimate, reasoning, and "Log" button.
 */
import { useState } from 'react'
import TrafficLightBadge from './TrafficLightBadge'

interface SuggestionCardProps {
  foodName: string
  estimatedGL: number
  trafficLight: 'green' | 'yellow'
  reasoning: string
  onTap: () => void
  onLog?: () => void
}

const TL_BAR_COLOR = {
  green: 'bg-tl-green-fill',
  yellow: 'bg-tl-yellow-fill',
} as const

const GL_LABEL = {
  green: 'Low impact',
  yellow: 'Moderate impact',
} as const

export default function SuggestionCard({
  foodName,
  estimatedGL,
  trafficLight,
  reasoning,
  onTap,
  onLog,
}: SuggestionCardProps) {
  const [logged, setLogged] = useState(false)

  const handleLog = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onLog) {
      onLog()
      setLogged(true)
    }
  }

  return (
    <button
      onClick={onTap}
      className="flex w-full overflow-hidden rounded-xl bg-card shadow-sm text-left transition-colors hover:bg-surface active:bg-surface"
    >
      {/* Colored left bar */}
      <div className={`w-1 flex-shrink-0 ${TL_BAR_COLOR[trafficLight]}`} />

      <div className="flex flex-1 items-start gap-3 p-3">
        <div className="flex-shrink-0 mt-0.5">
          <TrafficLightBadge rating={trafficLight} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-text-primary">{foodName}</p>
          <p className="text-sm text-text-secondary mt-0.5">
            GL: {estimatedGL} · {GL_LABEL[trafficLight]}
          </p>
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{reasoning}</p>
        </div>

        {/* Log button */}
        {onLog && (
          <div
            onClick={handleLog}
            role="button"
            className={`flex-shrink-0 self-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all min-h-[32px] flex items-center gap-1 ${
              logged
                ? 'bg-tl-green-bg text-tl-green-fill'
                : 'bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/25'
            }`}
          >
            {logged ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Logged
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Log
              </>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

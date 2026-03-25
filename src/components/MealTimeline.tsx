/**
 * MealTimeline — vertical timeline of today's meals with colored dots.
 */
import { useNavigate } from 'react-router-dom'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import type { TrafficLight } from '@/types/shared'
import { useLanguage } from '@/lib/i18n'

const DOT_COLORS: Record<TrafficLight, string> = {
  green: 'bg-tl-green-fill',
  yellow: 'bg-tl-yellow-fill',
  red: 'bg-tl-red-fill',
}

const BORDER_COLORS: Record<string, string> = {
  yellow: 'border-l-[3px] border-tl-yellow-fill',
  red: 'border-l-[3px] border-tl-red-fill',
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

interface Props {
  entries: FoodLogEntry[]
  onRemove: (id: string) => void
}

export default function MealTimeline({ entries, onRemove }: Props) {
  const thresholds = useThresholds()
  const { t } = useLanguage()
  const navigate = useNavigate()

  if (entries.length === 0) return null

  // Sort by created_at ascending
  const sorted = [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at))

  return (
    <div>
      <p className="text-label text-on-surface-variant mb-3">{t('dashboard.meals.label')}</p>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-[6px] bottom-[6px] w-[2px] bg-border" />

        <div className="flex flex-col gap-3">
          {sorted.map(entry => {
            const tl: TrafficLight = entry.glycemic_load != null
              ? getPersonalizedTrafficLight(entry.glycemic_load, thresholds)
              : entry.result_traffic_light ?? 'green'

            const borderClass = BORDER_COLORS[tl] ?? ''

            return (
              <div key={entry.id} className="relative">
                {/* Colored dot */}
                <div className={`absolute -left-6 top-[6px] h-3 w-3 rounded-full ${DOT_COLORS[tl]} ring-2 ring-surface`} />

                {/* Time label */}
                <p className="text-xs text-text-tertiary mb-1">{formatTime(entry.created_at)}</p>

                {/* Entry card */}
                <div className={`surface-card rounded-xl px-4 py-3 ${borderClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-on-surface truncate">
                        {entry.food_name || '—'}
                      </p>
                    </div>

                    {/* GL badge */}
                    {entry.glycemic_load != null && (
                      <span className={`text-lg font-bold flex-shrink-0 ${
                        tl === 'green' ? 'text-tl-green-fill' :
                        tl === 'yellow' ? 'text-tl-yellow-fill' :
                        'text-tl-red-fill'
                      }`}>
                        {Math.round(entry.glycemic_load)}
                      </span>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="flex-shrink-0 p-1.5 -m-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                      aria-label="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Contextual nudge after yellow/red meals */}
          {(() => {
            const lastEntry = sorted[sorted.length - 1]
            if (!lastEntry) return null
            const lastTL: TrafficLight = lastEntry.glycemic_load != null
              ? getPersonalizedTrafficLight(lastEntry.glycemic_load, thresholds)
              : lastEntry.result_traffic_light ?? 'green'
            if (lastTL === 'green') return null
            return (
              <div className="relative mt-2">
                <div className="absolute -left-6 top-[6px] h-3 w-3 rounded-full bg-primary ring-2 ring-surface flex items-center justify-center">
                  <span className="text-[6px] text-white">✦</span>
                </div>
                <button
                  onClick={() => navigate('/meal-ideas')}
                  className="w-full surface-section rounded-xl px-4 py-3 text-left border border-primary/15 hover:border-primary/30 transition-colors"
                >
                  <p className="text-body font-medium text-primary">
                    {t('dashboard.nudge.title')}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {t('dashboard.nudge.subtitle')}
                  </p>
                </button>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

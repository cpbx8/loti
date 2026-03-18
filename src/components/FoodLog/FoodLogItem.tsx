import { useState } from 'react'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import TrafficLightBadge from '../TrafficLightBadge'
import type { TrafficLight } from '@/types/shared'

interface Props {
  entry: FoodLogEntry
  onRemove?: (id: string) => void
  onUpdateServing?: (id: string, count: number) => void
}

// Approximate blood glucose impact from GL
// Research: 1 GL ≈ 2-4 mg/dL spike depending on individual
function estimateGlucoseImpact(gl: number): { low: number; high: number } {
  return { low: Math.round(gl * 2), high: Math.round(gl * 4) }
}

const IMPACT_LABEL: Record<TrafficLight, string> = {
  green: 'Low Impact',
  yellow: 'Moderate Impact',
  red: 'High Impact',
}

const IMPACT_TAG_STYLE: Record<TrafficLight, string> = {
  green: 'bg-tl-green-fill text-white',
  yellow: 'bg-tl-yellow-fill text-white',
  red: 'bg-tl-red-fill text-white',
}

export default function FoodLogItem({ entry, onRemove, onUpdateServing }: Props) {
  const thresholds = useThresholds()
  const [expanded, setExpanded] = useState(false)
  const servingCount = (entry as FoodLogEntry & { serving_count?: number }).serving_count ?? 1

  const time = new Date(entry.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Compute traffic light
  const baseGL = entry.glycemic_load ?? 0
  const scaledGL = baseGL * servingCount
  const tl: TrafficLight = scaledGL > 0
    ? getPersonalizedTrafficLight(scaledGL, thresholds)
    : (entry.result_traffic_light ?? 'green')

  const impact = estimateGlucoseImpact(scaledGL)
  const hasMacros = (entry.calories_kcal ?? 0) > 0
  const hasGL = baseGL > 0

  const handleServingChange = (delta: number) => {
    const next = Math.max(1, servingCount + delta)
    onUpdateServing?.(entry.id, next)
  }

  return (
    <div className="rounded-xl bg-card shadow-sm overflow-hidden">
      {/* Main row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors active:bg-surface"
      >
        <div className="flex-shrink-0 mt-0.5">
          <TrafficLightBadge rating={tl} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-tight">
            {entry.food_name ?? 'Unknown'}
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">{time}</p>

          {/* Glucose impact tag */}
          {hasGL && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${IMPACT_TAG_STYLE[tl]}`}>
                {IMPACT_LABEL[tl]}
              </span>
              <span className="text-xs font-medium text-text-primary">
                +{impact.low} to +{impact.high} mg/dL
              </span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 flex-shrink-0 text-text-tertiary mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Glucose impact hero */}
          {hasGL && (
            <div className={`rounded-xl p-3 ${
              tl === 'green' ? 'bg-tl-green-bg' :
              tl === 'yellow' ? 'bg-tl-yellow-bg' :
              'bg-tl-red-bg'
            }`}>
              <div className="flex items-center gap-3">
                <TrafficLightBadge rating={tl} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${IMPACT_TAG_STYLE[tl]}`}>
                      {IMPACT_LABEL[tl]}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-text-primary mt-0.5">
                    +{impact.low} to +{impact.high} mg/dL
                  </p>
                  <p className="text-xs text-text-secondary">Expected in 1 hour</p>
                </div>
              </div>
            </div>
          )}

          {/* Serving size control */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Serving Size:</p>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleServingChange(-1) }}
                disabled={servingCount <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-text-primary font-bold text-lg disabled:opacity-30 min-h-[32px]"
              >
                -
              </button>
              <span className="w-6 text-center text-base font-bold text-text-primary">
                {servingCount}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleServingChange(1) }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-text-primary font-bold text-lg min-h-[32px]"
              >
                +
              </button>
            </div>
          </div>

          {/* GL display */}
          {hasGL && (
            <div className="flex items-center gap-4 text-center">
              <div className="flex-1 rounded-xl bg-surface py-2">
                <p className="text-lg font-bold text-text-primary">{Math.round(scaledGL)}</p>
                <p className="text-[10px] text-text-tertiary uppercase">Glycemic Load</p>
              </div>
              {entry.serving_size_g != null && entry.serving_size_g > 0 && (
                <div className="flex-1 rounded-xl bg-surface py-2">
                  <p className="text-lg font-bold text-text-primary">{Math.round(entry.serving_size_g * servingCount)}g</p>
                  <p className="text-[10px] text-text-tertiary uppercase">Serving</p>
                </div>
              )}
            </div>
          )}

          {/* Macros row */}
          {hasMacros && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-surface p-2 text-center">
                <p className="text-base font-bold text-text-primary">
                  {Math.round((entry.calories_kcal ?? 0) * servingCount)}
                </p>
                <p className="text-[10px] text-text-tertiary">Calories</p>
              </div>
              <div className="rounded-xl bg-surface p-2 text-center">
                <p className="text-base font-bold text-text-primary">
                  {Math.round((entry.carbs_g ?? 0) * servingCount)}g
                </p>
                <p className="text-[10px] text-text-tertiary">Carbs</p>
              </div>
              <div className="rounded-xl bg-surface p-2 text-center">
                <p className="text-base font-bold text-text-primary">
                  {Math.round((entry.protein_g ?? 0) * servingCount)}g
                </p>
                <p className="text-[10px] text-text-tertiary">Protein</p>
              </div>
            </div>
          )}

          {/* Remove button */}
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(entry.id) }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium text-text-tertiary hover:text-error hover:border-error/30 transition-colors min-h-[40px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove from log
            </button>
          )}
        </div>
      )}
    </div>
  )
}

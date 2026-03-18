/**
 * TodaySummaryBar — compact daily feedback loop.
 * Shows traffic light dots + proportional color bar for today's scans.
 */
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import type { TrafficLight } from '@/types/shared'

interface TodaySummaryBarProps {
  entries: FoodLogEntry[]
  onScanTap: () => void
  onHistoryTap: () => void
}

const TL_DOT_COLORS: Record<TrafficLight, string> = {
  green: 'bg-tl-green-fill',
  yellow: 'bg-tl-yellow-fill',
  red: 'bg-tl-red-fill',
}

export default function TodaySummaryBar({ entries, onScanTap, onHistoryTap }: TodaySummaryBarProps) {
  const thresholds = useThresholds()

  const scans = entries.map(e => {
    const tl = e.glycemic_load != null
      ? getPersonalizedTrafficLight(e.glycemic_load, thresholds)
      : e.result_traffic_light ?? 'yellow'
    return tl
  })

  const total = scans.length
  const green = scans.filter(s => s === 'green').length
  const yellow = scans.filter(s => s === 'yellow').length
  const red = scans.filter(s => s === 'red').length

  return (
    <div className="mx-5 mt-3">
      <button
        onClick={total > 0 ? onHistoryTap : undefined}
        className="w-full rounded-xl bg-card p-3 shadow-sm text-left"
      >
        <p className="text-sm font-semibold text-text-primary mb-2">Today's Meals</p>

        {total === 0 ? (
          <p className="text-sm text-text-secondary">
            No meals scanned yet ·{' '}
            <span
              onClick={e => { e.stopPropagation(); onScanTap() }}
              className="text-primary font-medium"
            >
              Scan your first meal →
            </span>
          </p>
        ) : (
          <>
            {/* Traffic light dots + count */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-1">
                {scans.map((tl, i) => (
                  <div key={i} className={`h-4 w-4 rounded-full ${TL_DOT_COLORS[tl]}`} />
                ))}
              </div>
              <span className="text-sm text-text-tertiary ml-1">· {total} scanned</span>
            </div>

            {/* Proportional color bar */}
            <div className="flex h-1 w-full overflow-hidden rounded-full">
              {green > 0 && (
                <div className="bg-tl-green-fill" style={{ width: `${(green / total) * 100}%` }} />
              )}
              {yellow > 0 && (
                <div className="bg-tl-yellow-fill" style={{ width: `${(yellow / total) * 100}%` }} />
              )}
              {red > 0 && (
                <div className="bg-tl-red-fill" style={{ width: `${(red / total) * 100}%` }} />
              )}
            </div>
          </>
        )}
      </button>
    </div>
  )
}

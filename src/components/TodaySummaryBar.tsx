/**
 * TodaySummaryBar — compact daily feedback loop.
 * Shows glucose goal progress ring, traffic light dots, and proportional bar.
 */
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import { useGlucoseGoal } from '@/hooks/useGlucoseGoal'
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

function GoalRing({ pct, size = 48 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const filled = circ * (Math.min(pct, 100) / 100)
  const color = pct >= 70 ? '#2E7D32' : pct >= 40 ? '#E65100' : '#C62828'

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={700} fill={color}>
        {pct}%
      </text>
    </svg>
  )
}

export default function TodaySummaryBar({ entries, onScanTap, onHistoryTap }: TodaySummaryBarProps) {
  const thresholds = useThresholds()
  const goal = useGlucoseGoal(entries)

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
        className="w-full rounded-2xl bg-card p-3 shadow-sm text-left"
      >
        <p className="text-sm font-semibold text-text-primary mb-2">Today's Meals</p>

        {total === 0 ? (
          <div className="flex items-center gap-3">
            <GoalRing pct={0} />
            <div>
              <p className="text-sm text-text-secondary">No meals scanned yet</p>
              <span
                onClick={e => { e.stopPropagation(); onScanTap() }}
                className="text-sm text-primary font-medium"
              >
                Scan your first meal →
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <GoalRing pct={goal.currentPct} />
            <div className="flex-1 min-w-0">
              {/* Status line */}
              <p className="text-sm text-text-secondary mb-1">
                {goal.status === 'on_track'
                  ? `On track — ${goal.greenCount}/${goal.totalCount} green`
                  : `${goal.greenCount}/${goal.totalCount} green · aim for ${goal.goalPct}%`}
              </p>

              {/* Traffic light dots */}
              <div className="flex items-center gap-1 mb-1.5">
                {scans.map((tl, i) => (
                  <div key={i} className={`h-3.5 w-3.5 rounded-full ${TL_DOT_COLORS[tl]}`} />
                ))}
              </div>

              {/* Proportional color bar */}
              <div className="flex h-1 w-full overflow-hidden rounded-full">
                {green > 0 && <div className="bg-tl-green-fill" style={{ width: `${(green / total) * 100}%` }} />}
                {yellow > 0 && <div className="bg-tl-yellow-fill" style={{ width: `${(yellow / total) * 100}%` }} />}
                {red > 0 && <div className="bg-tl-red-fill" style={{ width: `${(red / total) * 100}%` }} />}
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  )
}

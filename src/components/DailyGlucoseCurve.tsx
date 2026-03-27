/**
 * DailyGlucoseCurve — editorial wellness glucose status card.
 * Warm amber curve, zone labels (NORMAL/ELEVADA/ALTA), organic Catmull-Rom spline.
 */

import { useMemo } from 'react'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useProfile } from '@/hooks/useProfile'
import { useLanguage } from '@/lib/i18n'
import { computeDailyGlucose, formatMinuteAsHour, DANGER_ZONES } from '@/lib/glucoseModel'

// Warm amber/orange curve color (matches Rork style)
const CURVE_STROKE = '#E8A838'

const TL_DOT_COLORS: Record<string, string> = {
  green: '#2ECC71',
  yellow: '#F39C12',
  red: '#E74C3C',
}

/** Catmull-Rom spline → SVG cubic bezier path */
function catmullRomPath(points: { x: number; y: number }[], tension = 0.3): string {
  if (points.length < 2) return ''
  if (points.length === 2) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

interface Props {
  entries: FoodLogEntry[]
}

export default function DailyGlucoseCurve({ entries }: Props) {
  const { profile } = useProfile()
  const { t } = useLanguage()
  const healthState = profile?.health_state || 'healthy'
  const a1c = profile?.a1c_value ?? null

  const result = useMemo(
    () => computeDailyGlucose(entries, healthState, undefined, a1c),
    [entries, healthState, a1c]
  )

  const hasData = entries.some(e => e.glycemic_load != null && e.glycemic_load > 0)

  // SVG dimensions — taller for premium feel
  const w = 360
  const h = 180
  const padL = 42
  const padR = 70  // extra room for right-side zone labels
  const padTop = 12
  const padBot = 24
  const plotW = w - padL - padR
  const plotH = h - padTop - padBot

  // Y-axis range
  const yMin = 60
  // Scale y-axis to fit data — don't force 220 for healthy users
  const yMax = hasData
    ? Math.max(result.peakValue + 25, result.baseline + 60, DANGER_ZONES.normal_ceiling + 10)
    : result.baseline + 80  // empty state: just enough to show NORMAL line

  // X-axis range
  const xMin = hasData && result.points.length >= 2 ? result.points[0].time : 360   // 6am default
  const xMax = hasData && result.points.length >= 2 ? result.points[result.points.length - 1].time : 1320 // 10pm default
  const xRange = xMax - xMin || 1

  const toX = (minute: number) => padL + ((minute - xMin) / xRange) * plotW

  const toY = (mgDl: number) => {
    const norm = (mgDl - yMin) / (yMax - yMin)
    return padTop + plotH * (1 - Math.max(0, Math.min(1, norm)))
  }

  // Build Catmull-Rom spline path
  const pathPoints = result.points.map(p => ({ x: toX(p.time), y: toY(p.glucose) }))
  const pathD = catmullRomPath(pathPoints)
  const fillD = pathD + ` L ${pathPoints[pathPoints.length - 1]?.x.toFixed(1) ?? padL} ${toY(yMin).toFixed(1)} L ${pathPoints[0]?.x.toFixed(1) ?? padL} ${toY(yMin).toFixed(1)} Z`

  // Now indicator
  const nowD = new Date()
  const nowMinute = nowD.getHours() * 60 + nowD.getMinutes()
  const nowX = toX(nowMinute)
  const nowY = toY(result.currentEstimate)

  // Time labels — sparse, readable
  const timeLabels = useMemo(() => {
    if (!hasData) {
      // Empty state: show 6am–10pm with 4-hour intervals
      return [
        { minute: 360, label: '6am' },
        { minute: 540, label: '9am' },
        { minute: 720, label: '12pm' },
        { minute: 900, label: '3pm' },
        { minute: 1080, label: '6pm' },
        { minute: 1260, label: '9pm' },
      ]
    }
    if (result.points.length < 2) return []
    const minM = result.points[0].time
    const maxM = result.points[result.points.length - 1].time
    const range = maxM - minM
    // Pick interval: 1hr if range < 6hrs, 2hrs if < 12hrs, 3hrs otherwise
    const interval = range < 360 ? 60 : range < 720 ? 120 : 180
    const labels: { minute: number; label: string }[] = []
    const startHour = Math.ceil(minM / interval) * interval
    for (let m = startHour; m <= maxM; m += interval) {
      labels.push({ minute: m, label: formatMinuteAsHour(m) })
    }
    return labels
  }, [result.points, hasData])

  // Food entry markers
  const foodMarkers = entries
    .filter(e => e.glycemic_load != null)
    .map(e => {
      const d = new Date(e.created_at)
      const m = d.getHours() * 60 + d.getMinutes()
      return { minute: m, color: TL_DOT_COLORS[e.result_traffic_light ?? 'green'] ?? '#999' }
    })

  // Zone thresholds
  const zones = [
    { value: DANGER_ZONES.normal_ceiling, label: t('glucose.normal'), color: '#2ECC71' },
    { value: DANGER_ZONES.elevated, label: t('glucose.elevated'), color: '#F39C12' },
    { value: DANGER_ZONES.high, label: t('glucose.high'), color: '#E74C3C' },
  ]

  // Unique gradient ID
  const gradId = 'glucoseGrad'

  return (
    <div className="surface-card overflow-hidden" style={{ boxShadow: '0px 12px 32px rgba(26, 28, 27, 0.06)' }}>
      {/* ── SVG Chart ──────────────────────────────── */}
      <div className="px-2 pt-3 pb-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CURVE_STROKE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CURVE_STROKE} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Zone threshold lines + right-aligned labels */}
          {zones.map(z => {
            if (z.value >= yMax) return null
            const y = toY(z.value)
            return (
              <g key={z.label}>
                <line
                  x1={padL} y1={y} x2={padL + plotW} y2={y}
                  stroke={z.color} strokeWidth={0.7} strokeDasharray="6,4" opacity={0.35}
                />
                {/* Right-side zone label */}
                <text
                  x={padL + plotW + 8} y={y + 3}
                  fontSize={8} fontWeight={600} fill={z.color}
                  letterSpacing="0.04em"
                >
                  {z.label}
                </text>
                {/* mg/dL value on left */}
                <text x={padL - 5} y={y + 3} textAnchor="end" fontSize={7.5} fill="#aaa">
                  {z.value}
                </text>
              </g>
            )
          })}

          {/* Baseline */}
          <line
            x1={padL} y1={toY(result.baseline)} x2={padL + plotW} y2={toY(result.baseline)}
            stroke="#ddd" strokeWidth={0.7} strokeDasharray="4,3"
          />
          <text x={padL - 5} y={toY(result.baseline) + 3} textAnchor="end" fontSize={7.5} fill="#bbb">
            {result.baseline}
          </text>
          <text
            x={padL + plotW + 8} y={toY(result.baseline) + 3}
            fontSize={7.5} fill="#bbb" fontStyle="italic"
          >
            {t('glucose.baseline')}
          </text>

          {/* Gradient fill area */}
          {hasData && pathPoints.length > 1 && (
            <path d={fillD} fill={`url(#${gradId})`} />
          )}

          {/* Smooth curve line */}
          {hasData && pathPoints.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke={CURVE_STROKE}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Empty state: dashed baseline */}
          {!hasData && (
            <line
              x1={padL} y1={toY(result.baseline)} x2={padL + plotW} y2={toY(result.baseline)}
              stroke="#ccc" strokeWidth={1.5} strokeDasharray="8,5"
            />
          )}

          {/* Food entry dots on baseline */}
          {foodMarkers.map((m, i) => (
            <circle
              key={i}
              cx={toX(m.minute)} cy={toY(result.baseline)}
              r={3.5} fill={m.color} stroke="white" strokeWidth={1.2}
            />
          ))}

          {/* Now indicator dot on curve */}
          {hasData && nowX >= padL && nowX <= padL + plotW && (
            <>
              <line
                x1={nowX} y1={padTop} x2={nowX} y2={h - padBot}
                stroke="#ddd" strokeWidth={0.5} strokeDasharray="3,3"
              />
              <circle
                cx={nowX} cy={nowY}
                r={5} fill={CURVE_STROKE} stroke="white" strokeWidth={2}
              />
            </>
          )}

          {/* Peak annotation */}
          {hasData && result.peakValue > result.baseline + 5 && (
            <text
              x={toX(result.peakMinute)}
              y={toY(result.peakValue) - 10}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill={CURVE_STROKE}
            >
              {result.peakValue} mg/dL
            </text>
          )}

          {/* Time labels */}
          {timeLabels.map(t => (
            <text
              key={t.minute}
              x={toX(t.minute)}
              y={h - 4}
              textAnchor="middle"
              fontSize={8}
              fill="#aaa"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>

      {/* ── Peak summary pill ──────────────────────── */}
      {hasData && result.peakValue > result.baseline + 5 && (
        <div className="mx-5 mb-4">
          <div className="surface-section flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'rgba(232, 168, 56, 0.15)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={CURVE_STROKE} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-body text-on-surface">
                {t('glucose.peakEstimate')} <strong style={{ color: CURVE_STROKE }}>{result.peakValue} mg/dL</strong> {t('glucose.peakAt')} {formatMinuteAsHour(result.peakMinute)}
              </p>
              <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
                {t('glucose.returnBase')}{Math.round(((result.peakMinute + 120) - result.peakMinute) / 60 * 10) / 10} {t('glucose.returnHrs')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state bottom padding ──────────────── */}
      {!hasData && (
        <div className="pb-2"></div>
      )}
    </div>
  )
}

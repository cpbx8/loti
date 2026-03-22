/**
 * DailyGlucoseCurve — premium glucose status card for the dashboard.
 * Shows composite estimated blood glucose over the day from logged foods.
 */

import { useMemo } from 'react'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useProfile } from '@/hooks/useProfile'
import { computeDailyGlucose, formatMinuteAsHour, DANGER_ZONES } from '@/lib/glucoseModel'

const STATUS_CONFIG = {
  stable:   { label: 'ESTABLE',  bg: 'bg-tl-green-bg',  text: 'text-tl-green-fill',  dot: 'bg-tl-green-fill',  stroke: '#2ECC71', fill: 'rgba(46,204,113,0.15)' },
  elevated: { label: 'ELEVADO',  bg: 'bg-tl-yellow-bg', text: 'text-tl-yellow-fill', dot: 'bg-tl-yellow-fill', stroke: '#F39C12', fill: 'rgba(243,156,18,0.15)' },
  high:     { label: 'ALTO',     bg: 'bg-tl-red-bg',    text: 'text-tl-red-fill',    dot: 'bg-tl-red-fill',    stroke: '#E74C3C', fill: 'rgba(231,76,60,0.15)' },
}

const TL_DOT_COLORS: Record<string, string> = {
  green: '#2ECC71',
  yellow: '#F39C12',
  red: '#E74C3C',
}

interface Props {
  entries: FoodLogEntry[]
}

export default function DailyGlucoseCurve({ entries }: Props) {
  const { profile } = useProfile()
  const healthState = profile?.health_state || 'healthy'

  const result = useMemo(
    () => computeDailyGlucose(entries, healthState),
    [entries, healthState]
  )

  const config = STATUS_CONFIG[result.status]
  const hasData = entries.some(e => e.glycemic_load != null && e.glycemic_load > 0)

  // SVG dimensions
  const w = 340
  const h = 120
  const padL = 35
  const padR = 10
  const padTop = 8
  const padBot = 20
  const plotW = w - padL - padR
  const plotH = h - padTop - padBot

  // Y-axis range
  const yMin = 70
  const yMax = Math.max(160, result.peakValue + 15)

  const toX = (minute: number) => {
    if (result.points.length < 2) return padL
    const minM = result.points[0].minuteOfDay
    const maxM = result.points[result.points.length - 1].minuteOfDay
    const range = maxM - minM || 1
    return padL + ((minute - minM) / range) * plotW
  }

  const toY = (mgDl: number) => {
    const norm = (mgDl - yMin) / (yMax - yMin)
    return padTop + plotH * (1 - Math.max(0, Math.min(1, norm)))
  }

  // Build smooth path
  const pathPoints = result.points.map(p => ({ x: toX(p.time), y: toY(p.glucose) }))
  const pathD = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const fillD = pathD + ` L ${pathPoints[pathPoints.length - 1]?.x.toFixed(1) ?? padL} ${toY(yMin).toFixed(1)} L ${pathPoints[0]?.x.toFixed(1) ?? padL} ${toY(yMin).toFixed(1)} Z`

  // Now indicator
  const nowD = new Date()
  const nowMinute = nowD.getHours() * 60 + nowD.getMinutes()
  const nowX = toX(nowMinute)
  const nowY = toY(result.currentEstimate)

  // Time labels — show a few hours across the range
  const timeLabels = useMemo(() => {
    if (result.points.length < 2) return []
    const minM = result.points[0].minuteOfDay
    const maxM = result.points[result.points.length - 1].minuteOfDay
    const labels: { minute: number; label: string }[] = []
    // Round start up to next hour
    const startHour = Math.ceil(minM / 60) * 60
    for (let m = startHour; m <= maxM; m += 60) {
      labels.push({ minute: m, label: formatMinuteAsHour(m) })
    }
    return labels
  }, [result.points])

  // Food entry markers
  const foodMarkers = entries
    .filter(e => e.glycemic_load != null)
    .map(e => {
      const d = new Date(e.created_at)
      const m = d.getHours() * 60 + d.getMinutes()
      return { minute: m, color: TL_DOT_COLORS[e.result_traffic_light ?? 'green'] ?? '#999' }
    })

  // ADA danger zone thresholds
  const greenBoundary = DANGER_ZONES.normal_ceiling   // 140 mg/dL
  const yellowBoundary = DANGER_ZONES.elevated         // 180 mg/dL

  // Description
  const description = hasData
    ? result.status === 'stable'
      ? 'Tu glucosa está estable hoy. Buen trabajo manteniendo alimentos de bajo impacto.'
      : result.status === 'elevated'
        ? 'Tu glucosa está algo elevada. Considera agregar fibra o proteína a tu próxima comida.'
        : 'Tu glucosa está alta. Intenta caminar 10 minutos o beber agua.'
    : 'Escanea tu primer alimento para ver tu curva de glucosa estimada.'

  return (
    <div className="mx-5 rounded-2xl bg-card shadow-md overflow-hidden">
      {/* Top section */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Glucosa estimada</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-text-primary">{result.currentEstimate}</span>
              <span className="text-sm font-medium text-text-tertiary">mg/dL</span>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full ${config.bg} px-3 py-1`}>
            <div className={`h-2 w-2 rounded-full ${config.dot}`} />
            <span className={`text-[11px] font-bold ${config.text} tracking-wide`}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* SVG Curve */}
      <div className="px-2">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Threshold zones (faint horizontal lines) */}
          {hasData && greenBoundary < yMax && (
            <line
              x1={padL} y1={toY(greenBoundary)} x2={w - padR} y2={toY(greenBoundary)}
              stroke="#2ECC71" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.4}
            />
          )}
          {hasData && yellowBoundary < yMax && (
            <line
              x1={padL} y1={toY(yellowBoundary)} x2={w - padR} y2={toY(yellowBoundary)}
              stroke="#F39C12" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.4}
            />
          )}

          {/* Baseline */}
          <line
            x1={padL} y1={toY(result.baseline)} x2={w - padR} y2={toY(result.baseline)}
            stroke="#E0E0E0" strokeWidth={0.7}
          />

          {/* Filled area */}
          {hasData && pathPoints.length > 1 && (
            <path d={fillD} fill={config.fill} />
          )}

          {/* Curve line */}
          {hasData && pathPoints.length > 1 && (
            <path d={pathD} fill="none" stroke={config.stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Flat baseline when no data */}
          {!hasData && (
            <line
              x1={padL} y1={toY(result.baseline)} x2={w - padR} y2={toY(result.baseline)}
              stroke="#CCC" strokeWidth={1.5} strokeDasharray="6,4"
            />
          )}

          {/* Food entry markers on baseline */}
          {foodMarkers.map((m, i) => (
            <circle
              key={i}
              cx={toX(m.minute)} cy={toY(result.baseline)}
              r={3.5} fill={m.color} stroke="white" strokeWidth={1}
            />
          ))}

          {/* Now indicator */}
          {hasData && nowX >= padL && nowX <= w - padR && (
            <>
              <line
                x1={nowX} y1={padTop} x2={nowX} y2={h - padBot}
                stroke="#CCC" strokeWidth={0.5} strokeDasharray="3,3"
              />
              <circle
                cx={nowX} cy={nowY}
                r={5} fill={config.stroke} stroke="white" strokeWidth={2}
              />
            </>
          )}

          {/* Y-axis labels */}
          <text x={padL - 4} y={toY(result.baseline) + 3} textAnchor="end" fontSize={8} fill="#999">{result.baseline}</text>
          {hasData && greenBoundary < yMax && (
            <text x={padL - 4} y={toY(greenBoundary) + 3} textAnchor="end" fontSize={8} fill="#2ECC71">{Math.round(greenBoundary)}</text>
          )}

          {/* Time labels */}
          {timeLabels.map(t => (
            <text
              key={t.minute}
              x={toX(t.minute)}
              y={h - 3}
              textAnchor="middle"
              fontSize={8}
              fill="#999"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>

      {/* Description */}
      <div className="px-4 pb-4 pt-1">
        <p className="text-[13px] text-text-secondary leading-snug">{description}</p>
      </div>
    </div>
  )
}

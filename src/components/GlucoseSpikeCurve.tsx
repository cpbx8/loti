/**
 * GlucoseSpikeCurve — personalized glucose response curve for a single food.
 *
 * Uses health-state-aware model:
 *   - Fasting baseline varies (healthy: 85, prediabetic: 112, type2: 150)
 *   - Insulin resistance multiplier on spike amplitude
 *   - Peak timing varies by health state
 *   - ADA danger zone reference lines (140, 180, 200 mg/dL)
 *   - Optional comparison mode with swap suggestion
 */

import { useMemo } from 'react'
import type { TrafficLight } from '@/types/shared'
import { useProfile } from '@/hooks/useProfile'
import {
  generateGlucoseCurve,
  getCurveParams,
  estimateSwapGL,
  DANGER_ZONES,
} from '@/lib/glucoseModel'

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
  gi: number
  gl: number
  trafficLight: TrafficLight
  peakMgDl?: { low: number; high: number }
  swapGL?: number | null
  className?: string
}

const CURVE_COLORS: Record<TrafficLight, string> = {
  green: '#2ECC71',
  yellow: '#F39C12',
  red: '#E74C3C',
}

export default function GlucoseSpikeCurve({ gl, trafficLight, swapGL, className }: Props) {
  const { profile } = useProfile()
  const healthState = profile?.health_state || 'healthy'
  const curveColor = CURVE_COLORS[trafficLight]

  const data = useMemo(() => generateGlucoseCurve(gl, healthState), [gl, healthState])
  const params = useMemo(() => getCurveParams(gl, healthState), [gl, healthState])

  // Comparison curve
  const effectiveSwapGL = swapGL ?? (trafficLight !== 'green' ? estimateSwapGL(gl) : null)
  const swapData = useMemo(
    () => effectiveSwapGL ? generateGlucoseCurve(effectiveSwapGL, healthState) : null,
    [effectiveSwapGL, healthState]
  )
  const swapParams = useMemo(
    () => effectiveSwapGL ? getCurveParams(effectiveSwapGL, healthState) : null,
    [effectiveSwapGL, healthState]
  )

  const peak = params.baseline + params.peakRise
  const swapPeak = swapParams ? swapParams.baseline + swapParams.peakRise : 0

  // SVG dimensions
  const w = 340
  const h = 160
  const padL = 38
  const padR = 10
  const padTop = 10
  const padBot = 24
  const plotW = w - padL - padR
  const plotH = h - padTop - padBot

  // Y range
  const yMin = 60
  const yMax = Math.max(peak + 20, 200)

  const toX = (t: number) => padL + (t / 180) * plotW
  const toY = (mg: number) => padTop + plotH * (1 - (mg - yMin) / (yMax - yMin))

  // Build smooth Catmull-Rom paths
  const toPoints = (pts: { time: number; glucose: number }[]) =>
    pts.map(p => ({ x: toX(p.time), y: toY(p.glucose) }))

  const mainPath = catmullRomPath(toPoints(data))
  const mainFill = mainPath + ` L ${toX(180)} ${toY(params.baseline)} L ${toX(0)} ${toY(params.baseline)} Z`

  const swapPath = swapData ? catmullRomPath(toPoints(swapData)) : null

  // Peak point
  const peakPoint = data.reduce((max, p) => p.glucose > max.glucose ? p : max, data[0])

  // Time labels
  const timeLabels = [0, 30, 60, 90, 120, 180]

  // Danger zone lines to show
  const showZones = [
    { value: DANGER_ZONES.normal_ceiling, color: '#2ECC71', show: true },
    { value: DANGER_ZONES.elevated, color: '#F39C12', show: peak > 160 },
    { value: DANGER_ZONES.high, color: '#E74C3C', show: peak > 190 },
  ]

  // Summary text
  const returnHrs = Math.round(params.timeToBaseline / 60 * 10) / 10
  const reduction = swapParams ? Math.round((1 - (swapParams.peakRise / params.peakRise)) * 100) : 0

  return (
    <div className={`surface-card p-4 ${className ?? ''}`}>
      <p className="text-label text-on-surface-variant mb-2">
        Tu respuesta de glucosa estimada
      </p>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Baseline */}
        <line
          x1={padL} y1={toY(params.baseline)} x2={w - padR} y2={toY(params.baseline)}
          stroke="#9B9B9B" strokeWidth={1} strokeDasharray="4,4"
        />
        <text x={padL - 4} y={toY(params.baseline) + 3} textAnchor="end" fontSize={8} fill="#9B9B9B">
          {params.baseline}
        </text>

        {/* Danger zone lines */}
        {showZones.filter(z => z.show && z.value < yMax).map(z => (
          <g key={z.value}>
            <line
              x1={padL} y1={toY(z.value)} x2={w - padR} y2={toY(z.value)}
              stroke={z.color} strokeWidth={1} strokeDasharray="6,4" opacity={0.4}
            />
            <text x={padL - 4} y={toY(z.value) + 3} textAnchor="end" fontSize={8} fill={z.color} opacity={0.6}>
              {z.value}
            </text>
          </g>
        ))}

        {/* Swap curve (green, behind main) */}
        {swapPath && (
          <path d={swapPath} fill="none" stroke="#2ECC71" strokeWidth={2} strokeDasharray="6,3" opacity={0.7} />
        )}

        {/* Main curve fill */}
        <path d={mainFill} fill={curveColor} opacity={0.12} />

        {/* Main curve line */}
        <path d={mainPath} fill="none" stroke={curveColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Peak dot + label */}
        <circle
          cx={toX(peakPoint.time)} cy={toY(peakPoint.glucose)}
          r={4} fill={curveColor} stroke="white" strokeWidth={1.5}
        />
        <text
          x={toX(peakPoint.time)} y={toY(peakPoint.glucose) - 8}
          textAnchor="middle" fontSize={9} fontWeight={700} fill={curveColor}
        >
          {Math.round(peakPoint.glucose)} mg/dL
        </text>

        {/* Time labels */}
        {timeLabels.map(t => (
          <text key={t} x={toX(t)} y={h - 4} textAnchor="middle" fontSize={9} fill="#999">
            {t}
          </text>
        ))}

        {/* X axis label */}
        <text x={w / 2} y={h + 2} textAnchor="middle" fontSize={8} fill="#BBB">
          minutos
        </text>
      </svg>

      {/* Summary */}
      <p className="text-[12px] text-text-secondary mt-1 leading-snug">
        Pico estimado: {Math.round(peak)} mg/dL a los {params.timeToPeak} min. Vuelve cerca de tu base en ~{returnHrs} hrs.
      </p>

      {/* Comparison legend */}
      {swapData && (
        <div className="mt-2 flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: curveColor }} />
            Actual: {Math.round(peak)} mg/dL
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 rounded-sm bg-tl-green-fill" style={{ borderTop: '2px dashed #2ECC71' }} />
            Alternativa: {Math.round(swapPeak)} mg/dL
          </span>
          <span className="font-semibold text-tl-green-fill">
            → {reduction}% menos
          </span>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-text-tertiary mt-1.5">
        Estimación basada en tu perfil. No reemplaza monitoreo real (CGM).
      </p>
    </div>
  )
}

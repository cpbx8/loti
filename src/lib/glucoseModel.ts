/**
 * Glucose simulation model — clinically-informed estimate of blood glucose response.
 *
 * Based on published CGM data:
 *   - Fasting baselines from ADA clinical ranges by health state
 *   - GL → mg/dL rise at ~2.8 mg/dL per GL unit (healthy), scaled by insulin resistance
 *   - Peak timing varies by health state (healthy ~35min, type2 ~75min)
 *   - Modified sine rise, exponential decay fall
 *   - Danger zones from ADA guidelines: 140 (normal ceiling), 180 (elevated), 200 (high)
 *
 * DISCLAIMER: Educational estimate, NOT a medical measurement.
 */

import type { FoodLogEntry } from '@/hooks/useDailyLog'

// ─── Types ───────────────────────────────────────────────────

export interface GlucosePoint {
  time: number       // minutes from eating (single food) or minuteOfDay (daily)
  glucose: number    // mg/dL
}

export interface CurveParams {
  baseline: number
  peakRise: number
  timeToPeak: number
  timeToBaseline: number
  returnFraction: number
}

export interface DailyGlucoseResult {
  points: GlucosePoint[]
  currentEstimate: number
  peakValue: number
  peakMinute: number
  status: 'stable' | 'elevated' | 'high'
  baseline: number
}

// ─── ADA Danger Zones ────────────────────────────────────────

export const DANGER_ZONES = {
  normal_ceiling: 140,   // ADA: postprandial should stay below 140
  elevated: 180,         // ADA: diabetes target is below 180 post-meal
  high: 200,             // Diagnostic threshold for diabetes
}

// ─── Fasting Baselines ───────────────────────────────────────

export function getFastingBaseline(healthState: string): number {
  switch (healthState) {
    case 'healthy':     return 85    // clinical normal: 70-99
    case 'prediabetic': return 112   // clinical range: 100-125
    case 'type2':       return 150   // clinical: 126+, typical morning 140-160
    case 'gestational': return 105   // varies, typically elevated
    case 'type1':       return 140   // highly variable, moderate estimate
    default:            return 85
  }
}

// ─── Glucose Rise ────────────────────────────────────────────

export function getGlucoseRise(gl: number, healthState: string): number {
  const baseRisePerGL = 2.8
  const baseRise = gl * baseRisePerGL

  const multiplier: Record<string, number> = {
    healthy:     1.0,
    prediabetic: 1.3,    // 30% higher spike due to early insulin resistance
    type2:       1.6,    // 60% higher spike
    gestational: 1.4,    // 40% higher spike
    type1:       1.5,    // 50% higher (depends on insulin dosing)
  }

  return Math.round(baseRise * (multiplier[healthState] || 1.0))
}

// ─── Curve Parameters ────────────────────────────────────────

export function getCurveParams(gl: number, healthState: string): CurveParams {
  const baseline = getFastingBaseline(healthState)
  const peakRise = getGlucoseRise(gl, healthState)

  const timingParams: Record<string, { timeToPeak: number; timeToBaseline: number; returnFraction: number }> = {
    healthy: {
      timeToPeak: 35,
      timeToBaseline: 120,
      returnFraction: 1.0,
    },
    prediabetic: {
      timeToPeak: 50,
      timeToBaseline: 150,
      returnFraction: 1.05,
    },
    type2: {
      timeToPeak: 75,
      timeToBaseline: 210,
      returnFraction: 1.1,
    },
    gestational: {
      timeToPeak: 55,
      timeToBaseline: 160,
      returnFraction: 1.05,
    },
    type1: {
      timeToPeak: 65,
      timeToBaseline: 180,
      returnFraction: 1.08,
    },
  }

  const params = timingParams[healthState] || timingParams.healthy

  // Bigger meals peak slightly later
  const glTimingFactor = 1 + (gl - 10) * 0.005

  return {
    baseline,
    peakRise,
    timeToPeak: Math.round(params.timeToPeak * Math.max(0.9, glTimingFactor)),
    timeToBaseline: Math.round(params.timeToBaseline * Math.max(0.95, glTimingFactor)),
    returnFraction: params.returnFraction,
  }
}

// ─── Single Food Curve ───────────────────────────────────────

export function generateGlucoseCurve(gl: number, healthState: string): GlucosePoint[] {
  const params = getCurveParams(gl, healthState)
  const { baseline, peakRise, timeToPeak, timeToBaseline, returnFraction } = params

  const peak = baseline + peakRise
  const returnLevel = baseline * returnFraction
  const totalTime = 180

  const points: GlucosePoint[] = []

  for (let t = 0; t <= totalTime; t += 2) {
    let glucose: number

    if (t <= timeToPeak) {
      // Rising phase: smooth ease-in-out (modified sine)
      const progress = t / timeToPeak
      const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress))
      glucose = baseline + peakRise * easedProgress
    } else {
      // Falling phase: exponential decay toward return level
      const fallProgress = (t - timeToPeak) / (timeToBaseline - timeToPeak)
      const clampedProgress = Math.min(fallProgress, 1)
      const decayRate = 3.0
      const easedDecay = 1 - Math.exp(-decayRate * clampedProgress)
      glucose = peak - (peak - returnLevel) * easedDecay
    }

    // Small physiological noise for realism
    const noise = (Math.sin(t * 0.7) + Math.sin(t * 1.3)) * 1.0
    glucose = Math.round((glucose + noise) * 10) / 10

    points.push({ time: t, glucose })
  }

  return points
}

// ─── Single Food Curve Function (for composite daily) ────────

function singleFoodCurveFn(gl: number, healthState: string): (minutesSinceEating: number) => number {
  const params = getCurveParams(gl, healthState)
  const { peakRise, timeToPeak, timeToBaseline, returnFraction, baseline } = params
  const peak = baseline + peakRise
  const returnLevel = baseline * returnFraction
  const onsetDelay = 15

  return (t: number): number => {
    const effectiveT = t - onsetDelay
    if (effectiveT <= 0 || effectiveT > 210) return 0 // beyond effect window

    if (effectiveT <= timeToPeak) {
      const progress = effectiveT / timeToPeak
      const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress))
      return peakRise * easedProgress
    } else {
      const fallProgress = (effectiveT - timeToPeak) / (timeToBaseline - timeToPeak)
      const clampedProgress = Math.min(fallProgress, 1)
      const decayRate = 3.0
      const easedDecay = 1 - Math.exp(-decayRate * clampedProgress)
      const currentLevel = peak - (peak - returnLevel) * easedDecay
      return Math.max(0, currentLevel - baseline)
    }
  }
}

// ─── Comparison Mode ─────────────────────────────────────────

export function generateComparisonData(
  originalGL: number,
  swapGL: number,
  healthState: string
): { original: GlucosePoint[]; swap: GlucosePoint[] } {
  return {
    original: generateGlucoseCurve(originalGL, healthState),
    swap: generateGlucoseCurve(swapGL, healthState),
  }
}

export function estimateSwapGL(originalGL: number): number {
  return Math.round(originalGL * 0.45)
}

// ─── Daily Composite Curve ───────────────────────────────────

/** Parse created_at into minute-of-day */
function entryMinuteOfDay(entry: FoodLogEntry): number {
  const d = new Date(entry.created_at)
  return d.getHours() * 60 + d.getMinutes()
}

export function computeDailyGlucose(
  entries: FoodLogEntry[],
  healthState: string,
  nowMinute?: number
): DailyGlucoseResult {
  const now = nowMinute ?? (() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })()

  const baseline = getFastingBaseline(healthState)
  const validEntries = entries.filter(e => e.glycemic_load != null && e.glycemic_load > 0)

  if (validEntries.length === 0) {
    const points: GlucosePoint[] = []
    for (let m = 0; m <= 1440; m += 5) {
      points.push({ time: m, glucose: baseline })
    }
    return { points, currentEstimate: baseline, peakValue: baseline, peakMinute: now, status: 'stable', baseline }
  }

  // Build curve functions
  const curves = validEntries.map(entry => {
    const gl = (entry.glycemic_load ?? 0) * (entry.serving_count ?? 1)
    const eatenAt = entryMinuteOfDay(entry)
    const curveFn = singleFoodCurveFn(gl, healthState)
    return { eatenAt, curveFn }
  })

  // Display range
  const firstEntry = Math.min(...curves.map(c => c.eatenAt))
  const rangeStart = Math.max(0, firstEntry - 60)
  const rangeEnd = Math.min(1440, now + 120)

  const points: GlucosePoint[] = []
  let peakValue = baseline
  let peakMinute = rangeStart

  for (let m = rangeStart; m <= rangeEnd; m += 5) {
    let mgDl = baseline
    for (const { eatenAt, curveFn } of curves) {
      mgDl += curveFn(m - eatenAt)
    }
    mgDl = Math.max(60, Math.min(300, mgDl))
    points.push({ time: m, glucose: mgDl })

    if (mgDl > peakValue) {
      peakValue = mgDl
      peakMinute = m
    }
  }

  // Current estimate
  let currentEstimate = baseline
  for (const { eatenAt, curveFn } of curves) {
    currentEstimate += curveFn(now - eatenAt)
  }
  currentEstimate = Math.max(60, Math.min(300, currentEstimate))

  // Status from ADA thresholds
  let status: 'stable' | 'elevated' | 'high'
  if (currentEstimate < DANGER_ZONES.normal_ceiling) status = 'stable'
  else if (currentEstimate < DANGER_ZONES.elevated) status = 'elevated'
  else status = 'high'

  return {
    points,
    currentEstimate: Math.round(currentEstimate),
    peakValue: Math.round(peakValue),
    peakMinute,
    status,
    baseline,
  }
}

/** Format minute-of-day to hour string */
export function formatMinuteAsHour(minute: number): string {
  const h = Math.floor(minute / 60)
  if (h === 0 || h === 24) return '12am'
  if (h === 12) return '12pm'
  if (h < 12) return `${h}am`
  return `${h - 12}pm`
}

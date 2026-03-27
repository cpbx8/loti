/**
 * Pure utility functions for custom meal aggregation.
 * No side effects, no DB access — just math.
 */
import type { TrafficLight } from '@/types/shared'

const TL_RANK: Record<TrafficLight, number> = { green: 0, yellow: 1, red: 2 }
const RANK_TL: TrafficLight[] = ['green', 'yellow', 'red']

/** Return the worst (highest-impact) traffic light from a list */
export function worstTrafficLight(lights: TrafficLight[]): TrafficLight {
  if (lights.length === 0) return 'green'
  const maxRank = Math.max(...lights.map(l => TL_RANK[l]))
  return RANK_TL[maxRank]
}

/** Sum glycemic loads across items, each multiplied by its quantity */
export function sumGlycemicLoad(
  items: Array<{ glycemic_load: number; quantity: number }>,
): number {
  const raw = items.reduce((sum, item) => sum + item.glycemic_load * item.quantity, 0)
  return Math.round(raw * 10) / 10
}

/** Clamp quantity to valid range [0.1, 99] */
export function clampQuantity(qty: number): number {
  return Math.min(99, Math.max(0.1, qty))
}

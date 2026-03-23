/**
 * Meal composition utilities — pure functions for scaling and totaling food components.
 * Shared between EditableMealCard (client) and search-foods (server has its own copy).
 */
import type { FoodSearchResult } from '@/types/shared'

/** Scale a result's macros to a different gram amount */
export function scaleToGrams(r: FoodSearchResult, targetGrams: number): FoodSearchResult {
  if (r.serving_size <= 0) return r
  const ratio = targetGrams / r.serving_size
  return {
    ...r,
    calories: Math.round(r.calories * ratio),
    protein_g: Math.round(r.protein_g * ratio * 10) / 10,
    carbs_g: Math.round(r.carbs_g * ratio * 10) / 10,
    fat_g: Math.round(r.fat_g * ratio * 10) / 10,
    fiber_g: r.fiber_g != null ? Math.round(r.fiber_g * ratio * 10) / 10 : undefined,
    glycemic_load: r.glycemic_load != null
      ? Math.round(r.glycemic_load * ratio * 10) / 10
      : undefined,
    serving_size: targetGrams,
  }
}

export interface MealTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  glycemic_load: number
  /** Default traffic light based on standard GL thresholds. Use getPersonalizedTrafficLight() for user-specific thresholds. */
  traffic_light: 'green' | 'yellow' | 'red'
}

/** Compute aggregate totals from an array of food components */
export function computeTotals(components: FoodSearchResult[]): MealTotals {
  const calories = components.reduce((s, c) => s + c.calories, 0)
  const protein_g = components.reduce((s, c) => s + c.protein_g, 0)
  const carbs_g = components.reduce((s, c) => s + c.carbs_g, 0)
  const fat_g = components.reduce((s, c) => s + c.fat_g, 0)
  const fiber_g = components.reduce((s, c) => s + (c.fiber_g ?? 0), 0)
  const glycemic_load = Math.round(
    components.reduce((s, c) => s + (c.glycemic_load ?? 0), 0) * 10,
  ) / 10

  let traffic_light: 'green' | 'yellow' | 'red'
  if (glycemic_load <= 10) traffic_light = 'green'
  else if (glycemic_load <= 19) traffic_light = 'yellow'
  else traffic_light = 'red'

  return { calories, protein_g, carbs_g, fat_g, fiber_g, glycemic_load, traffic_light }
}

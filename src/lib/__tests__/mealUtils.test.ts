import { describe, it, expect } from 'vitest'
import { scaleToGrams, computeTotals } from '../mealUtils'
import type { FoodSearchResult } from '@/types/shared'

function makeFoodResult(overrides: Partial<FoodSearchResult> = {}): FoodSearchResult {
  return {
    name_es: 'Tortilla de maíz',
    calories: 100,
    protein_g: 3,
    carbs_g: 20,
    fat_g: 1.5,
    fiber_g: 2,
    serving_size: 50,
    serving_unit: 'g',
    source: 'cache' as const,
    confidence: 0.95,
    glycemic_load: 8,
    traffic_light: 'green' as const,
    ...overrides,
  }
}

describe('scaleToGrams', () => {
  it('scales macros proportionally when doubling grams', () => {
    const item = makeFoodResult({ serving_size: 50, calories: 100, carbs_g: 20 })
    const scaled = scaleToGrams(item, 100)

    expect(scaled.serving_size).toBe(100)
    expect(scaled.calories).toBe(200)
    expect(scaled.carbs_g).toBe(40)
    expect(scaled.protein_g).toBe(6)
    expect(scaled.fat_g).toBe(3)
    expect(scaled.fiber_g).toBe(4)
    expect(scaled.glycemic_load).toBe(16)
  })

  it('scales down when reducing grams', () => {
    const item = makeFoodResult({ serving_size: 100, calories: 200, carbs_g: 40 })
    const scaled = scaleToGrams(item, 25)

    expect(scaled.serving_size).toBe(25)
    expect(scaled.calories).toBe(50)
    expect(scaled.carbs_g).toBe(10)
  })

  it('returns item unchanged when serving_size is 0', () => {
    const item = makeFoodResult({ serving_size: 0, calories: 100 })
    const scaled = scaleToGrams(item, 50)

    expect(scaled).toBe(item) // same reference
    expect(scaled.calories).toBe(100)
  })

  it('returns item unchanged when serving_size is negative', () => {
    const item = makeFoodResult({ serving_size: -1 })
    const scaled = scaleToGrams(item, 50)

    expect(scaled).toBe(item)
  })

  it('handles undefined fiber_g and glycemic_load', () => {
    const item = makeFoodResult({ fiber_g: undefined, glycemic_load: undefined })
    const scaled = scaleToGrams(item, 100)

    expect(scaled.fiber_g).toBeUndefined()
    expect(scaled.glycemic_load).toBeUndefined()
  })

  it('rounds macros to 1 decimal place', () => {
    const item = makeFoodResult({ serving_size: 30, protein_g: 7, carbs_g: 11 })
    const scaled = scaleToGrams(item, 50)

    // 7 * (50/30) = 11.666... → 11.7
    expect(scaled.protein_g).toBe(11.7)
    // 11 * (50/30) = 18.333... → 18.3
    expect(scaled.carbs_g).toBe(18.3)
  })
})

describe('computeTotals', () => {
  it('sums macros across components', () => {
    const items = [
      makeFoodResult({ calories: 100, protein_g: 5, carbs_g: 20, fat_g: 2, fiber_g: 1, glycemic_load: 5 }),
      makeFoodResult({ calories: 200, protein_g: 15, carbs_g: 10, fat_g: 8, fiber_g: 3, glycemic_load: 3 }),
    ]
    const totals = computeTotals(items)

    expect(totals.calories).toBe(300)
    expect(totals.protein_g).toBe(20)
    expect(totals.carbs_g).toBe(30)
    expect(totals.fat_g).toBe(10)
    expect(totals.fiber_g).toBe(4)
    expect(totals.glycemic_load).toBe(8)
  })

  it('returns green traffic light when GL <= 10', () => {
    const items = [makeFoodResult({ glycemic_load: 5 }), makeFoodResult({ glycemic_load: 4 })]
    expect(computeTotals(items).traffic_light).toBe('green')
  })

  it('returns yellow traffic light when GL is 11-19', () => {
    const items = [makeFoodResult({ glycemic_load: 8 }), makeFoodResult({ glycemic_load: 7 })]
    expect(computeTotals(items).traffic_light).toBe('yellow')
  })

  it('returns red traffic light when GL >= 20', () => {
    const items = [makeFoodResult({ glycemic_load: 12 }), makeFoodResult({ glycemic_load: 9 })]
    expect(computeTotals(items).traffic_light).toBe('red')
  })

  it('handles components with undefined fiber_g and glycemic_load', () => {
    const items = [
      makeFoodResult({ fiber_g: undefined, glycemic_load: undefined }),
      makeFoodResult({ fiber_g: 3, glycemic_load: 5 }),
    ]
    const totals = computeTotals(items)

    expect(totals.fiber_g).toBe(3)
    expect(totals.glycemic_load).toBe(5)
  })

  it('returns zeros for empty array', () => {
    const totals = computeTotals([])
    expect(totals.calories).toBe(0)
    expect(totals.glycemic_load).toBe(0)
    expect(totals.traffic_light).toBe('green')
  })

  it('rounds glycemic_load to 1 decimal place', () => {
    const items = [
      makeFoodResult({ glycemic_load: 3.33 }),
      makeFoodResult({ glycemic_load: 2.77 }),
    ]
    // 3.33 + 2.77 = 6.1
    expect(computeTotals(items).glycemic_load).toBe(6.1)
  })
})

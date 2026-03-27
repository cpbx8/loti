import { describe, it, expect } from 'vitest'
import { worstTrafficLight, sumGlycemicLoad, clampQuantity } from '../mealGroupUtils'

describe('worstTrafficLight', () => {
  it('returns green when all items are green', () => {
    expect(worstTrafficLight(['green', 'green', 'green'])).toBe('green')
  })

  it('returns yellow when worst is yellow', () => {
    expect(worstTrafficLight(['green', 'yellow', 'green'])).toBe('yellow')
  })

  it('returns red when any item is red', () => {
    expect(worstTrafficLight(['green', 'yellow', 'red'])).toBe('red')
  })

  it('returns green for empty array', () => {
    expect(worstTrafficLight([])).toBe('green')
  })
})

describe('sumGlycemicLoad', () => {
  it('sums GL values multiplied by quantity', () => {
    const items = [
      { glycemic_load: 3, quantity: 1 },
      { glycemic_load: 7, quantity: 2 },
    ]
    expect(sumGlycemicLoad(items)).toBe(17)
  })

  it('returns 0 for empty array', () => {
    expect(sumGlycemicLoad([])).toBe(0)
  })

  it('rounds to 1 decimal place', () => {
    const items = [
      { glycemic_load: 3.33, quantity: 1 },
      { glycemic_load: 2.77, quantity: 1 },
    ]
    expect(sumGlycemicLoad(items)).toBe(6.1)
  })
})

describe('clampQuantity', () => {
  it('clamps below minimum to 0.1', () => {
    expect(clampQuantity(0)).toBe(0.1)
    expect(clampQuantity(-5)).toBe(0.1)
  })

  it('clamps above maximum to 99', () => {
    expect(clampQuantity(100)).toBe(99)
    expect(clampQuantity(999)).toBe(99)
  })

  it('passes through valid values', () => {
    expect(clampQuantity(1)).toBe(1)
    expect(clampQuantity(0.5)).toBe(0.5)
    expect(clampQuantity(50)).toBe(50)
  })
})

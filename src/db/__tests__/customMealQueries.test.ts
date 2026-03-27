import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { NewCustomMealItem } from '../customMealQueries'

// Mock localStorage for node environment
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { for (const k of Object.keys(store)) delete store[k] },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// Since SQLite isn't available in test env, we test the localStorage fallback path.
describe('customMealQueries (localStorage fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('creates a meal and returns its id', async () => {
    const { createCustomMeal } = await import('../customMealQueries')
    const id = await createCustomMeal('Protein Shake', '🥤')
    expect(id).toBeTruthy()
    expect(typeof id).toBe('string')
  })

  it('lists created meals', async () => {
    const { createCustomMeal, getCustomMeals } = await import('../customMealQueries')
    await createCustomMeal('Protein Shake', '🥤')
    // Ensure different timestamps
    await new Promise(r => setTimeout(r, 10))
    await createCustomMeal('Smoothie Bowl', '🥣')

    const meals = await getCustomMeals()
    expect(meals).toHaveLength(2)
    expect(meals[0].name).toBe('Smoothie Bowl') // newest first
    expect(meals[1].name).toBe('Protein Shake')
  })

  it('adds items to a meal', async () => {
    const { createCustomMeal, addCustomMealItem, getCustomMealItems } = await import('../customMealQueries')
    const mealId = await createCustomMeal('Shake', '🥤')

    const item: NewCustomMealItem = {
      food_name: 'Whey Protein',
      food_name_en: 'Whey Protein',
      serving_size_g: 30,
      quantity: 1,
      calories_kcal: 120,
      protein_g: 24,
      carbs_g: 3,
      fat_g: 1,
      fiber_g: 0,
      glycemic_load: 1,
      traffic_light: 'green',
      sort_order: 0,
    }

    await addCustomMealItem(mealId, item)
    const items = await getCustomMealItems(mealId)
    expect(items).toHaveLength(1)
    expect(items[0].food_name).toBe('Whey Protein')
    expect(items[0].glycemic_load).toBe(1)
  })

  it('deletes a meal and its items', async () => {
    const { createCustomMeal, addCustomMealItem, deleteCustomMeal, getCustomMeals, getCustomMealItems } = await import('../customMealQueries')
    const mealId = await createCustomMeal('Shake', '🥤')
    await addCustomMealItem(mealId, {
      food_name: 'Milk', food_name_en: 'Milk', serving_size_g: 240, quantity: 1,
      calories_kcal: 149, protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0,
      glycemic_load: 3, traffic_light: 'green', sort_order: 0,
    })

    await deleteCustomMeal(mealId)
    expect(await getCustomMeals()).toHaveLength(0)
    expect(await getCustomMealItems(mealId)).toHaveLength(0)
  })

  it('updates meal name and icon', async () => {
    const { createCustomMeal, updateCustomMeal, getCustomMeals } = await import('../customMealQueries')
    const mealId = await createCustomMeal('Old Name', '🍽️')
    await updateCustomMeal(mealId, { name: 'New Name', icon: '🥗' })

    const meals = await getCustomMeals()
    expect(meals[0].name).toBe('New Name')
    expect(meals[0].icon).toBe('🥗')
  })

  it('removes a single item from a meal', async () => {
    const { createCustomMeal, addCustomMealItem, removeCustomMealItem, getCustomMealItems } = await import('../customMealQueries')
    const mealId = await createCustomMeal('Shake', '🥤')

    await addCustomMealItem(mealId, {
      food_name: 'Milk', food_name_en: 'Milk', serving_size_g: 240, quantity: 1,
      calories_kcal: 149, protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0,
      glycemic_load: 3, traffic_light: 'green', sort_order: 0,
    })
    await addCustomMealItem(mealId, {
      food_name: 'Banana', food_name_en: 'Banana', serving_size_g: 118, quantity: 1,
      calories_kcal: 105, protein_g: 1, carbs_g: 27, fat_g: 0, fiber_g: 3,
      glycemic_load: 7, traffic_light: 'yellow', sort_order: 1,
    })

    const items = await getCustomMealItems(mealId)
    await removeCustomMealItem(items[0].id)
    const remaining = await getCustomMealItems(mealId)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].food_name).toBe('Banana')
  })
})

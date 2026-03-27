/**
 * CRUD operations for custom meals.
 * Mirrors the pattern in queries.ts — SQLite primary, localStorage fallback.
 */
import { getDb } from './database'

// ─── Types ──────────────────────────────────────────────────────

export interface CustomMeal {
  id: string
  name: string
  icon: string
  created_at: string
  updated_at: string
}

export interface CustomMealItem {
  id: string
  meal_id: string
  food_name: string
  food_name_en: string | null
  serving_size_g: number | null
  quantity: number
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  glycemic_load: number | null
  traffic_light: string | null
  sort_order: number
}

export interface NewCustomMealItem {
  food_name: string
  food_name_en: string | null
  serving_size_g: number | null
  quantity: number
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  glycemic_load: number | null
  traffic_light: string | null
  sort_order: number
}

const LS_MEALS_KEY = 'loti_custom_meals'
const LS_ITEMS_KEY = 'loti_custom_meal_items'

// ─── Helper ─────────────────────────────────────────────────────

function lsGet<T>(key: string): T[] {
  return JSON.parse(localStorage.getItem(key) || '[]')
}

function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── CREATE ─────────────────────────────────────────────────────

export async function createCustomMeal(name: string, icon: string = '🍽️'): Promise<string> {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  if (!db) {
    const meals = lsGet<CustomMeal>(LS_MEALS_KEY)
    meals.push({ id, name, icon, created_at: now, updated_at: now })
    lsSet(LS_MEALS_KEY, meals)
    return id
  }

  await db.run(
    'INSERT INTO custom_meals (id, name, icon) VALUES (?, ?, ?)',
    [id, name, icon],
  )
  return id
}

export async function addCustomMealItem(mealId: string, item: NewCustomMealItem): Promise<string> {
  const db = getDb()
  const id = crypto.randomUUID()

  if (!db) {
    const items = lsGet<CustomMealItem>(LS_ITEMS_KEY)
    items.push({ id, meal_id: mealId, ...item })
    lsSet(LS_ITEMS_KEY, items)
    return id
  }

  await db.run(
    `INSERT INTO custom_meal_items
     (id, meal_id, food_name, food_name_en, serving_size_g, quantity,
      calories_kcal, protein_g, carbs_g, fat_g, fiber_g,
      glycemic_load, traffic_light, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, mealId, item.food_name, item.food_name_en,
      item.serving_size_g, item.quantity,
      item.calories_kcal, item.protein_g, item.carbs_g, item.fat_g, item.fiber_g,
      item.glycemic_load, item.traffic_light, item.sort_order,
    ],
  )
  return id
}

// ─── READ ───────────────────────────────────────────────────────

export async function getCustomMeals(): Promise<CustomMeal[]> {
  const db = getDb()
  if (!db) {
    return lsGet<CustomMeal>(LS_MEALS_KEY).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }

  const result = await db.query('SELECT * FROM custom_meals ORDER BY created_at DESC')
  return (result.values || []) as CustomMeal[]
}

export async function getCustomMealById(id: string): Promise<CustomMeal | null> {
  const db = getDb()
  if (!db) {
    return lsGet<CustomMeal>(LS_MEALS_KEY).find(m => m.id === id) ?? null
  }

  const result = await db.query('SELECT * FROM custom_meals WHERE id = ?', [id])
  return (result.values?.[0] as CustomMeal) ?? null
}

export async function getCustomMealItems(mealId: string): Promise<CustomMealItem[]> {
  const db = getDb()
  if (!db) {
    return lsGet<CustomMealItem>(LS_ITEMS_KEY)
      .filter(i => i.meal_id === mealId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  const result = await db.query(
    'SELECT * FROM custom_meal_items WHERE meal_id = ? ORDER BY sort_order ASC',
    [mealId],
  )
  return (result.values || []) as CustomMealItem[]
}

// ─── UPDATE ─────────────────────────────────────────────────────

export async function updateCustomMeal(
  id: string,
  updates: { name?: string; icon?: string },
): Promise<void> {
  const db = getDb()
  if (!db) {
    const meals = lsGet<CustomMeal>(LS_MEALS_KEY)
    const idx = meals.findIndex(m => m.id === id)
    if (idx >= 0) {
      if (updates.name !== undefined) meals[idx].name = updates.name
      if (updates.icon !== undefined) meals[idx].icon = updates.icon
      meals[idx].updated_at = new Date().toISOString()
      lsSet(LS_MEALS_KEY, meals)
    }
    return
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon) }
  if (fields.length === 0) return

  fields.push("updated_at = datetime('now')")
  values.push(id)
  await db.run(`UPDATE custom_meals SET ${fields.join(', ')} WHERE id = ?`, values)
}

export async function updateCustomMealItemQuantity(
  itemId: string,
  quantity: number,
): Promise<void> {
  const db = getDb()
  if (!db) {
    const items = lsGet<CustomMealItem>(LS_ITEMS_KEY)
    const idx = items.findIndex(i => i.id === itemId)
    if (idx >= 0) {
      items[idx].quantity = quantity
      lsSet(LS_ITEMS_KEY, items)
    }
    return
  }

  await db.run('UPDATE custom_meal_items SET quantity = ? WHERE id = ?', [quantity, itemId])
}

// ─── DELETE ─────────────────────────────────────────────────────

export async function deleteCustomMeal(id: string): Promise<void> {
  const db = getDb()
  if (!db) {
    lsSet(LS_MEALS_KEY, lsGet<CustomMeal>(LS_MEALS_KEY).filter(m => m.id !== id))
    lsSet(LS_ITEMS_KEY, lsGet<CustomMealItem>(LS_ITEMS_KEY).filter(i => i.meal_id !== id))
    return
  }

  await db.run('DELETE FROM custom_meal_items WHERE meal_id = ?', [id])
  await db.run('DELETE FROM custom_meals WHERE id = ?', [id])
}

export async function removeCustomMealItem(itemId: string): Promise<void> {
  const db = getDb()
  if (!db) {
    lsSet(LS_ITEMS_KEY, lsGet<CustomMealItem>(LS_ITEMS_KEY).filter(i => i.id !== itemId))
    return
  }

  await db.run('DELETE FROM custom_meal_items WHERE id = ?', [itemId])
}

// ─── LOG A CUSTOM MEAL ──────────────────────────────────────────

/**
 * Log all items of a custom meal into scan_logs with a shared meal_group_id.
 * Each item becomes its own scan_logs entry, scaled by the given multiplier.
 */
export async function logCustomMeal(
  mealId: string,
  multiplier: number = 1,
  itemOverrides?: Map<string, { quantity: number }>,
): Promise<string> {
  // Imported here to avoid circular dependency
  const { insertScanLog } = await import('./queries')

  const meal = await getCustomMealById(mealId)
  if (!meal) throw new Error(`Custom meal not found: ${mealId}`)

  const items = await getCustomMealItems(mealId)
  if (items.length === 0) throw new Error('Cannot log empty meal')

  const groupId = crypto.randomUUID()

  for (const item of items) {
    const qty = (itemOverrides?.get(item.id)?.quantity ?? item.quantity) * multiplier

    await insertScanLog({
      food_name: item.food_name,
      food_name_en: item.food_name_en,
      glycemic_load: (item.glycemic_load ?? 0) * qty,
      traffic_light: item.traffic_light ?? 'green',
      input_method: 'custom_meal',
      quantity: 1, // qty is already baked into the GL value
      serving_size_g: item.serving_size_g != null ? item.serving_size_g * qty : null,
      calories_kcal: item.calories_kcal != null ? Math.round(item.calories_kcal * qty) : null,
      protein_g: item.protein_g != null ? Math.round(item.protein_g * qty * 10) / 10 : null,
      carbs_g: item.carbs_g != null ? Math.round(item.carbs_g * qty * 10) / 10 : null,
      fat_g: item.fat_g != null ? Math.round(item.fat_g * qty * 10) / 10 : null,
      fiber_g: item.fiber_g != null ? Math.round(item.fiber_g * qty * 10) / 10 : null,
      meal_group_id: groupId,
    })
  }

  return groupId
}

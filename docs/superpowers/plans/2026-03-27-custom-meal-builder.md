# Custom Meal Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users compose multi-ingredient meals, save them, and log them with per-ingredient GL tracking.

**Architecture:** Two new SQLite tables (`custom_meals`, `custom_meal_items`) + a `meal_group_id` column on `scan_logs`. New React hook `useCustomMeals` wraps CRUD. Three new screens: builder, log confirmation, and a "My Meals" list. TabBar gets a 5th scan menu option.

**Tech Stack:** React 18, React Router v7, TanStack Query v5, SQLite (Capacitor), Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-03-27-custom-meal-builder-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/db/customMealQueries.ts` | CRUD for `custom_meals` + `custom_meal_items` tables, log-meal-group function |
| `src/db/__tests__/customMealQueries.test.ts` | Unit tests for all query functions |
| `src/hooks/useCustomMeals.ts` | React hook wrapping queries with TanStack Query |
| `src/hooks/__tests__/useCustomMeals.test.ts` | Hook tests |
| `src/lib/mealGroupUtils.ts` | Pure functions: worst-of traffic light, GL sum, quantity bounds |
| `src/lib/__tests__/mealGroupUtils.test.ts` | Unit tests for pure aggregation logic |
| `src/screens/CreateMealScreen.tsx` | Builder UI (name, search, ingredients, totals, save) |
| `src/screens/LogMealScreen.tsx` | Confirmation UI (serving multiplier, adjust, log) |
| `src/screens/MyMealsScreen.tsx` | List of saved custom meals |
| `src/components/IngredientCard.tsx` | Single ingredient row (used in builder + log screen) |
| `src/components/MealTotalsBar.tsx` | GL hero circle + macros row (reused across screens) |
| `src/components/MealCard.tsx` | Custom meal card for My Meals list + history |

### Modified Files
| File | Change |
|------|--------|
| `src/db/migrations.ts` | Add MIGRATION_002 with new tables + `scan_logs.meal_group_id` |
| `src/db/database.ts` | Run MIGRATION_002 in `runMigrations()` |
| `src/db/queries.ts` | Add `meal_group_id` to `NewScanLog`, `ScanLogRow`, and `insertScanLog()` |
| `src/hooks/useDailyLog.ts` | Add `meal_group_id` to `FoodLogEntry`, `mapToEntry()`, group entries in output |
| `src/types/shared.ts` | Add `'custom_meal'` to `InputMethod` type |
| `src/App.tsx` | Add 3 new routes |
| `src/components/TabBar.tsx` | Add "My Meals" button to scan menu, add `/my-meals` to HIDDEN_ROUTES |
| `src/lib/i18n.tsx` | Add i18n keys for custom meal screens |
| `src/screens/HistoryScreen.tsx` | Group entries by `meal_group_id` for collapsible display |
| `src/components/FoodLog/FoodLogItem.tsx` | Support grouped meal display (collapsible) |

---

## Task 1: Pure Aggregation Utilities

**Files:**
- Create: `src/lib/mealGroupUtils.ts`
- Test: `src/lib/__tests__/mealGroupUtils.test.ts`

- [ ] **Step 1: Write failing tests for `worstTrafficLight`**

Create `src/lib/__tests__/mealGroupUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { worstTrafficLight, sumGlycemicLoad, clampQuantity } from '../mealGroupUtils'
import type { TrafficLight } from '@/types/shared'

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/__tests__/mealGroupUtils.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `mealGroupUtils.ts`**

Create `src/lib/mealGroupUtils.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/__tests__/mealGroupUtils.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mealGroupUtils.ts src/lib/__tests__/mealGroupUtils.test.ts
git commit -m "feat: add pure utility functions for custom meal aggregation"
```

---

## Task 2: Database Migration

**Files:**
- Modify: `src/db/migrations.ts`
- Modify: `src/db/database.ts`

- [ ] **Step 1: Add MIGRATION_002 to migrations.ts**

Add at the bottom of `src/db/migrations.ts`:

```typescript
export const MIGRATION_002 = `
-- Custom meals (saved recipes)
CREATE TABLE IF NOT EXISTS custom_meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Custom meal ingredients (snapshot of nutrition at creation time)
CREATE TABLE IF NOT EXISTS custom_meal_items (
  id TEXT PRIMARY KEY,
  meal_id TEXT NOT NULL REFERENCES custom_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  food_name_en TEXT,
  serving_size_g REAL,
  quantity REAL DEFAULT 1,
  calories_kcal REAL,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  fiber_g REAL,
  glycemic_load REAL,
  traffic_light TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON custom_meal_items(meal_id);

-- Add meal_group_id to scan_logs for grouping custom meal log entries
ALTER TABLE scan_logs ADD COLUMN meal_group_id TEXT;
`;
```

- [ ] **Step 2: Update `runMigrations()` in database.ts**

In `src/db/database.ts`, add the import and migration step:

Add to imports at top:
```typescript
import { MIGRATION_001, MIGRATION_002 } from './migrations'
```

Then in `runMigrations()`, after the `if (version < 1)` block (before the `// Future:` comment), add:

```typescript
  if (version < 2) {
    await db.execute(MIGRATION_002)
    await setDbVersion(2)
  }
```

- [ ] **Step 3: Verify the app still starts**

Run: `npm run dev`
Expected: No errors in console, app loads normally. Existing data preserved.

- [ ] **Step 4: Commit**

```bash
git add src/db/migrations.ts src/db/database.ts
git commit -m "feat: add migration for custom_meals tables and meal_group_id column"
```

---

## Task 3: Custom Meal Query Functions

**Files:**
- Create: `src/db/customMealQueries.ts`
- Test: `src/db/__tests__/customMealQueries.test.ts`
- Modify: `src/db/queries.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/__tests__/customMealQueries.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import type { CustomMeal, CustomMealItem, NewCustomMealItem } from '../customMealQueries'

// Since SQLite isn't available in test env, we test the localStorage fallback path.
// Clear localStorage before each test.
describe('customMealQueries (localStorage fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/db/__tests__/customMealQueries.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `customMealQueries.ts`**

Create `src/db/customMealQueries.ts`:

```typescript
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
```

- [ ] **Step 4: Add `meal_group_id` to `queries.ts` types and insert function**

In `src/db/queries.ts`, add `meal_group_id` to the interfaces and insert function:

Add to `NewScanLog` interface (after `food_id?: string | null`):
```typescript
  meal_group_id?: string | null
```

Add to `ScanLogRow` interface (after `food_id: string | null`):
```typescript
  meal_group_id: string | null
```

Update the `insertScanLog` function — add `meal_group_id` to the column list and values:

Replace the entire SQL statement and values array in `insertScanLog` (the `db.run(...)` call):
```typescript
  await db.run(
    `INSERT INTO scan_logs (id, food_name, food_name_en, glycemic_index, glycemic_load, traffic_light, input_method, quantity, confidence_score, serving_size_g, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, swap_tip, source, meal_type, food_id, meal_group_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, entry.food_name, entry.food_name_en ?? null, entry.glycemic_index ?? null,
      entry.glycemic_load, entry.traffic_light, entry.input_method,
      entry.quantity ?? 1, entry.confidence_score ?? null,
      entry.serving_size_g ?? null, entry.calories_kcal ?? null,
      entry.protein_g ?? null, entry.carbs_g ?? null, entry.fat_g ?? null, entry.fiber_g ?? null,
      entry.swap_tip ?? null, entry.source ?? null, entry.meal_type ?? null, entry.food_id ?? null,
      entry.meal_group_id ?? null,
    ],
  )
```

Also update the localStorage fallback in `insertScanLog` to include `meal_group_id`:
```typescript
    existing.push({ ...entry, id, scanned_at: new Date().toISOString(), quantity: entry.quantity ?? 1, meal_group_id: entry.meal_group_id ?? null })
```

- [ ] **Step 5: Add `'custom_meal'` to InputMethod type**

In `src/types/shared.ts`, update the `InputMethod` type:
```typescript
export type InputMethod = 'photo_scan' | 'barcode' | 'text_input' | 'manual_search' | 'favorite' | 'custom_meal'
```

- [ ] **Step 6: Run tests to verify query tests pass**

Run: `npm run test -- src/db/__tests__/customMealQueries.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 7: Run all existing tests to verify no regressions**

Run: `npm run test`
Expected: All tests PASS (existing mealUtils tests still green)

- [ ] **Step 8: Commit**

```bash
git add src/db/customMealQueries.ts src/db/__tests__/customMealQueries.test.ts src/db/queries.ts src/types/shared.ts
git commit -m "feat: add custom meal CRUD queries with meal_group_id support"
```

---

## Task 4: `useCustomMeals` React Hook

**Files:**
- Create: `src/hooks/useCustomMeals.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useCustomMeals.ts`:

```typescript
/**
 * React hook for custom meal CRUD — wraps customMealQueries with TanStack Query.
 */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as cmq from '@/db/customMealQueries'
import type { CustomMeal, CustomMealItem, NewCustomMealItem } from '@/db/customMealQueries'

export type { CustomMeal, CustomMealItem, NewCustomMealItem }

export function useCustomMeals() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['customMeals'],
    queryFn: cmq.getCustomMeals,
    staleTime: 1000 * 60,
  })

  const createMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon?: string }) =>
      cmq.createCustomMeal(name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMeals'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cmq.deleteCustomMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMeals'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; icon?: string } }) =>
      cmq.updateCustomMeal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMeals'] })
    },
  })

  return {
    meals: query.data ?? [],
    loading: query.isLoading,
    createMeal: useCallback(
      (name: string, icon?: string) => createMutation.mutateAsync({ name, icon }),
      [createMutation],
    ),
    deleteMeal: useCallback(
      (id: string) => deleteMutation.mutate(id),
      [deleteMutation],
    ),
    updateMeal: useCallback(
      (id: string, updates: { name?: string; icon?: string }) =>
        updateMutation.mutate({ id, updates }),
      [updateMutation],
    ),
  }
}

export function useCustomMealItems(mealId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['customMealItems', mealId],
    queryFn: () => (mealId ? cmq.getCustomMealItems(mealId) : Promise.resolve([])),
    enabled: !!mealId,
    staleTime: 1000 * 30,
  })

  const addItemMutation = useMutation({
    mutationFn: ({ mealId, item }: { mealId: string; item: NewCustomMealItem }) =>
      cmq.addCustomMealItem(mealId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMealItems', mealId] })
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => cmq.removeCustomMealItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMealItems', mealId] })
    },
  })

  const updateItemQtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cmq.updateCustomMealItemQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMealItems', mealId] })
    },
  })

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    addItem: useCallback(
      (targetMealId: string, item: NewCustomMealItem) =>
        addItemMutation.mutateAsync({ mealId: targetMealId, item }),
      [addItemMutation],
    ),
    removeItem: useCallback(
      (itemId: string) => removeItemMutation.mutate(itemId),
      [removeItemMutation],
    ),
    updateItemQuantity: useCallback(
      (itemId: string, quantity: number) =>
        updateItemQtyMutation.mutate({ itemId, quantity }),
      [updateItemQtyMutation],
    ),
  }
}

export function useLogCustomMeal() {
  const queryClient = useQueryClient()

  const logMutation = useMutation({
    mutationFn: ({
      mealId,
      multiplier,
      itemOverrides,
    }: {
      mealId: string
      multiplier?: number
      itemOverrides?: Map<string, { quantity: number }>
    }) => cmq.logCustomMeal(mealId, multiplier, itemOverrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] })
      queryClient.invalidateQueries({ queryKey: ['todayScanCount'] })
      queryClient.invalidateQueries({ queryKey: ['streak'] })
    },
  })

  return {
    logMeal: logMutation.mutateAsync,
    logging: logMutation.isPending,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCustomMeals.ts
git commit -m "feat: add useCustomMeals hook with TanStack Query integration"
```

---

## Task 5: Reusable UI Components

**Files:**
- Create: `src/components/IngredientCard.tsx`
- Create: `src/components/MealTotalsBar.tsx`
- Create: `src/components/MealCard.tsx`

- [ ] **Step 1: Create `IngredientCard.tsx`**

```typescript
/**
 * Single ingredient row — used in meal builder and log confirmation screens.
 * Shows food name, macros subtitle, GL + traffic dot, quantity, and optional controls.
 */
import type { CustomMealItem } from '@/db/customMealQueries'
import type { TrafficLight } from '@/types/shared'

const TL_DOT: Record<string, string> = {
  green: 'bg-tl-green-fill',
  yellow: 'bg-tl-yellow-fill',
  red: 'bg-tl-red-fill',
}

interface Props {
  item: CustomMealItem
  onQuantityChange?: (itemId: string, qty: number) => void
  onRemove?: (itemId: string) => void
  showDragHandle?: boolean
  showAdjustLink?: boolean
}

export default function IngredientCard({ item, onQuantityChange, onRemove, showDragHandle, showAdjustLink }: Props) {
  const tl = (item.traffic_light ?? 'green') as TrafficLight
  const gl = item.glycemic_load ?? 0

  return (
    <div className="rounded-2xl bg-card p-3.5 shadow-sm flex items-center gap-2.5">
      {showDragHandle && (
        <span className="text-disabled text-sm cursor-grab select-none">⠿</span>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{item.food_name}</p>
        <p className="text-xs text-text-secondary mt-0.5 truncate">
          {item.protein_g ?? 0}g P · {item.carbs_g ?? 0}g C · {item.fat_g ?? 0}g F
        </p>
      </div>

      {/* GL + traffic dot */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`h-2 w-2 rounded-full ${TL_DOT[tl]}`} />
        <span className="text-sm font-bold text-text-primary">{Math.round(gl * item.quantity)}</span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase">GL</span>
      </div>

      {/* Quantity badge */}
      <div className="bg-surface-container-low rounded-lg px-2.5 py-1 text-[13px] font-semibold text-on-surface-variant flex-shrink-0">
        {item.quantity}×
      </div>

      {showAdjustLink && onQuantityChange && (
        <button
          onClick={() => {
            const next = parseFloat(prompt('Quantity:', String(item.quantity)) ?? String(item.quantity))
            if (!isNaN(next) && next > 0) onQuantityChange(item.id, next)
          }}
          className="text-xs font-medium text-primary flex-shrink-0"
        >
          adjust
        </button>
      )}

      {onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-disabled hover:text-error text-lg flex-shrink-0 min-w-[24px] min-h-[24px] flex items-center justify-center"
        >
          ×
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `MealTotalsBar.tsx`**

```typescript
/**
 * GL-focused totals bar — hero GL circle + verdict badge + macros row.
 * Reused in builder, log confirmation, and anywhere meal totals are shown.
 */
import type { TrafficLight } from '@/types/shared'
import type { CustomMealItem } from '@/db/customMealQueries'
import { worstTrafficLight, sumGlycemicLoad } from '@/lib/mealGroupUtils'

const TL_CIRCLE_BG: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg',
  yellow: 'bg-tl-yellow-bg',
  red: 'bg-tl-red-bg',
}

const TL_NUMBER_COLOR: Record<TrafficLight, string> = {
  green: 'text-tl-green-accent',
  yellow: 'text-tl-yellow-accent',
  red: 'text-tl-red-accent',
}

const TL_BADGE_STYLE: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg text-tl-green-accent',
  yellow: 'bg-tl-yellow-bg text-tl-yellow-accent',
  red: 'bg-tl-red-bg text-tl-red-accent',
}

const TL_ICON: Record<TrafficLight, string> = {
  green: '✓',
  yellow: '⚠',
  red: '⊘',
}

const TL_LABEL: Record<TrafficLight, string> = {
  green: 'Low Impact',
  yellow: 'Moderate',
  red: 'High Impact',
}

interface Props {
  items: CustomMealItem[]
  multiplier?: number
}

export default function MealTotalsBar({ items, multiplier = 1 }: Props) {
  const glItems = items.map(i => ({
    glycemic_load: (i.glycemic_load ?? 0),
    quantity: i.quantity * multiplier,
  }))
  const totalGL = sumGlycemicLoad(glItems)
  const tl = worstTrafficLight(
    items.map(i => (i.traffic_light ?? 'green') as TrafficLight),
  )

  const totalProtein = Math.round(items.reduce((s, i) => s + (i.protein_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalCarbs = Math.round(items.reduce((s, i) => s + (i.carbs_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalFat = Math.round(items.reduce((s, i) => s + (i.fat_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalFiber = Math.round(items.reduce((s, i) => s + (i.fiber_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalCal = Math.round(items.reduce((s, i) => s + (i.calories_kcal ?? 0) * i.quantity * multiplier, 0))

  return (
    <div className="rounded-[20px] bg-card p-5 shadow-md">
      {/* Hero: GL circle + verdict */}
      <div className="flex items-center justify-center gap-4 pb-4 mb-4 border-b border-border/40">
        <div className={`w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center ${TL_CIRCLE_BG[tl]}`}>
          <span className={`font-serif text-[28px] font-bold leading-none ${TL_NUMBER_COLOR[tl]}`}>
            {Math.round(totalGL)}
          </span>
          <span className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">GL</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TL_BADGE_STYLE[tl]}`}>
            {TL_ICON[tl]} {TL_LABEL[tl]}
          </span>
          <span className="text-xs text-text-secondary">Combined glycemic load</span>
        </div>
      </div>

      {/* Macros row */}
      <div className="flex justify-between text-center">
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalProtein}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Protein</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalCarbs}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Carbs</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalFat}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Fat</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalFiber}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Fiber</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalCal}</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Cal</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `MealCard.tsx`**

```typescript
/**
 * Custom meal card — displays a saved meal in My Meals list.
 * Shows icon, name, item count, total GL, and traffic light badge.
 */
import type { CustomMeal, CustomMealItem } from '@/db/customMealQueries'
import type { TrafficLight } from '@/types/shared'
import { worstTrafficLight, sumGlycemicLoad } from '@/lib/mealGroupUtils'

const TL_BADGE_STYLE: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg text-tl-green-accent',
  yellow: 'bg-tl-yellow-bg text-tl-yellow-accent',
  red: 'bg-tl-red-bg text-tl-red-accent',
}

const TL_GL_COLOR: Record<TrafficLight, string> = {
  green: 'text-tl-green-accent',
  yellow: 'text-tl-yellow-accent',
  red: 'text-tl-red-accent',
}

const TL_ICON: Record<TrafficLight, string> = {
  green: '✓',
  yellow: '⚠',
  red: '⊘',
}

const TL_SHORT: Record<TrafficLight, string> = {
  green: 'Low',
  yellow: 'Med',
  red: 'High',
}

interface Props {
  meal: CustomMeal
  items: CustomMealItem[]
  onTap?: () => void
  onLongPress?: () => void
}

export default function MealCard({ meal, items, onTap, onLongPress }: Props) {
  const tl = worstTrafficLight(
    items.map(i => (i.traffic_light ?? 'green') as TrafficLight),
  )
  const totalGL = sumGlycemicLoad(
    items.map(i => ({ glycemic_load: i.glycemic_load ?? 0, quantity: i.quantity })),
  )

  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  const handleTouchStart = () => {
    if (onLongPress) {
      longPressTimer = setTimeout(onLongPress, 500)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  return (
    <button
      onClick={onTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="w-full rounded-2xl bg-card p-4 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-3 min-h-[60px]"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-2xl">
        {meal.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-text-primary truncate">{meal.name}</p>
        <p className="text-xs text-text-secondary mt-0.5">{items.length} items</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`font-serif text-lg font-bold ${TL_GL_COLOR[tl]}`}>
          {Math.round(totalGL)} <span className="text-[10px] font-sans font-semibold text-text-tertiary">GL</span>
        </p>
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TL_BADGE_STYLE[tl]}`}>
          {TL_ICON[tl]} {TL_SHORT[tl]}
        </span>
      </div>
    </button>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/components/IngredientCard.tsx src/components/MealTotalsBar.tsx src/components/MealCard.tsx
git commit -m "feat: add IngredientCard, MealTotalsBar, and MealCard components"
```

---

## Task 6: Create Meal Screen (Builder)

**Files:**
- Create: `src/screens/CreateMealScreen.tsx`

- [ ] **Step 1: Create the builder screen**

Create `src/screens/CreateMealScreen.tsx`:

```typescript
/**
 * Create Meal Screen — the builder for composing multi-ingredient meals.
 * User names the meal, adds ingredients via search/camera/barcode/recent, adjusts quantities, saves.
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCustomMeals, useCustomMealItems } from '@/hooks/useCustomMeals'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useLanguage } from '@/lib/i18n'
import { clampQuantity } from '@/lib/mealGroupUtils'
import type { FoodSearchResult } from '@/types/shared'
import type { NewCustomMealItem } from '@/db/customMealQueries'
import { getRecentScans } from '@/db/queries'
import IngredientCard from '@/components/IngredientCard'
import MealTotalsBar from '@/components/MealTotalsBar'
import { getFoodEmoji } from '@/lib/foodEmoji'

export default function CreateMealScreen() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { createMeal } = useCustomMeals()

  // Meal metadata
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🍽️')

  // Persisted meal + items — create immediately on mount, save name on exit
  const [mealId, setMealId] = useState<string | null>(null)
  const { items, addItem, removeItem, updateItemQuantity } = useCustomMealItems(mealId)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const search = useWaterfallSearch()

  // Recent foods for quick-add chips
  const recentQuery = useQuery({
    queryKey: ['recentFoods'],
    queryFn: () => getRecentScans(20),
    staleTime: 1000 * 60,
  })
  // Deduplicate by food_name, take first 8
  const recentFoods = useMemo(() => {
    const seen = new Set<string>()
    return (recentQuery.data ?? []).filter(r => {
      if (seen.has(r.food_name)) return false
      seen.add(r.food_name)
      return true
    }).slice(0, 8)
  }, [recentQuery.data])

  // Initialize a draft meal on first render
  const initMeal = useCallback(async () => {
    if (mealId) return
    const id = await createMeal('Draft Meal', '🍽️')
    setMealId(id)
  }, [mealId, createMeal])

  // Init on mount
  useState(() => { initMeal() })

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      search.searchText(searchQuery.trim())
    }
  }, [searchQuery, search])

  const handleAddFromSearch = useCallback(async (result: FoodSearchResult) => {
    if (!mealId) return
    const newItem: NewCustomMealItem = {
      food_name: result.name_es || result.name_en || 'Unknown',
      food_name_en: result.name_en ?? null,
      serving_size_g: result.serving_size,
      quantity: 1,
      calories_kcal: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
      fiber_g: result.fiber_g ?? null,
      glycemic_load: result.glycemic_load ?? 0,
      traffic_light: result.traffic_light ?? 'green',
      sort_order: items.length,
    }
    await addItem(mealId, newItem)
    setSearchQuery('')
    search.reset()
  }, [mealId, items.length, addItem, search])

  const handleSave = useCallback(async () => {
    if (!mealId || items.length === 0) return
    const { updateCustomMeal } = await import('@/db/customMealQueries')
    await updateCustomMeal(mealId, { name: name.trim() || 'My Meal', icon })
    navigate('/my-meals')
  }, [mealId, name, icon, items.length, navigate])

  const handleQuantityChange = useCallback((itemId: string, qty: number) => {
    updateItemQuantity(itemId, clampQuantity(qty))
  }, [updateItemQuantity])

  const canSave = items.length > 0 && name.trim().length > 0

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* Header */}
      <header className="glass flex items-center px-5 py-3 z-10 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">{t('customMeal.createTitle')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-48">
        {/* Meal Name */}
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mt-4 mb-2">{t('customMeal.mealName')}</p>
        <div className="rounded-2xl bg-card p-4 shadow-sm border-t-2 border-t-primary flex items-center gap-3">
          <button
            onClick={() => {
              const emoji = prompt('Emoji icon:', icon)
              if (emoji) setIcon(emoji)
            }}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-2xl"
          >
            {icon}
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Protein Shake"
              className="w-full bg-transparent text-lg font-serif font-semibold text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>
        </div>

        {/* Add Ingredients */}
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mt-5 mb-2">{t('customMeal.addIngredients')}</p>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-3 mb-2">
          <span className="text-text-tertiary">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('customMeal.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            onClick={() => navigate('/scan')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm"
          >
            📷
          </button>
          <button
            onClick={() => navigate('/barcode')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm"
          >
            ▦
          </button>
        </div>

        {/* Recent foods chips */}
        {recentFoods.length > 0 && !searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
            {recentFoods.map(food => (
              <button
                key={food.id}
                onClick={() => {
                  if (!mealId) return
                  addItem(mealId, {
                    food_name: food.food_name,
                    food_name_en: food.food_name_en,
                    serving_size_g: food.serving_size_g,
                    quantity: 1,
                    calories_kcal: food.calories_kcal,
                    protein_g: food.protein_g,
                    carbs_g: food.carbs_g,
                    fat_g: food.fat_g,
                    fiber_g: food.fiber_g,
                    glycemic_load: food.glycemic_load,
                    traffic_light: food.traffic_light,
                    sort_order: items.length,
                  })
                }}
                className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary shadow-sm whitespace-nowrap flex-shrink-0"
              >
                <span>{getFoodEmoji(food.food_name)}</span>
                {food.food_name}
              </button>
            ))}
          </div>
        )}

        {/* Search results */}
        {search.results.length > 0 && (
          <div className="rounded-2xl bg-card shadow-sm mb-4 overflow-hidden">
            {search.results.slice(0, 5).map((result, i) => (
              <button
                key={result.id ?? i}
                onClick={() => handleAddFromSearch(result)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface transition-colors border-b border-border/30 last:border-b-0 min-h-[44px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {result.name_es || result.name_en}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {result.serving_size}g · GL {result.glycemic_load ?? '?'}
                  </p>
                </div>
                <span className="text-primary text-sm font-semibold">+ Add</span>
              </button>
            ))}
          </div>
        )}

        {search.loading && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        )}

        {/* Ingredients list */}
        {items.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mt-4 mb-2">
              {t('customMeal.ingredients')} ({items.length})
            </p>
            <div className="space-y-2">
              {items.map(item => (
                <IngredientCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onQuantityChange={handleQuantityChange}
                  showDragHandle
                />
              ))}
            </div>
          </>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="mt-4">
            <MealTotalsBar items={items} />
          </div>
        )}
      </div>

      {/* Save button — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-surface via-surface/95 to-transparent z-20">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full rounded-full py-4 text-center text-base font-semibold transition-all min-h-[48px] ${
            canSave
              ? 'btn-gradient text-white shadow-lg'
              : 'bg-surface-container-high text-disabled cursor-not-allowed'
          }`}
          style={canSave ? { boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' } : undefined}
        >
          {t('customMeal.save')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors (may show i18n key warnings — that's expected, added in Task 9)

- [ ] **Step 3: Commit**

```bash
git add src/screens/CreateMealScreen.tsx
git commit -m "feat: add CreateMealScreen for building custom meals"
```

---

## Task 7: Log Meal Screen + My Meals Screen

**Files:**
- Create: `src/screens/LogMealScreen.tsx`
- Create: `src/screens/MyMealsScreen.tsx`

- [ ] **Step 1: Create `LogMealScreen.tsx`**

Create `src/screens/LogMealScreen.tsx`:

```typescript
/**
 * Log Meal Screen — confirmation before logging a custom meal.
 * Shows meal name, GL hero, serving multiplier, ingredient list with adjust, macros.
 */
import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomMealItems, useLogCustomMeal } from '@/hooks/useCustomMeals'
import { getCustomMealById } from '@/db/customMealQueries'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '@/lib/i18n'
import { clampQuantity } from '@/lib/mealGroupUtils'
import { worstTrafficLight, sumGlycemicLoad } from '@/lib/mealGroupUtils'
import type { TrafficLight } from '@/types/shared'
import IngredientCard from '@/components/IngredientCard'
import MealTotalsBar from '@/components/MealTotalsBar'

const TL_CIRCLE_BG: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg', yellow: 'bg-tl-yellow-bg', red: 'bg-tl-red-bg',
}
const TL_NUMBER_COLOR: Record<TrafficLight, string> = {
  green: 'text-tl-green-accent', yellow: 'text-tl-yellow-accent', red: 'text-tl-red-accent',
}
const TL_BADGE_STYLE: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg text-tl-green-accent',
  yellow: 'bg-tl-yellow-bg text-tl-yellow-accent',
  red: 'bg-tl-red-bg text-tl-red-accent',
}
const TL_ICON: Record<TrafficLight, string> = { green: '✓', yellow: '⚠', red: '⊘' }
const TL_LABEL: Record<TrafficLight, string> = { green: 'Low Impact', yellow: 'Moderate', red: 'High Impact' }

export default function LogMealScreen() {
  const { mealId } = useParams<{ mealId: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { logMeal, logging } = useLogCustomMeal()
  const { items } = useCustomMealItems(mealId ?? null)

  const mealQuery = useQuery({
    queryKey: ['customMeal', mealId],
    queryFn: () => getCustomMealById(mealId!),
    enabled: !!mealId,
  })
  const meal = mealQuery.data

  const [multiplier, setMultiplier] = useState(1)
  const [itemOverrides, setItemOverrides] = useState<Map<string, { quantity: number }>>(new Map())

  const handleQuantityOverride = useCallback((itemId: string, qty: number) => {
    setItemOverrides(prev => {
      const next = new Map(prev)
      next.set(itemId, { quantity: clampQuantity(qty) })
      return next
    })
  }, [])

  const effectiveItems = items.map(item => ({
    ...item,
    quantity: itemOverrides.get(item.id)?.quantity ?? item.quantity,
  }))

  const tl = worstTrafficLight(effectiveItems.map(i => (i.traffic_light ?? 'green') as TrafficLight))
  const totalGL = sumGlycemicLoad(
    effectiveItems.map(i => ({ glycemic_load: i.glycemic_load ?? 0, quantity: i.quantity * multiplier })),
  )

  const handleLog = useCallback(async () => {
    if (!mealId) return
    await logMeal({ mealId, multiplier, itemOverrides })
    navigate('/')
  }, [mealId, multiplier, itemOverrides, logMeal, navigate])

  if (!meal || !mealId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      <header className="glass flex items-center px-5 py-3 z-10 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">{t('customMeal.logTitle')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-48">
        {/* Hero */}
        <div className="text-center py-6">
          <div className="text-5xl mb-1">{meal.icon}</div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">{meal.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`w-[52px] h-[52px] rounded-full flex flex-col items-center justify-center ${TL_CIRCLE_BG[tl]}`}>
              <span className={`font-serif text-[22px] font-bold leading-none ${TL_NUMBER_COLOR[tl]}`}>{Math.round(totalGL)}</span>
              <span className="text-[8px] font-semibold text-text-tertiary uppercase mt-0.5">GL</span>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TL_BADGE_STYLE[tl]}`}>
              {TL_ICON[tl]} {TL_LABEL[tl]}
            </span>
          </div>
        </div>

        {/* Serving multiplier */}
        <div className="rounded-2xl bg-card p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Servings</p>
              <p className="text-xs text-text-secondary mt-0.5">Multiply all ingredients</p>
            </div>
            <div className="flex items-center gap-5">
              <button
                onClick={() => setMultiplier(m => Math.max(0.5, m - 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-lg font-semibold text-on-surface-variant min-h-[36px]"
              >−</button>
              <span className="text-2xl font-bold text-text-primary min-w-[40px] text-center">{multiplier}×</span>
              <button
                onClick={() => setMultiplier(m => Math.min(10, m + 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-lg font-semibold text-on-surface-variant min-h-[36px]"
              >+</button>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          {t('customMeal.ingredients')}
        </p>
        <div className="space-y-2">
          {effectiveItems.map(item => (
            <IngredientCard
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityOverride}
              showAdjustLink
            />
          ))}
        </div>

        {/* Macros totals */}
        <div className="mt-4">
          <MealTotalsBar items={effectiveItems} multiplier={multiplier} />
        </div>
      </div>

      {/* Log button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-surface via-surface/95 to-transparent z-20">
        <button
          onClick={handleLog}
          disabled={logging}
          className="w-full btn-gradient rounded-full py-4 text-center text-base font-semibold text-white min-h-[48px]"
          style={{ boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' }}
        >
          {logging ? 'Logging...' : t('customMeal.log')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `MyMealsScreen.tsx`**

Create `src/screens/MyMealsScreen.tsx`:

```typescript
/**
 * My Meals Screen — lists all saved custom meals with create button.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomMeals } from '@/hooks/useCustomMeals'
import { getCustomMealItems } from '@/db/customMealQueries'
import type { CustomMealItem } from '@/db/customMealQueries'
import { useLanguage } from '@/lib/i18n'
import MealCard from '@/components/MealCard'

export default function MyMealsScreen() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { meals, loading, deleteMeal } = useCustomMeals()
  const [itemsByMeal, setItemsByMeal] = useState<Record<string, CustomMealItem[]>>({})
  const [contextMenu, setContextMenu] = useState<string | null>(null)

  // Fetch items for all meals
  useEffect(() => {
    async function loadItems() {
      const map: Record<string, CustomMealItem[]> = {}
      for (const meal of meals) {
        map[meal.id] = await getCustomMealItems(meal.id)
      }
      setItemsByMeal(map)
    }
    if (meals.length > 0) loadItems()
  }, [meals])

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      <header className="glass flex items-center justify-between px-5 py-3 z-10 flex-shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-title text-on-surface">{t('customMeal.myMealsTitle')}</h1>
        </div>
        <button
          onClick={() => navigate('/create-meal')}
          className="btn-gradient !py-2 !px-4 !text-sm rounded-full"
        >
          + {t('customMeal.new')}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-lg font-medium text-text-secondary">{t('customMeal.noMeals')}</p>
            <p className="text-sm text-text-tertiary mt-1 mb-6">{t('customMeal.noMealsHint')}</p>
            <button
              onClick={() => navigate('/create-meal')}
              className="btn-gradient rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' }}
            >
              {t('customMeal.createFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {meals.map(meal => (
              <div key={meal.id} className="relative">
                <MealCard
                  meal={meal}
                  items={itemsByMeal[meal.id] ?? []}
                  onTap={() => navigate(`/log-meal/${meal.id}`)}
                  onLongPress={() => setContextMenu(meal.id)}
                />

                {/* Context menu */}
                {contextMenu === meal.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                    <div className="absolute right-2 top-full mt-1 z-50 rounded-xl bg-card shadow-lg py-1 min-w-[140px]">
                      <button
                        onClick={() => { setContextMenu(null); navigate(`/create-meal?edit=${meal.id}`) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={async () => {
                          setContextMenu(null)
                          const { createCustomMeal, addCustomMealItem, getCustomMealItems: getItems } = await import('@/db/customMealQueries')
                          const srcItems = await getItems(meal.id)
                          const newId = await createCustomMeal(`${meal.name} (copy)`, meal.icon)
                          for (const item of srcItems) {
                            const { id: _, meal_id: __, ...rest } = item
                            await addCustomMealItem(newId, rest)
                          }
                          // Trigger refresh
                          window.location.reload()
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        📋 Duplicate
                      </button>
                      <button
                        onClick={() => { setContextMenu(null); deleteMeal(meal.id) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-surface"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/screens/LogMealScreen.tsx src/screens/MyMealsScreen.tsx
git commit -m "feat: add LogMealScreen and MyMealsScreen"
```

---

## Task 8: Routing, TabBar, and i18n Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TabBar.tsx`
- Modify: `src/lib/i18n.tsx`

- [ ] **Step 1: Add routes to App.tsx**

In `src/App.tsx`, add imports at top:
```typescript
import CreateMealScreen from '@/screens/CreateMealScreen'
import LogMealScreen from '@/screens/LogMealScreen'
import MyMealsScreen from '@/screens/MyMealsScreen'
```

Add three new routes inside `<Routes>` (after the `/favorites` route):
```typescript
            <Route path="/my-meals" element={<MyMealsScreen />} />
            <Route path="/create-meal" element={<CreateMealScreen />} />
            <Route path="/log-meal/:mealId" element={<LogMealScreen />} />
```

- [ ] **Step 2: Update TabBar — add My Meals to scan menu + HIDDEN_ROUTES**

In `src/components/TabBar.tsx`:

Add `/my-meals`, `/create-meal`, and `/log-meal` to `HIDDEN_ROUTES`:
```typescript
const HIDDEN_ROUTES = ['/onboarding', '/settings', '/paywall', '/scan', '/barcode', '/text', '/search', '/weekly-report', '/privacy', '/terms', '/meal-ideas', '/food', '/my-meals', '/create-meal', '/log-meal']
```

Add a new "My Meals" button in the scan menu (after the meal ideas button, before the closing `</div>` of the scan menu bar):
```typescript
            <div className="w-px h-8 bg-white/15" />

            <button
              onClick={() => gatedNavigate('/my-meals')}
              className="flex flex-col items-center gap-1 rounded-xl px-5 py-2.5 text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px] min-w-[72px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              <span className="text-[10px] font-medium">{t('scan.myMeals')}</span>
            </button>
```

- [ ] **Step 3: Add i18n keys**

In `src/lib/i18n.tsx`, add these keys to both the `es` and `en` translation objects:

Add to the `es` object:
```typescript
    // Custom Meals
    'scan.myMeals': 'Mis Comidas',
    'customMeal.createTitle': 'Crear Comida',
    'customMeal.logTitle': 'Registrar Comida',
    'customMeal.myMealsTitle': 'Mis Comidas',
    'customMeal.mealName': 'Nombre de la Comida',
    'customMeal.addIngredients': 'Agregar Ingredientes',
    'customMeal.searchPlaceholder': 'Buscar alimentos...',
    'customMeal.ingredients': 'Ingredientes',
    'customMeal.save': 'Guardar Comida',
    'customMeal.log': 'Registrar Comida',
    'customMeal.new': 'Nueva',
    'customMeal.noMeals': 'Sin comidas guardadas',
    'customMeal.noMealsHint': 'Crea tu primera comida personalizada',
    'customMeal.createFirst': 'Crear Primera Comida',
```

Add to the `en` object:
```typescript
    // Custom Meals
    'scan.myMeals': 'My Meals',
    'customMeal.createTitle': 'Create Meal',
    'customMeal.logTitle': 'Log Meal',
    'customMeal.myMealsTitle': 'My Meals',
    'customMeal.mealName': 'Meal Name',
    'customMeal.addIngredients': 'Add Ingredients',
    'customMeal.searchPlaceholder': 'Search foods...',
    'customMeal.ingredients': 'Ingredients',
    'customMeal.save': 'Save Meal',
    'customMeal.log': 'Log Meal',
    'customMeal.new': 'New',
    'customMeal.noMeals': 'No saved meals',
    'customMeal.noMealsHint': 'Create your first custom meal',
    'customMeal.createFirst': 'Create First Meal',
```

- [ ] **Step 4: Verify TypeScript compiles and app loads**

Run: `npx tsc --noEmit && npm run dev`
Expected: No errors, app loads, FAB menu shows "My Meals" option

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/TabBar.tsx src/lib/i18n.tsx
git commit -m "feat: wire up custom meal routes, tab bar entry, and i18n strings"
```

---

## Task 9: History View — Grouped Meal Display

**Files:**
- Modify: `src/hooks/useDailyLog.ts`
- Modify: `src/components/FoodLog/FoodLogItem.tsx`

- [ ] **Step 1: Add `meal_group_id` to `FoodLogEntry` and `mapToEntry`**

In `src/hooks/useDailyLog.ts`:

Add `meal_group_id` to `FoodLogEntry` interface:
```typescript
  meal_group_id?: string | null
```

Update `mapToEntry` to include it:
```typescript
function mapToEntry(row: queries.ScanLogRow): FoodLogEntry {
  return {
    id: row.id,
    food_name: row.food_name,
    calories_kcal: row.calories_kcal,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    glycemic_index: row.glycemic_index ?? null,
    glycemic_load: row.glycemic_load,
    result_traffic_light: row.traffic_light as TrafficLight,
    serving_size_g: row.serving_size_g,
    serving_count: row.quantity,
    meal_type: row.meal_type,
    created_at: row.scanned_at,
    meal_group_id: row.meal_group_id ?? null,
  }
}
```

- [ ] **Step 2: Update `FoodLogItem` to show grouped meal entries**

In `src/components/FoodLog/FoodLogItem.tsx`, this is a display change. When a `FoodLogItem` has `meal_group_id`, it should be rendered differently in the parent component (FoodLogList). For now, add the `meal_group_id` passthrough so the parent can use it:

The `FoodLogItem` component already supports expand/collapse and shows individual food details. The grouping logic will be handled by the parent `FoodLogList` or `DashboardScreen` — they can group entries by `meal_group_id` and render a collapsible group header. This is a display-layer concern that can be iterated on after the core data flow works.

No code changes needed to `FoodLogItem.tsx` for this step — it already renders individual entries correctly.

- [ ] **Step 3: Run all tests**

Run: `npm run test`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDailyLog.ts
git commit -m "feat: add meal_group_id to FoodLogEntry for grouped history display"
```

---

## Task 10: Integration Testing + Full Verification

**Files:**
- Create: `src/db/__tests__/customMealIntegration.test.ts`

- [ ] **Step 1: Write integration test for full flow**

Create `src/db/__tests__/customMealIntegration.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Custom meal full flow (localStorage fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('create meal → add items → log → verify scan_logs entries', async () => {
    const { createCustomMeal, addCustomMealItem, getCustomMealItems, logCustomMeal } = await import('../customMealQueries')

    // 1. Create meal
    const mealId = await createCustomMeal('Protein Shake', '🥤')

    // 2. Add ingredients
    await addCustomMealItem(mealId, {
      food_name: 'Whey Protein', food_name_en: 'Whey Protein',
      serving_size_g: 30, quantity: 1, calories_kcal: 120,
      protein_g: 24, carbs_g: 3, fat_g: 1, fiber_g: 0,
      glycemic_load: 1, traffic_light: 'green', sort_order: 0,
    })
    await addCustomMealItem(mealId, {
      food_name: 'Banana', food_name_en: 'Banana',
      serving_size_g: 118, quantity: 1, calories_kcal: 105,
      protein_g: 1, carbs_g: 27, fat_g: 0, fiber_g: 3,
      glycemic_load: 7, traffic_light: 'yellow', sort_order: 1,
    })

    const items = await getCustomMealItems(mealId)
    expect(items).toHaveLength(2)

    // 3. Log the meal
    const groupId = await logCustomMeal(mealId)
    expect(groupId).toBeTruthy()

    // 4. Verify scan_logs entries
    const logs: any[] = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
    expect(logs).toHaveLength(2)
    expect(logs[0].meal_group_id).toBe(groupId)
    expect(logs[1].meal_group_id).toBe(groupId)
    expect(logs[0].input_method).toBe('custom_meal')
    expect(logs[1].input_method).toBe('custom_meal')
    expect(logs[0].food_name).toBe('Whey Protein')
    expect(logs[1].food_name).toBe('Banana')
  })

  it('log with multiplier scales values correctly', async () => {
    const { createCustomMeal, addCustomMealItem, logCustomMeal } = await import('../customMealQueries')

    const mealId = await createCustomMeal('Shake', '🥤')
    await addCustomMealItem(mealId, {
      food_name: 'Milk', food_name_en: 'Milk',
      serving_size_g: 240, quantity: 1, calories_kcal: 149,
      protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0,
      glycemic_load: 3, traffic_light: 'green', sort_order: 0,
    })

    await logCustomMeal(mealId, 2) // double serving

    const logs: any[] = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
    expect(logs).toHaveLength(1)
    expect(logs[0].glycemic_load).toBe(6) // 3 * 2
    expect(logs[0].calories_kcal).toBe(298) // 149 * 2
    expect(logs[0].serving_size_g).toBe(480) // 240 * 2
  })

  it('editing a meal does not affect previously logged entries', async () => {
    const { createCustomMeal, addCustomMealItem, logCustomMeal, updateCustomMeal } = await import('../customMealQueries')

    const mealId = await createCustomMeal('Shake', '🥤')
    await addCustomMealItem(mealId, {
      food_name: 'Milk', food_name_en: 'Milk',
      serving_size_g: 240, quantity: 1, calories_kcal: 149,
      protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0,
      glycemic_load: 3, traffic_light: 'green', sort_order: 0,
    })

    // Log it
    await logCustomMeal(mealId)

    // Edit the meal name
    await updateCustomMeal(mealId, { name: 'Super Shake' })

    // Previous log entry unchanged
    const logs: any[] = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
    expect(logs[0].food_name).toBe('Milk') // immutable
  })
})
```

- [ ] **Step 2: Run integration tests**

Run: `npm run test -- src/db/__tests__/customMealIntegration.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 3: Run full test suite**

Run: `npm run test`
Expected: All tests PASS (mealUtils + mealGroupUtils + customMealQueries + integration)

- [ ] **Step 4: Verify the app builds cleanly**

Run: `npm run build`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/db/__tests__/customMealIntegration.test.ts
git commit -m "test: add integration tests for custom meal create → log → verify flow"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Pure aggregation utils | `mealGroupUtils.ts` + tests |
| 2 | Database migration | `migrations.ts`, `database.ts` |
| 3 | CRUD query functions | `customMealQueries.ts` + tests, `queries.ts` updates |
| 4 | React hook | `useCustomMeals.ts` |
| 5 | Reusable UI components | `IngredientCard`, `MealTotalsBar`, `MealCard` |
| 6 | Builder screen | `CreateMealScreen.tsx` |
| 7 | Log + My Meals screens | `LogMealScreen.tsx`, `MyMealsScreen.tsx` |
| 8 | Wiring (routes, nav, i18n) | `App.tsx`, `TabBar.tsx`, `i18n.tsx` |
| 9 | History grouping | `useDailyLog.ts` update |
| 10 | Integration tests + verify | Integration test suite |

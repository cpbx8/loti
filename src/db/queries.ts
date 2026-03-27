/**
 * Typed data access layer for on-device SQLite database.
 * All reads/writes go through these functions.
 * Returns null/defaults when SQLite is unavailable (web dev fallback).
 */

import { getDb } from './database'

// ─── Types ──────────────────────────────────────────────────────

export interface UserProfile {
  health_state: string
  goal: string | null
  diagnosis_duration: string | null
  a1c_value: number | null
  age: number | null
  sex: string
  activity_level: string
  medications: string[]
  dietary_restrictions: string[]
  meal_struggles: string[]
  gl_threshold_green: number
  gl_threshold_yellow: number
  onboarding_completed: boolean
  language: string
}

export interface ScanLogRow {
  id: string
  food_name: string
  food_name_en: string | null
  glycemic_index: number | null
  glycemic_load: number
  traffic_light: string
  input_method: string
  quantity: number
  confidence_score: number | null
  serving_size_g: number | null
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  swap_tip: string | null
  source: string | null
  meal_type: string | null
  food_id: string | null
  meal_group_id: string | null
  scanned_at: string
}

export interface NewScanLog {
  food_name: string
  food_name_en?: string | null
  glycemic_index?: number | null
  glycemic_load: number
  traffic_light: string
  input_method: string
  quantity?: number
  confidence_score?: number | null
  serving_size_g?: number | null
  calories_kcal?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  fiber_g?: number | null
  swap_tip?: string | null
  source?: string | null
  meal_type?: string | null
  food_id?: string | null
  meal_group_id?: string | null
}

export interface FoodRow {
  id: string
  name: string
  name_en: string | null
  glycemic_index: number
  glycemic_load: number
  default_traffic_light: string
  swap_tip: string | null
  swap_tip_en: string | null
  confidence_score: number
  data_source: string
  barcode: string | null
  category: string | null
  serving_size_g: number | null
  carbs_g: number | null
  fiber_g: number | null
}

export interface StoreProductRow {
  id: string
  product_name: string
  brand: string | null
  barcode: string | null
  category: string
  store_chain: string
  estimated_gl: number | null
  traffic_light: string
  swap_suggestion: string | null
  why_tip: string | null
  why_detail: string | null
  is_best_choice: boolean
  price_mxn: number | null
  serving_label: string | null
  image_url: string | null
}

export interface FavoriteRow {
  id: string
  food_id: string | null
  food_name: string
  cached_result: string | null
  created_at: string
}

export interface BarcodeCacheRow {
  barcode: string
  product_name: string | null
  brand: string | null
  source: string
  estimated_gi: number | null
  estimated_gl: number | null
  traffic_light: string | null
  confidence_score: number | null
  cached_at: string
}

// ─── PROFILE ────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  const db = getDb()
  if (!db) return null

  const result = await db.query('SELECT * FROM user_profile WHERE id = 1')
  const row = result.values?.[0]
  if (!row) return null

  return {
    health_state: row.health_state ?? 'healthy',
    goal: row.goal ?? null,
    diagnosis_duration: row.diagnosis_duration ?? null,
    a1c_value: row.a1c_value ?? null,
    age: row.age ?? null,
    sex: row.sex ?? 'not_specified',
    activity_level: row.activity_level ?? 'moderate',
    medications: safeParseArray(row.medications),
    dietary_restrictions: safeParseArray(row.dietary_restrictions),
    meal_struggles: safeParseArray(row.meal_struggles),
    gl_threshold_green: row.gl_threshold_green ?? 10,
    gl_threshold_yellow: row.gl_threshold_yellow ?? 19,
    onboarding_completed: !!row.onboarding_completed,
    language: row.language ?? 'es',
  }
}

export async function upsertProfile(updates: Partial<Omit<UserProfile, 'onboarding_completed'>> & { onboarding_completed?: boolean }): Promise<void> {
  const db = getDb()
  if (!db) return

  const fields: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'medications' || key === 'dietary_restrictions' || key === 'meal_struggles') {
      fields.push(`${key} = ?`)
      values.push(JSON.stringify(value))
    } else if (key === 'onboarding_completed') {
      fields.push(`${key} = ?`)
      values.push(value ? 1 : 0)
    } else {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (fields.length === 0) return

  fields.push("updated_at = datetime('now')")
  await db.run(`UPDATE user_profile SET ${fields.join(', ')} WHERE id = 1`, values)
}

export async function isOnboardingComplete(): Promise<boolean> {
  const db = getDb()
  if (!db) {
    // Web fallback: check localStorage
    return localStorage.getItem('loti_onboarding_complete') === 'true'
  }
  const result = await db.query('SELECT onboarding_completed FROM user_profile WHERE id = 1')
  return !!result.values?.[0]?.onboarding_completed
}

export async function completeOnboarding(): Promise<void> {
  const db = getDb()
  if (!db) {
    localStorage.setItem('loti_onboarding_complete', 'true')
    return
  }
  await db.run("UPDATE user_profile SET onboarding_completed = 1, updated_at = datetime('now') WHERE id = 1")
}

// ─── SCAN LOGS ──────────────────────────────────────────────────

export async function insertScanLog(entry: NewScanLog): Promise<string> {
  const db = getDb()
  const id = crypto.randomUUID()

  if (!db) {
    // Web fallback: store in localStorage
    const key = 'loti_food_log'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push({ ...entry, id, scanned_at: new Date().toISOString(), quantity: entry.quantity ?? 1, meal_group_id: entry.meal_group_id ?? null })
    localStorage.setItem(key, JSON.stringify(existing))
    return id
  }

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
  return id
}

export async function updateScanServingCount(id: string, count: number): Promise<void> {
  const db = getDb()
  if (!db) {
    const key = 'loti_food_log'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const updated = existing.map((e: any) => e.id === id ? { ...e, quantity: count } : e)
    localStorage.setItem(key, JSON.stringify(updated))
    return
  }
  await db.run('UPDATE scan_logs SET quantity = ? WHERE id = ?', [count, id])
}

export async function deleteScanLog(id: string): Promise<void> {
  const db = getDb()
  if (!db) {
    const key = 'loti_food_log'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify(existing.filter((e: any) => e.id !== id)))
    return
  }
  await db.run('DELETE FROM scan_logs WHERE id = ?', [id])
}

export async function getScanById(id: string): Promise<ScanLogRow | null> {
  const db = getDb()
  if (!db) {
    const key = 'loti_food_log'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    return existing.find((e: any) => e.id === id) ?? null
  }
  const result = await db.query('SELECT * FROM scan_logs WHERE id = ?', [id])
  const rows = (result.values || []) as ScanLogRow[]
  return rows[0] ?? null
}

export async function updateScanEntry(id: string, updates: { serving_size_g: number; quantity: number }): Promise<void> {
  const db = getDb()
  if (!db) {
    const key = 'loti_food_log'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = existing.findIndex((e: any) => e.id === id)
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updates }
      localStorage.setItem(key, JSON.stringify(existing))
    }
    return
  }
  await db.run(
    'UPDATE scan_logs SET serving_size_g = ?, quantity = ? WHERE id = ?',
    [updates.serving_size_g, updates.quantity, id]
  )
}

export async function getScansForDate(dateStr: string): Promise<ScanLogRow[]> {
  const db = getDb()
  if (!db) return getLocalScansForDate(dateStr)

  const result = await db.query(
    "SELECT * FROM scan_logs WHERE date(scanned_at, 'localtime') = ? ORDER BY scanned_at DESC",
    [dateStr],
  )
  return (result.values || []) as ScanLogRow[]
}

export async function getScansForRange(startDate: string, endDate: string): Promise<ScanLogRow[]> {
  const db = getDb()
  if (!db) return getLocalScansForRange(startDate, endDate)

  const result = await db.query(
    "SELECT * FROM scan_logs WHERE date(scanned_at, 'localtime') >= ? AND date(scanned_at, 'localtime') <= ? ORDER BY scanned_at DESC",
    [startDate, endDate],
  )
  return (result.values || []) as ScanLogRow[]
}

export async function getRecentScans(limit = 100): Promise<ScanLogRow[]> {
  const db = getDb()
  if (!db) {
    const all = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
    return all.slice(-limit).reverse()
  }

  const result = await db.query(
    'SELECT * FROM scan_logs ORDER BY scanned_at DESC LIMIT ?',
    [limit],
  )
  return (result.values || []) as ScanLogRow[]
}

export async function getTodayScanCount(): Promise<number> {
  const db = getDb()
  if (!db) {
    const today = new Date().toISOString().slice(0, 10)
    return getLocalScansForDate(today).length
  }

  const result = await db.query(
    "SELECT COUNT(*) as count FROM scan_logs WHERE date(scanned_at, 'localtime') = date('now', 'localtime')",
  )
  return result.values?.[0]?.count || 0
}

export async function getTotalScanCount(): Promise<number> {
  const db = getDb()
  if (!db) {
    const all: any[] = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
    return all.length
  }

  const result = await db.query('SELECT COUNT(*) as count FROM scan_logs')
  return result.values?.[0]?.count || 0
}

export async function getDistinctScanDates(limit = 90): Promise<string[]> {
  const db = getDb()
  if (!db) {
    const all: any[] = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
    const dates = [...new Set(all.map(e => toLocalDate(e.scanned_at || e.timestamp || '')).filter(d => d !== ''))]
    return dates.sort().reverse().slice(0, limit)
  }

  const result = await db.query(
    "SELECT DISTINCT date(scanned_at, 'localtime') as d FROM scan_logs ORDER BY d DESC LIMIT ?",
    [limit],
  )
  return (result.values || []).map((r: any) => r.d)
}

// ─── FAVORITES ──────────────────────────────────────────────────

export async function getFavorites(): Promise<FavoriteRow[]> {
  const db = getDb()
  if (!db) {
    return JSON.parse(localStorage.getItem('loti_favorites') || '[]')
  }

  const result = await db.query('SELECT * FROM favorites ORDER BY created_at DESC')
  return (result.values || []) as FavoriteRow[]
}

export async function addFavorite(foodName: string, foodId?: string, cachedResult?: string): Promise<void> {
  const db = getDb()
  if (!db) {
    const favs = JSON.parse(localStorage.getItem('loti_favorites') || '[]')
    if (!favs.some((f: any) => f.food_name === foodName)) {
      favs.push({ id: crypto.randomUUID(), food_name: foodName, food_id: foodId, cached_result: cachedResult, created_at: new Date().toISOString() })
      localStorage.setItem('loti_favorites', JSON.stringify(favs))
    }
    return
  }

  await db.run(
    'INSERT OR IGNORE INTO favorites (id, food_id, food_name, cached_result) VALUES (?, ?, ?, ?)',
    [crypto.randomUUID(), foodId ?? null, foodName, cachedResult ?? null],
  )
}

export async function removeFavorite(id: string): Promise<void> {
  const db = getDb()
  if (!db) {
    const favs = JSON.parse(localStorage.getItem('loti_favorites') || '[]')
    localStorage.setItem('loti_favorites', JSON.stringify(favs.filter((f: any) => f.id !== id)))
    return
  }

  await db.run('DELETE FROM favorites WHERE id = ?', [id])
}

export async function isFavorite(foodName: string): Promise<boolean> {
  const db = getDb()
  if (!db) {
    const favs = JSON.parse(localStorage.getItem('loti_favorites') || '[]')
    return favs.some((f: any) => f.food_name === foodName)
  }

  const result = await db.query('SELECT 1 FROM favorites WHERE food_name = ?', [foodName])
  return (result.values?.length || 0) > 0
}

// ─── FOODS (Local DB) ───────────────────────────────────────────

export async function searchFoodsByName(query: string): Promise<FoodRow[]> {
  const db = getDb()
  if (!db) return []

  // Prefer exact match first, then partial
  const exact = await db.query(
    'SELECT * FROM foods WHERE LOWER(name) = LOWER(?) OR LOWER(name_en) = LOWER(?) LIMIT 1',
    [query, query],
  )
  if (exact.values && exact.values.length > 0) return exact.values as FoodRow[]

  const result = await db.query(
    'SELECT * FROM foods WHERE name LIKE ? OR name_en LIKE ? ORDER BY LENGTH(name) ASC LIMIT 10',
    [`%${query}%`, `%${query}%`],
  )
  return (result.values || []) as FoodRow[]
}

export async function getFoodByBarcode(barcode: string): Promise<FoodRow | null> {
  const db = getDb()
  if (!db) return null

  const normalized = barcode.padStart(13, '0')
  const result = await db.query('SELECT * FROM foods WHERE barcode = ?', [normalized])
  return (result.values?.[0] as FoodRow) || null
}

export async function getFoodById(id: string): Promise<FoodRow | null> {
  const db = getDb()
  if (!db) return null

  const result = await db.query('SELECT * FROM foods WHERE id = ?', [id])
  return (result.values?.[0] as FoodRow) || null
}

// ─── STORE PRODUCTS ─────────────────────────────────────────────

export async function getStoreProducts(chainId: string): Promise<StoreProductRow[]> {
  const db = getDb()
  if (!db) return []

  const result = await db.query(
    "SELECT * FROM store_products WHERE store_chain = ? ORDER BY CASE traffic_light WHEN 'green' THEN 0 WHEN 'yellow' THEN 1 WHEN 'red' THEN 2 END, product_name",
    [chainId],
  )
  return (result.values || []).map((p: any) => ({
    ...p,
    is_best_choice: !!p.is_best_choice,
  })) as StoreProductRow[]
}

export async function getStoreProductByBarcode(barcode: string): Promise<StoreProductRow | null> {
  const db = getDb()
  if (!db) return null

  const normalized = barcode.padStart(13, '0')
  const result = await db.query('SELECT * FROM store_products WHERE barcode = ?', [normalized])
  const row = result.values?.[0]
  if (!row) return null
  return { ...row, is_best_choice: !!row.is_best_choice } as StoreProductRow
}

// ─── BARCODE CACHE ──────────────────────────────────────────────

export async function getCachedBarcode(barcode: string): Promise<BarcodeCacheRow | null> {
  const db = getDb()
  if (!db) return null

  const result = await db.query('SELECT * FROM barcode_cache WHERE barcode = ?', [barcode])
  return (result.values?.[0] as BarcodeCacheRow) || null
}

export async function cacheBarcode(data: Omit<BarcodeCacheRow, 'cached_at'>): Promise<void> {
  const db = getDb()
  if (!db) return

  await db.run(
    `INSERT OR REPLACE INTO barcode_cache (barcode, product_name, brand, source, estimated_gi, estimated_gl, traffic_light, confidence_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.barcode, data.product_name, data.brand, data.source, data.estimated_gi, data.estimated_gl, data.traffic_light, data.confidence_score],
  )
}

// ─── THRESHOLD COMPUTATION (pure functions) ─────────────────────

export function computeThresholds(
  healthState: string | null,
  a1c?: number | null,
  activity?: string | null,
  age?: number | null,
): { greenMax: number; yellowMax: number } {
  let greenMax: number
  let yellowMax: number

  switch (healthState) {
    case 'prediabetic': greenMax = 8; yellowMax = 15; break
    case 'type2':       greenMax = 7; yellowMax = 13; break
    case 'gestational': greenMax = 7; yellowMax = 12; break
    case 'type1':       greenMax = 7; yellowMax = 13; break
    default:            greenMax = 10; yellowMax = 19; break
  }

  if (a1c && a1c > 8.0) {
    greenMax = Math.max(5, greenMax - 1)
    yellowMax = Math.max(10, yellowMax - 2)
  }

  if (activity === 'very_active') {
    greenMax += 1
    yellowMax += 1
  }

  if (activity === 'sedentary') {
    yellowMax = Math.max(greenMax + 2, yellowMax - 1)
  }

  if (age && age > 65) {
    greenMax = Math.max(5, greenMax - 1)
  }

  return { greenMax, yellowMax: Math.max(greenMax + 2, yellowMax) }
}

export function computeTrafficLight(
  gl: number,
  greenMax: number,
  yellowMax: number,
): 'green' | 'yellow' | 'red' {
  if (gl <= greenMax) return 'green'
  if (gl <= yellowMax) return 'yellow'
  return 'red'
}

// ─── ANALYTICS ─────────────────────────────────────────────────

export async function trackEvent(eventName: string, properties?: Record<string, unknown>): Promise<void> {
  const db = getDb()
  if (!db) return

  try {
    await db.run(
      'INSERT INTO analytics_events (id, event_name, properties) VALUES (?, ?, ?)',
      [crypto.randomUUID(), eventName, JSON.stringify(properties ?? {})],
    )
  } catch (err) {
    console.warn('[Loti Analytics] Failed to track event:', err)
  }
}

export async function getEventCount(eventName: string, sinceDays = 30): Promise<number> {
  const db = getDb()
  if (!db) return 0

  try {
    const result = await db.query(
      "SELECT COUNT(*) as count FROM analytics_events WHERE event_name = ? AND created_at >= datetime('now', ?)",
      [eventName, `-${sinceDays} days`],
    )
    return result.values?.[0]?.count ?? 0
  } catch {
    return 0
  }
}

export async function cleanupOldAnalytics(): Promise<void> {
  const db = getDb()
  if (!db) return

  try {
    await db.run("DELETE FROM analytics_events WHERE created_at < datetime('now', '-90 days')")
  } catch (err) {
    console.warn('[Loti Analytics] Cleanup failed:', err)
  }
}

export async function clearAllData(): Promise<void> {
  const db = getDb()
  if (!db) return

  try {
    await db.run('DELETE FROM scan_logs')
    await db.run('DELETE FROM favorites')
    await db.run('DELETE FROM user_profile')
    await db.run('DELETE FROM analytics_events')
  } catch (err) {
    console.warn('[Loti] Clear all data failed:', err)
  }
}

// ─── HELPERS ────────────────────────────────────────────────────

function safeParseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return [] }
  }
  return []
}

/** Convert ISO timestamp to local YYYY-MM-DD */
function toLocalDate(isoStr: string): string {
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr.slice(0, 10)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getLocalScansForDate(dateStr: string): ScanLogRow[] {
  const all: any[] = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
  return all.filter(e => {
    const d = toLocalDate(e.scanned_at || e.timestamp || '')
    return d === dateStr
  })
}

function getLocalScansForRange(start: string, end: string): ScanLogRow[] {
  const all: any[] = JSON.parse(localStorage.getItem('loti_food_log') || '[]')
  return all.filter(e => {
    const d = toLocalDate(e.scanned_at || e.timestamp || '')
    return d >= start && d <= end
  })
}

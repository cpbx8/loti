import { supabase } from '@/lib/supabase'

const LOG_KEY = 'loti_food_log'
const MIGRATED_KEY = 'loti_migrated_at'

/**
 * One-time migration: push localStorage food log entries to Supabase scan_logs.
 * Called after first authenticated session.
 */
export async function migrateFoodLogToSupabase(userId: string): Promise<void> {
  // Already migrated?
  if (localStorage.getItem(MIGRATED_KEY)) return

  const raw = localStorage.getItem(LOG_KEY)
  if (!raw) {
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
    return
  }

  try {
    const entries = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!entries.length) {
      localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
      return
    }

    // Map localStorage entries to scan_logs rows
    const rows = entries.map(e => ({
      user_id: userId,
      food_name: e.food_name ?? 'Unknown',
      calories_kcal: e.calories_kcal ?? null,
      protein_g: e.protein_g ?? null,
      carbs_g: e.carbs_g ?? null,
      fat_g: e.fat_g ?? null,
      fiber_g: (e as Record<string, unknown>).fiber_g ?? null,
      result_gl: e.glycemic_load ?? null,
      result_traffic_light: e.result_traffic_light ?? null,
      serving_size_g: e.serving_size_g ?? null,
      meal_type: e.meal_type ?? null,
      input_method: 'photo_scan', // default for legacy entries
      created_at: e.created_at ?? new Date().toISOString(),
    }))

    // Batch insert (Supabase handles up to ~1000 rows)
    const { error } = await supabase.from('scan_logs').insert(rows)

    if (error) {
      console.warn('Food log migration failed:', error.message)
      return // Don't mark as migrated so we can retry
    }

    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
    console.log(`Migrated ${rows.length} food log entries to Supabase`)
  } catch (err) {
    console.warn('Food log migration error:', err)
  }
}

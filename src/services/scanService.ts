import { supabase } from '@/lib/supabase'
import type { TrafficLight } from '@/types/shared'
import type { FoodLogEntry, NewLogEntry } from '@/hooks/useDailyLog'

/** Insert a scan log entry into Supabase */
export async function logScan(entry: NewLogEntry, userId: string): Promise<FoodLogEntry> {
  const row = {
    user_id: userId,
    food_name: entry.food_name,
    calories_kcal: entry.calories_kcal,
    protein_g: entry.protein_g,
    carbs_g: entry.carbs_g,
    fat_g: entry.fat_g,
    fiber_g: entry.fiber_g,
    result_gl: entry.glycemic_load,
    result_traffic_light: entry.result_traffic_light,
    serving_size_g: entry.serving_size_g,
    input_method: entry.input_method,
  }

  const { data, error } = await supabase
    .from('scan_logs')
    .insert(row)
    .select()
    .single()

  if (error) throw error

  return mapRowToEntry(data)
}

/** Fetch scan logs for a specific date */
export async function fetchScansForDate(userId: string, dateStr: string): Promise<FoodLogEntry[]> {
  const startOfDay = `${dateStr}T00:00:00.000Z`
  const endOfDay = `${dateStr}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapRowToEntry)
}

/** Fetch scan logs for a date range */
export async function fetchScansForRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', `${startDate}T00:00:00.000Z`)
    .lte('created_at', `${endDate}T23:59:59.999Z`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapRowToEntry)
}

/** Fetch recent scan history (up to 100 entries) */
export async function fetchScanHistory(userId: string, limit = 100): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapRowToEntry)
}

/** Delete a scan log entry */
export async function deleteScan(id: string): Promise<void> {
  const { error } = await supabase.from('scan_logs').delete().eq('id', id)
  if (error) throw error
}

/** Map a Supabase row to the FoodLogEntry interface used by the frontend */
function mapRowToEntry(row: Record<string, unknown>): FoodLogEntry {
  return {
    id: row.id as string,
    food_name: (row.food_name as string) ?? null,
    calories_kcal: (row.calories_kcal as number) ?? null,
    protein_g: (row.protein_g as number) ?? null,
    carbs_g: (row.carbs_g as number) ?? null,
    fat_g: (row.fat_g as number) ?? null,
    glycemic_load: (row.result_gl as number) ?? null,
    result_traffic_light: (row.result_traffic_light as TrafficLight) ?? null,
    serving_size_g: (row.serving_size_g as number) ?? null,
    serving_count: (row.quantity as number) ?? undefined,
    meal_type: (row.meal_type as string) ?? null,
    created_at: row.created_at as string,
  }
}

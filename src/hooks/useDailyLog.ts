import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { TrafficLight } from '@/types/shared'

export interface DailyTotals {
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  scan_count: number
}

export interface FoodLogEntry {
  id: string
  food_name: string | null
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  result_traffic_light: TrafficLight | null
  serving_size_g: number | null
  meal_type: string | null
  created_at: string
}

const EMPTY_TOTALS: DailyTotals = {
  total_calories: 0,
  total_protein_g: 0,
  total_carbs_g: 0,
  total_fat_g: 0,
  total_fiber_g: 0,
  scan_count: 0,
}

export function useDailyLog() {
  const [totals, setTotals] = useState<DailyTotals>(EMPTY_TOTALS)
  const [entries, setEntries] = useState<FoodLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  const refresh = useCallback(async () => {
    setLoading(true)

    // Fetch daily totals
    const { data: totalsData } = await supabase
      .from('daily_totals')
      .select('*')
      .eq('date', today)
      .single()

    if (totalsData) {
      setTotals({
        total_calories: totalsData.total_calories ?? 0,
        total_protein_g: totalsData.total_protein_g ?? 0,
        total_carbs_g: totalsData.total_carbs_g ?? 0,
        total_fat_g: totalsData.total_fat_g ?? 0,
        total_fiber_g: totalsData.total_fiber_g ?? 0,
        scan_count: totalsData.scan_count ?? 0,
      })
    } else {
      setTotals(EMPTY_TOTALS)
    }

    // Fetch today's scan log entries
    const startOfDay = `${today}T00:00:00.000Z`
    const endOfDay = `${today}T23:59:59.999Z`

    const { data: logsData } = await supabase
      .from('scan_logs')
      .select('id, matched_food_id, calories_kcal, protein_g, carbs_g, fat_g, result_traffic_light, serving_size_g, meal_type, created_at, gpt_raw_response')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: false })

    if (logsData) {
      setEntries(
        logsData.map((log) => ({
          id: log.id,
          food_name: (log.gpt_raw_response as Record<string, unknown>)?.food_name as string | null ?? 'Unknown food',
          calories_kcal: log.calories_kcal,
          protein_g: log.protein_g,
          carbs_g: log.carbs_g,
          fat_g: log.fat_g,
          result_traffic_light: log.result_traffic_light as TrafficLight | null,
          serving_size_g: log.serving_size_g,
          meal_type: log.meal_type,
          created_at: log.created_at,
        })),
      )
    } else {
      setEntries([])
    }

    setLoading(false)
  }, [today])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { totals, entries, loading, refresh }
}

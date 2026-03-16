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

/** Format a Date to YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Get today's date string */
export function getToday(): string {
  return formatDate(new Date())
}

/** Shift a date string by N days */
export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

/** Check if a date string is today */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday()
}

/** Format date for display: "Today", "Yesterday", or "Mon, Mar 14" */
export function displayDate(dateStr: string): string {
  const today = getToday()
  if (dateStr === today) return 'Today'
  if (dateStr === shiftDate(today, -1)) return 'Yesterday'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function useDailyLog(date?: string) {
  const [totals, setTotals] = useState<DailyTotals>(EMPTY_TOTALS)
  const [entries, setEntries] = useState<FoodLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const targetDate = date ?? getToday()

  const refresh = useCallback(async () => {
    setLoading(true)

    // Fetch daily totals
    const { data: totalsData } = await supabase
      .from('daily_totals')
      .select('*')
      .eq('date', targetDate)
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

    // Fetch scan log entries for the date
    const startOfDay = `${targetDate}T00:00:00.000Z`
    const endOfDay = `${targetDate}T23:59:59.999Z`

    const { data: logsData } = await supabase
      .from('scan_logs')
      .select('id, food_name, matched_food_id, calories_kcal, protein_g, carbs_g, fat_g, result_traffic_light, serving_size_g, meal_type, created_at, gpt_raw_response')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: false })

    if (logsData) {
      setEntries(
        logsData.map((log) => ({
          id: log.id,
          food_name: log.food_name ?? (log.gpt_raw_response as Record<string, unknown>)?.food_name as string | null ?? 'Unknown food',
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
  }, [targetDate])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { totals, entries, loading, refresh, date: targetDate }
}

/** Fetch weekly totals for the history screen */
export function useWeeklyHistory(endDate?: string) {
  const [days, setDays] = useState<Array<{ date: string; totals: DailyTotals }>>([])
  const [loading, setLoading] = useState(true)

  const end = endDate ?? getToday()

  const refresh = useCallback(async () => {
    setLoading(true)

    const startDate = shiftDate(end, -6)

    const { data } = await supabase
      .from('daily_totals')
      .select('*')
      .gte('date', startDate)
      .lte('date', end)
      .order('date', { ascending: true })

    // Build 7-day array, filling in zeros for missing days
    const result: Array<{ date: string; totals: DailyTotals }> = []
    for (let i = 0; i < 7; i++) {
      const d = shiftDate(startDate, i)
      const found = data?.find(row => row.date === d)
      result.push({
        date: d,
        totals: found ? {
          total_calories: found.total_calories ?? 0,
          total_protein_g: found.total_protein_g ?? 0,
          total_carbs_g: found.total_carbs_g ?? 0,
          total_fat_g: found.total_fat_g ?? 0,
          total_fiber_g: found.total_fiber_g ?? 0,
          scan_count: found.scan_count ?? 0,
        } : EMPTY_TOTALS,
      })
    }

    setDays(result)
    setLoading(false)
  }, [end])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Compute weekly averages
  const daysWithData = days.filter(d => d.totals.scan_count > 0)
  const count = daysWithData.length || 1
  const avgCalories = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_calories, 0) / count)
  const avgProtein = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_protein_g, 0) / count * 10) / 10
  const avgCarbs = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_carbs_g, 0) / count * 10) / 10
  const avgFat = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_fat_g, 0) / count * 10) / 10
  const daysLogged = daysWithData.length

  return {
    days, loading, refresh,
    averages: { avgCalories, avgProtein, avgCarbs, avgFat },
    daysLogged,
  }
}

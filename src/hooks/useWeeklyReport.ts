/**
 * Weekly report — computed from SQLite scan_logs (local-first).
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDate, shiftDate } from './useDailyLog'
import type { FoodLogEntry } from './useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from './useThresholds'
import type { TrafficLight } from '@/types/shared'
import { getScansForRange } from '@/db/queries'

interface WeeklyReport {
  greenPct: number
  yellowPct: number
  redPct: number
  totalScans: number
  daysLogged: number
  prevGreenPct: number
  greenDelta: number
  topGreenFoods: string[]
  topRedFood: string | null
  avgCalories: number
  avgCarbs: number
  avgProtein: number
  tip: string
  hasEnoughData: boolean
}

function getEntryTL(e: FoodLogEntry, thresholds: { greenMax: number; yellowMax: number }): TrafficLight {
  if (e.glycemic_load != null) return getPersonalizedTrafficLight(e.glycemic_load, thresholds)
  return e.result_traffic_light ?? 'yellow'
}

export function useWeeklyReport(): WeeklyReport {
  const thresholds = useThresholds()
  const today = formatDate(new Date())
  const prevWeekStart = shiftDate(today, -13)

  const query = useQuery({
    queryKey: ['weeklyReport', today],
    queryFn: async () => {
      const rows = await getScansForRange(prevWeekStart, today)
      return rows.map(row => ({
        id: row.id,
        food_name: row.food_name,
        calories_kcal: row.calories_kcal,
        protein_g: row.protein_g,
        carbs_g: row.carbs_g,
        fat_g: row.fat_g,
        glycemic_load: row.glycemic_load,
        result_traffic_light: row.traffic_light as TrafficLight,
        serving_size_g: row.serving_size_g,
        meal_type: row.meal_type,
        created_at: row.scanned_at,
      })) as FoodLogEntry[]
    },
    staleTime: 1000 * 60,
  })

  return useMemo(() => {
    return computeReport(query.data ?? [], thresholds)
  }, [query.data, thresholds])
}

function computeReport(
  allEntries: FoodLogEntry[],
  thresholds: { greenMax: number; yellowMax: number },
): WeeklyReport {
  const today = formatDate(new Date())
  const weekStart = shiftDate(today, -6)
  const prevWeekStart = shiftDate(today, -13)

  const thisWeek = allEntries.filter(e => {
    const d = e.created_at.slice(0, 10)
    return d >= weekStart && d <= today
  })

  const prevWeek = allEntries.filter(e => {
    const d = e.created_at.slice(0, 10)
    return d >= prevWeekStart && d < weekStart
  })

  const totalScans = thisWeek.length
  const hasEnoughData = totalScans >= 3

  let green = 0, yellow = 0, red = 0
  const foodCounts: Record<string, { count: number; tl: TrafficLight }> = {}

  for (const e of thisWeek) {
    const tl = getEntryTL(e, thresholds)
    if (tl === 'green') green++
    else if (tl === 'yellow') yellow++
    else red++

    const name = e.food_name ?? 'Unknown'
    if (!foodCounts[name]) foodCounts[name] = { count: 0, tl }
    foodCounts[name].count++
  }

  const greenPct = totalScans > 0 ? Math.round((green / totalScans) * 100) : 0
  const yellowPct = totalScans > 0 ? Math.round((yellow / totalScans) * 100) : 0
  const redPct = totalScans > 0 ? Math.round((red / totalScans) * 100) : 0

  let prevGreen = 0
  for (const e of prevWeek) {
    if (getEntryTL(e, thresholds) === 'green') prevGreen++
  }
  const prevGreenPct = prevWeek.length > 0 ? Math.round((prevGreen / prevWeek.length) * 100) : 0
  const greenDelta = greenPct - prevGreenPct

  const topGreenFoods = Object.entries(foodCounts)
    .filter(([, v]) => v.tl === 'green')
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([name]) => name)

  const topRedFood = Object.entries(foodCounts)
    .filter(([, v]) => v.tl === 'red')
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name]) => name)[0] ?? null

  const daysSet = new Set<string>()
  for (const e of thisWeek) daysSet.add(e.created_at.slice(0, 10))
  const daysLogged = daysSet.size

  const daysWithData = daysLogged || 1
  const avgCalories = Math.round(thisWeek.reduce((s, e) => s + (e.calories_kcal ?? 0), 0) / daysWithData)
  const avgCarbs = Math.round(thisWeek.reduce((s, e) => s + (e.carbs_g ?? 0), 0) / daysWithData)
  const avgProtein = Math.round(thisWeek.reduce((s, e) => s + (e.protein_g ?? 0), 0) / daysWithData)

  let tip = 'Keep scanning your meals to get personalized insights!'
  if (redPct > 40) tip = 'Try the protein-first trick: eat protein before carbs to reduce glucose spikes by up to 30%.'
  else if (greenPct >= 80) tip = 'Amazing week! Your green choices are keeping your glucose stable.'
  else if (yellowPct > 50) tip = 'Lots of moderate-impact meals. Try adding a side of nopales or beans to bring them into green range.'
  else if (topRedFood) tip = `You had "${topRedFood}" often this week. Check the OXXO guide for a swap!`

  return {
    greenPct, yellowPct, redPct, totalScans, daysLogged,
    prevGreenPct, greenDelta, topGreenFoods, topRedFood,
    avgCalories, avgCarbs, avgProtein, tip, hasEnoughData,
  }
}

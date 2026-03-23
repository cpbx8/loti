/**
 * Daily food log hook — local-first, reads/writes SQLite scan_logs.
 * Falls back to localStorage when SQLite unavailable (web dev).
 */

import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TrafficLight, FoodSearchResult } from '@/types/shared'
import * as queries from '@/db/queries'

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
  glycemic_index: number | null
  glycemic_load: number | null
  result_traffic_light: TrafficLight | null
  serving_size_g: number | null
  serving_count?: number
  meal_type: string | null
  created_at: string
}

export interface NewLogEntry {
  food_name: string
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  glycemic_load?: number | null
  result_traffic_light?: TrafficLight | null
  serving_size_g: number
  input_method: string
}

/** Format a Date to YYYY-MM-DD in local timezone */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

/** Convert a FoodSearchResult to a NewLogEntry */
export function toLogEntry(item: FoodSearchResult, inputMethod: string): NewLogEntry {
  return {
    food_name: item.name_en || item.name_es,
    calories_kcal: item.calories,
    protein_g: item.protein_g,
    carbs_g: item.carbs_g,
    fat_g: item.fat_g,
    fiber_g: item.fiber_g ?? null,
    glycemic_load: item.glycemic_load ?? null,
    serving_size_g: item.serving_size,
    input_method: inputMethod,
  }
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

function computeTotals(entries: FoodLogEntry[]): DailyTotals {
  return {
    total_calories: entries.reduce((s, e) => s + (e.calories_kcal ?? 0), 0),
    total_protein_g: entries.reduce((s, e) => s + (e.protein_g ?? 0), 0),
    total_carbs_g: entries.reduce((s, e) => s + (e.carbs_g ?? 0), 0),
    total_fat_g: entries.reduce((s, e) => s + (e.fat_g ?? 0), 0),
    total_fiber_g: entries.reduce((s, e) => s + ((e as FoodLogEntry & { fiber_g?: number }).fiber_g ?? 0), 0),
    scan_count: entries.length,
  }
}

/** Map SQLite row to FoodLogEntry */
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
  }
}

// ─── Main hook ──────────────────────────────────────────────────

export function useDailyLog(date?: string) {
  const targetDate = date ?? getToday()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['dailyLog', targetDate],
    queryFn: async () => {
      const rows = await queries.getScansForDate(targetDate)
      return rows.map(mapToEntry)
    },
    staleTime: 1000 * 10,
  })

  const entries = query.data ?? []
  const totals = useMemo(() => computeTotals(entries), [entries])

  const addMutation = useMutation({
    mutationFn: async (entry: NewLogEntry) => {
      await queries.insertScanLog({
        food_name: entry.food_name,
        glycemic_load: entry.glycemic_load ?? 0,
        traffic_light: entry.result_traffic_light ?? 'green',
        input_method: entry.input_method,
        calories_kcal: entry.calories_kcal,
        protein_g: entry.protein_g,
        carbs_g: entry.carbs_g,
        fat_g: entry.fat_g,
        fiber_g: entry.fiber_g,
        serving_size_g: entry.serving_size_g,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] })
      queryClient.invalidateQueries({ queryKey: ['todayScanCount'] })
      queryClient.invalidateQueries({ queryKey: ['streak'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => queries.deleteScanLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] })
      queryClient.invalidateQueries({ queryKey: ['todayScanCount'] })
    },
  })

  const servingMutation = useMutation({
    mutationFn: async ({ id, count }: { id: string; count: number }) => {
      await queries.updateScanServingCount(id, count)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] })
    },
  })

  const addEntry = useCallback((entry: NewLogEntry) => {
    addMutation.mutate(entry)
  }, [addMutation])

  const removeEntry = useCallback((id: string) => {
    removeMutation.mutate(id)
  }, [removeMutation])

  const updateServingCount = useCallback((id: string, count: number) => {
    servingMutation.mutate({ id, count })
  }, [servingMutation])

  return {
    totals,
    entries,
    loading: query.isLoading,
    refresh: () => query.refetch(),
    addEntry,
    removeEntry,
    updateServingCount,
    date: targetDate,
  }
}

// ─── Weekly history ─────────────────────────────────────────────

export function useWeeklyHistory(endDate?: string) {
  const end = endDate ?? getToday()
  const startDate = shiftDate(end, -6)

  const query = useQuery({
    queryKey: ['weeklyHistory', end],
    queryFn: async () => {
      const rows = await queries.getScansForRange(startDate, end)
      const entries = rows.map(mapToEntry)
      return buildWeeklyData(entries, startDate)
    },
    staleTime: 1000 * 60,
  })

  if (query.data) return { ...query.data, loading: false }
  return { ...buildWeeklyData([], startDate), loading: query.isLoading }
}

function getEntriesForDate(allEntries: FoodLogEntry[], dateStr: string): FoodLogEntry[] {
  return allEntries.filter(e => e.created_at.startsWith(dateStr))
}

function buildWeeklyData(allEntries: FoodLogEntry[], startDate: string) {
  const days: Array<{ date: string; totals: DailyTotals; entries: FoodLogEntry[] }> = []
  for (let i = 0; i < 7; i++) {
    const d = shiftDate(startDate, i)
    const dayEntries = getEntriesForDate(allEntries, d)
    days.push({ date: d, totals: computeTotals(dayEntries), entries: dayEntries })
  }

  const daysWithData = days.filter(d => d.totals.scan_count > 0)
  const count = daysWithData.length || 1
  const avgCalories = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_calories, 0) / count)
  const avgProtein = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_protein_g, 0) / count * 10) / 10
  const avgCarbs = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_carbs_g, 0) / count * 10) / 10
  const avgFat = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_fat_g, 0) / count * 10) / 10
  const daysLogged = daysWithData.length

  return {
    days,
    averages: { avgCalories, avgProtein, avgCarbs, avgFat },
    daysLogged,
  }
}

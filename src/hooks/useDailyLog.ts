import { useState, useCallback } from 'react'
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

// ─── Local Storage Food Log ─────────────────────────────────
// Stores food log entries in localStorage until auth is added.
// Will migrate to Supabase scan_logs table when auth is implemented.

const LOG_STORAGE_KEY = 'loti_food_log'

export interface NewLogEntry {
  food_name: string
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  serving_size_g: number
  input_method: string
}

function loadAllEntries(): FoodLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAllEntries(entries: FoodLogEntry[]) {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries))
}

function getEntriesForDate(allEntries: FoodLogEntry[], dateStr: string): FoodLogEntry[] {
  return allEntries.filter(e => e.created_at.startsWith(dateStr))
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

export function useDailyLog(date?: string) {
  const targetDate = date ?? getToday()
  const [allEntries, setAllEntries] = useState<FoodLogEntry[]>(() => loadAllEntries())

  const dayEntries = getEntriesForDate(allEntries, targetDate)
  const totals = computeTotals(dayEntries)

  const addEntry = useCallback((entry: NewLogEntry) => {
    const newEntry: FoodLogEntry = {
      id: crypto.randomUUID(),
      food_name: entry.food_name,
      calories_kcal: entry.calories_kcal,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g,
      result_traffic_light: null,
      serving_size_g: entry.serving_size_g,
      meal_type: null,
      created_at: new Date().toISOString(),
    }
    const updated = [newEntry, ...allEntries]
    setAllEntries(updated)
    saveAllEntries(updated)
  }, [allEntries])

  const removeEntry = useCallback((id: string) => {
    const updated = allEntries.filter(e => e.id !== id)
    setAllEntries(updated)
    saveAllEntries(updated)
  }, [allEntries])

  const refresh = useCallback(() => {
    setAllEntries(loadAllEntries())
  }, [])

  return {
    totals,
    entries: dayEntries,
    loading: false,
    refresh,
    addEntry,
    removeEntry,
    date: targetDate,
  }
}

/** Fetch weekly totals for the history screen (localStorage-backed) */
export function useWeeklyHistory(endDate?: string) {
  const end = endDate ?? getToday()
  const startDate = shiftDate(end, -6)
  const allEntries = loadAllEntries()

  // Build 7-day array
  const days: Array<{ date: string; totals: DailyTotals }> = []
  for (let i = 0; i < 7; i++) {
    const d = shiftDate(startDate, i)
    const dayEntries = getEntriesForDate(allEntries, d)
    days.push({ date: d, totals: computeTotals(dayEntries) })
  }

  // Compute weekly averages
  const daysWithData = days.filter(d => d.totals.scan_count > 0)
  const count = daysWithData.length || 1
  const avgCalories = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_calories, 0) / count)
  const avgProtein = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_protein_g, 0) / count * 10) / 10
  const avgCarbs = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_carbs_g, 0) / count * 10) / 10
  const avgFat = Math.round(daysWithData.reduce((s, d) => s + d.totals.total_fat_g, 0) / count * 10) / 10
  const daysLogged = daysWithData.length

  return {
    days, loading: false,
    averages: { avgCalories, avgProtein, avgCarbs, avgFat },
    daysLogged,
  }
}

/**
 * Scan Summary Utility — summarizes 7 days of food log history
 * for the AI suggestion engine and the SuggestionSheet UI.
 */
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import type { TrafficLight } from '@/types/shared'
import { getPersonalizedTrafficLight } from '@/hooks/useThresholds'

const LOG_STORAGE_KEY = 'loti_food_log'

export interface ScanSummary {
  total_scans_7d: number
  green_count: number
  yellow_count: number
  red_count: number
  today_scans: { food_name: string; traffic_light: TrafficLight }[]
  most_common_red_foods: string[]
  last_scan_time: string | null
}

/** Load all food log entries from localStorage */
function loadEntries(): FoodLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Build a scan summary for the last N days */
export function getScanSummary(
  days: number,
  thresholds: { greenMax: number; yellowMax: number },
): ScanSummary {
  const entries = loadEntries()
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString()

  const todayStr = new Date().toISOString().slice(0, 10)

  const recent = entries.filter(e => e.created_at >= sinceStr)

  let green = 0, yellow = 0, red = 0
  const redFoodCounts = new Map<string, number>()
  const todayScans: ScanSummary['today_scans'] = []

  for (const e of recent) {
    const tl = e.glycemic_load != null
      ? getPersonalizedTrafficLight(e.glycemic_load, thresholds)
      : e.result_traffic_light

    if (tl === 'green') green++
    else if (tl === 'yellow') yellow++
    else if (tl === 'red') {
      red++
      if (e.food_name) {
        redFoodCounts.set(e.food_name, (redFoodCounts.get(e.food_name) ?? 0) + 1)
      }
    }

    if (e.created_at.startsWith(todayStr) && e.food_name && tl) {
      todayScans.push({ food_name: e.food_name, traffic_light: tl })
    }
  }

  const most_common_red_foods = [...redFoodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  return {
    total_scans_7d: recent.length,
    green_count: green,
    yellow_count: yellow,
    red_count: red,
    today_scans: todayScans,
    most_common_red_foods,
    last_scan_time: recent.length > 0 ? recent[0].created_at : null,
  }
}

/** Format scan summary into a compact string for the LLM prompt */
export function formatScanSummaryForPrompt(summary: ScanSummary): string {
  const today = summary.today_scans
    .map(s => `${s.food_name} (${s.traffic_light})`)
    .join(', ')

  return [
    `Last 7 days: ${summary.total_scans_7d} meals.`,
    `${summary.green_count} green, ${summary.yellow_count} yellow, ${summary.red_count} red.`,
    today ? `Today so far: ${today}.` : 'No meals logged today yet.',
    summary.most_common_red_foods.length > 0
      ? `Frequent high-impact foods: ${summary.most_common_red_foods.join(', ')}.`
      : '',
  ].filter(Boolean).join(' ')
}

/** Get a one-line summary for the UI (shown in SuggestionSheet) */
export function getTodaySummaryLine(summary: ScanSummary): string {
  const todayCount = summary.today_scans.length
  if (todayCount === 0) return 'No meals logged today yet'

  const redCount = summary.today_scans.filter(s => s.traffic_light === 'red').length
  if (redCount > 0) return `${redCount} high-impact meal${redCount > 1 ? 's' : ''} today`

  const allGreen = summary.today_scans.every(s => s.traffic_light === 'green')
  if (allGreen) return 'All green so far — keep it up!'

  return `${todayCount} meal${todayCount > 1 ? 's' : ''} logged today`
}

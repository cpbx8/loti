/**
 * Glucose goal — target green % based on health state from SQLite profile.
 */

import { useMemo } from 'react'
import type { FoodLogEntry } from './useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from './useThresholds'
import { useProfile } from './useProfile'

interface GlucoseGoal {
  goalPct: number
  currentPct: number
  greenCount: number
  totalCount: number
  status: 'on_track' | 'needs_attention' | 'no_data'
}

export function useGlucoseGoal(entries: FoodLogEntry[]): GlucoseGoal {
  const thresholds = useThresholds()
  const { profile } = useProfile()

  return useMemo(() => {
    const healthState = profile?.health_state ?? 'healthy'

    const goalPct = healthState === 'type2' || healthState === 'gestational' ? 70
      : healthState === 'prediabetic' ? 75
      : 80

    if (entries.length === 0) {
      return { goalPct, currentPct: 0, greenCount: 0, totalCount: 0, status: 'no_data' as const }
    }

    let greenCount = 0
    for (const e of entries) {
      const tl = e.glycemic_load != null
        ? getPersonalizedTrafficLight(e.glycemic_load, thresholds)
        : e.result_traffic_light ?? 'yellow'
      if (tl === 'green') greenCount++
    }

    const currentPct = Math.round((greenCount / entries.length) * 100)
    const status = currentPct >= goalPct ? 'on_track' as const : 'needs_attention' as const

    return { goalPct, currentPct, greenCount, totalCount: entries.length, status }
  }, [entries, thresholds, profile])
}

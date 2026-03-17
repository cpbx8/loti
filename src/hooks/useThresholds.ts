import { useMemo } from 'react'
import type { TrafficLight } from '@/types/shared'
import { GL_THRESHOLDS } from '@/lib/constants'

const STORAGE_KEY = 'loti_onboarding'

interface Thresholds {
  greenMax: number
  yellowMax: number
}

/** Get the user's personalized GL thresholds, falling back to defaults */
export function useThresholds(): Thresholds {
  return useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return { greenMax: GL_THRESHOLDS.GREEN_MAX, yellowMax: GL_THRESHOLDS.YELLOW_MAX }

      const state = JSON.parse(saved)
      // Import threshold computation inline to avoid circular deps
      const healthState = state.healthState ?? 'healthy'
      let greenMax: number, yellowMax: number

      switch (healthState) {
        case 'prediabetic':
          greenMax = 8; yellowMax = 15; break
        case 'type2':
          greenMax = 7; yellowMax = 13; break
        case 'gestational':
          greenMax = 7; yellowMax = 12; break
        default:
          greenMax = 10; yellowMax = 19
      }

      if (state.a1cValue && state.a1cValue > 8.0) {
        greenMax = Math.max(5, greenMax - 1)
        yellowMax = Math.max(10, yellowMax - 2)
      }

      if (state.activityLevel === 'very_active') {
        greenMax += 1
        yellowMax += 1
      }

      if (state.age && state.age > 65) {
        greenMax = Math.max(5, greenMax - 1)
      }

      return { greenMax, yellowMax }
    } catch {
      return { greenMax: GL_THRESHOLDS.GREEN_MAX, yellowMax: GL_THRESHOLDS.YELLOW_MAX }
    }
  }, [])
}

/** Compute traffic light color from GL using personalized thresholds */
export function getPersonalizedTrafficLight(gl: number, thresholds: Thresholds): TrafficLight {
  if (gl <= thresholds.greenMax) return 'green'
  if (gl <= thresholds.yellowMax) return 'yellow'
  return 'red'
}

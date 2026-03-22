/**
 * Personalized GL thresholds — reads from SQLite profile (local-first).
 */

import { useMemo } from 'react'
import type { TrafficLight } from '@/types/shared'
import { GL_THRESHOLDS } from '@/lib/constants'
import { useProfile } from './useProfile'
import { computeThresholds as computeFromParams } from '@/db/queries'

interface Thresholds {
  greenMax: number
  yellowMax: number
}

export function useThresholds(): Thresholds {
  const { profile } = useProfile()

  return useMemo(() => {
    if (profile) {
      // If thresholds are already computed in the profile, use them
      if (profile.gl_threshold_green && profile.gl_threshold_yellow) {
        return {
          greenMax: profile.gl_threshold_green,
          yellowMax: profile.gl_threshold_yellow,
        }
      }

      // Otherwise compute from profile fields
      return computeFromParams(
        profile.health_state,
        profile.a1c_value,
        profile.activity_level,
        profile.age,
      )
    }

    // Default thresholds
    return { greenMax: GL_THRESHOLDS.GREEN_MAX, yellowMax: GL_THRESHOLDS.YELLOW_MAX }
  }, [profile])
}

/** Compute traffic light color from GL using personalized thresholds */
export function getPersonalizedTrafficLight(gl: number, thresholds: Thresholds): TrafficLight {
  if (gl <= thresholds.greenMax) return 'green'
  if (gl <= thresholds.yellowMax) return 'yellow'
  return 'red'
}

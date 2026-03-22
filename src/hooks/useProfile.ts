/**
 * User profile hook — reads/writes from SQLite (local-first).
 * Falls back to localStorage onboarding data when SQLite unavailable (web dev).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, upsertProfile } from '@/db/queries'
import type { UserProfile } from '@/db/queries'

export type { UserProfile }

export function useProfile() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const profile = await getProfile()
      if (profile) return profile

      // Web fallback: read from localStorage onboarding data
      try {
        const raw = localStorage.getItem('loti_onboarding')
        if (!raw) return null
        const state = JSON.parse(raw)
        return {
          health_state: state.healthState ?? 'healthy',
          goal: state.goal ?? null,
          diagnosis_duration: state.diagnosisDuration ?? null,
          a1c_value: state.a1cValue ?? null,
          age: state.age ?? null,
          sex: state.sex ?? 'not_specified',
          activity_level: state.activityLevel ?? 'moderate',
          medications: state.medications ?? [],
          dietary_restrictions: state.dietaryRestrictions ?? [],
          meal_struggles: state.mealStruggles ?? [],
          gl_threshold_green: 10,
          gl_threshold_yellow: 19,
          onboarding_completed: localStorage.getItem('loti_onboarding_complete') === 'true',
          language: 'es',
        } as UserProfile
      } catch {
        return null
      }
    },
    staleTime: Infinity,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      await upsertProfile(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

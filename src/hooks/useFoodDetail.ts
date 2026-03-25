/**
 * useFoodDetail — load and mutate a single food log entry by ID.
 */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as queries from '@/db/queries'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import type { TrafficLight } from '@/types/shared'

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

export function useFoodDetail(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['foodDetail', id],
    queryFn: async () => {
      const row = await queries.getScanById(id)
      return row ? mapToEntry(row) : null
    },
    staleTime: 1000 * 10,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: { serving_size_g: number; quantity: number }) =>
      queries.updateScanEntry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => queries.deleteScanLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] })
      queryClient.invalidateQueries({ queryKey: ['todayScanCount'] })
      queryClient.invalidateQueries({ queryKey: ['streak'] })
    },
  })

  const updateEntry = useCallback(
    (updates: { serving_size_g: number; quantity: number }) => updateMutation.mutate(updates),
    [updateMutation]
  )

  const deleteEntry = useCallback(
    () => deleteMutation.mutateAsync(),
    [deleteMutation]
  )

  return {
    entry: query.data ?? null,
    loading: query.isLoading,
    updateEntry,
    deleteEntry,
  }
}

/**
 * React hook for custom meal CRUD — wraps customMealQueries with TanStack Query.
 */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as cmq from '@/db/customMealQueries'
import type { CustomMeal, CustomMealItem, NewCustomMealItem } from '@/db/customMealQueries'

export type { CustomMeal, CustomMealItem, NewCustomMealItem }

export function useCustomMeals() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['customMeals'],
    queryFn: cmq.getCustomMeals,
    staleTime: 1000 * 60,
  })

  const createMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon?: string }) =>
      cmq.createCustomMeal(name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMeals'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cmq.deleteCustomMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMeals'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; icon?: string } }) =>
      cmq.updateCustomMeal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMeals'] })
    },
  })

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => cmq.toggleFavoriteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMeals'] })
    },
  })

  return {
    meals: query.data ?? [],
    loading: query.isLoading,
    createMeal: useCallback(
      (name: string, icon?: string) => createMutation.mutateAsync({ name, icon }),
      [createMutation],
    ),
    deleteMeal: useCallback(
      (id: string) => deleteMutation.mutate(id),
      [deleteMutation],
    ),
    updateMeal: useCallback(
      (id: string, updates: { name?: string; icon?: string }) =>
        updateMutation.mutate({ id, updates }),
      [updateMutation],
    ),
    toggleFavorite: useCallback(
      (id: string) => favoriteMutation.mutate(id),
      [favoriteMutation],
    ),
  }
}

export function useCustomMealItems(mealId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['customMealItems', mealId],
    queryFn: () => (mealId ? cmq.getCustomMealItems(mealId) : Promise.resolve([])),
    enabled: !!mealId,
    staleTime: 1000 * 30,
  })

  const addItemMutation = useMutation({
    mutationFn: ({ mealId, item }: { mealId: string; item: NewCustomMealItem }) =>
      cmq.addCustomMealItem(mealId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMealItems', mealId] })
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => cmq.removeCustomMealItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMealItems', mealId] })
    },
  })

  const updateItemQtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cmq.updateCustomMealItemQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customMealItems', mealId] })
    },
  })

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    addItem: useCallback(
      (targetMealId: string, item: NewCustomMealItem) =>
        addItemMutation.mutateAsync({ mealId: targetMealId, item }),
      [addItemMutation],
    ),
    removeItem: useCallback(
      (itemId: string) => removeItemMutation.mutate(itemId),
      [removeItemMutation],
    ),
    updateItemQuantity: useCallback(
      (itemId: string, quantity: number) =>
        updateItemQtyMutation.mutate({ itemId, quantity }),
      [updateItemQtyMutation],
    ),
  }
}

export function useLogCustomMeal() {
  const queryClient = useQueryClient()

  const logMutation = useMutation({
    mutationFn: ({
      mealId,
      multiplier,
      itemOverrides,
    }: {
      mealId: string
      multiplier?: number
      itemOverrides?: Map<string, { quantity: number }>
    }) => cmq.logCustomMeal(mealId, multiplier, itemOverrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] })
      queryClient.invalidateQueries({ queryKey: ['todayScanCount'] })
      queryClient.invalidateQueries({ queryKey: ['streak'] })
    },
  })

  return {
    logMeal: logMutation.mutateAsync,
    logging: logMutation.isPending,
  }
}

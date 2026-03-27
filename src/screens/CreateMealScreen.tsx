/**
 * Create Meal Screen — the builder for composing multi-ingredient meals.
 * User names the meal, adds ingredients via search/camera/barcode/recent, adjusts quantities, saves.
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCustomMeals, useCustomMealItems } from '@/hooks/useCustomMeals'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useLanguage } from '@/lib/i18n'
import { clampQuantity } from '@/lib/mealGroupUtils'
import type { FoodSearchResult } from '@/types/shared'
import type { NewCustomMealItem } from '@/db/customMealQueries'
import { getRecentScans } from '@/db/queries'
import IngredientCard from '@/components/IngredientCard'
import MealTotalsBar from '@/components/MealTotalsBar'
import { getFoodEmoji } from '@/lib/foodEmoji'

export default function CreateMealScreen() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { createMeal } = useCustomMeals()

  // Meal metadata
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🍽️')

  // Persisted meal + items — create immediately on mount, save name on exit
  const [mealId, setMealId] = useState<string | null>(null)
  const { items, addItem, removeItem, updateItemQuantity } = useCustomMealItems(mealId)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const search = useWaterfallSearch()

  // Recent foods for quick-add chips
  const recentQuery = useQuery({
    queryKey: ['recentFoods'],
    queryFn: () => getRecentScans(20),
    staleTime: 1000 * 60,
  })
  // Deduplicate by food_name, take first 8
  const recentFoods = useMemo(() => {
    const seen = new Set<string>()
    return (recentQuery.data ?? []).filter(r => {
      if (seen.has(r.food_name)) return false
      seen.add(r.food_name)
      return true
    }).slice(0, 8)
  }, [recentQuery.data])

  // Initialize a draft meal on mount
  useEffect(() => {
    if (mealId) return
    createMeal('Draft Meal', '🍽️').then(id => setMealId(id))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      search.searchText(searchQuery.trim())
    }
  }, [searchQuery, search])

  const handleAddFromSearch = useCallback(async (result: FoodSearchResult) => {
    if (!mealId) return
    const newItem: NewCustomMealItem = {
      food_name: result.name_es || result.name_en || 'Unknown',
      food_name_en: result.name_en ?? null,
      serving_size_g: result.serving_size,
      quantity: 1,
      calories_kcal: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
      fiber_g: result.fiber_g ?? null,
      glycemic_load: result.glycemic_load ?? 0,
      traffic_light: result.traffic_light ?? 'green',
      sort_order: items.length,
    }
    await addItem(mealId, newItem)
    setSearchQuery('')
    search.reset()
  }, [mealId, items.length, addItem, search])

  const handleSave = useCallback(async () => {
    if (!mealId || items.length === 0) return
    const { updateCustomMeal } = await import('@/db/customMealQueries')
    await updateCustomMeal(mealId, { name: name.trim() || 'My Meal', icon })
    navigate('/my-meals')
  }, [mealId, name, icon, items.length, navigate])

  const handleQuantityChange = useCallback((itemId: string, qty: number) => {
    updateItemQuantity(itemId, clampQuantity(qty))
  }, [updateItemQuantity])

  const canSave = items.length > 0 && name.trim().length > 0

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* Header */}
      <header className="glass flex items-center px-5 py-3 z-10 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">{t('customMeal.createTitle')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-48">
        {/* Meal Name */}
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mt-4 mb-2">{t('customMeal.mealName')}</p>
        <div className="rounded-2xl bg-card p-4 shadow-sm border-t-2 border-t-primary flex items-center gap-3">
          <button
            onClick={() => {
              const emoji = prompt('Emoji icon:', icon)
              if (emoji) setIcon(emoji)
            }}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-2xl"
          >
            {icon}
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Protein Shake"
              className="w-full bg-transparent text-lg font-serif font-semibold text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>
        </div>

        {/* Add Ingredients */}
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mt-5 mb-2">{t('customMeal.addIngredients')}</p>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-3 mb-2">
          <span className="text-text-tertiary">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('customMeal.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            onClick={() => navigate('/scan')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm"
          >
            📷
          </button>
          <button
            onClick={() => navigate('/barcode')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm"
          >
            ▦
          </button>
        </div>

        {/* Recent foods chips */}
        {recentFoods.length > 0 && !searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
            {recentFoods.map(food => (
              <button
                key={food.id}
                onClick={() => {
                  if (!mealId) return
                  addItem(mealId, {
                    food_name: food.food_name,
                    food_name_en: food.food_name_en,
                    serving_size_g: food.serving_size_g,
                    quantity: 1,
                    calories_kcal: food.calories_kcal,
                    protein_g: food.protein_g,
                    carbs_g: food.carbs_g,
                    fat_g: food.fat_g,
                    fiber_g: food.fiber_g,
                    glycemic_load: food.glycemic_load,
                    traffic_light: food.traffic_light,
                    sort_order: items.length,
                  })
                }}
                className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary shadow-sm whitespace-nowrap flex-shrink-0"
              >
                <span>{getFoodEmoji(food.food_name)}</span>
                {food.food_name}
              </button>
            ))}
          </div>
        )}

        {/* Search results */}
        {search.results.length > 0 && (
          <div className="rounded-2xl bg-card shadow-sm mb-4 overflow-hidden">
            {search.results.slice(0, 5).map((result, i) => (
              <button
                key={result.id ?? i}
                onClick={() => handleAddFromSearch(result)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface transition-colors border-b border-border/30 last:border-b-0 min-h-[44px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {result.name_es || result.name_en}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {result.serving_size}g · GL {result.glycemic_load ?? '?'}
                  </p>
                </div>
                <span className="text-primary text-sm font-semibold">+ Add</span>
              </button>
            ))}
          </div>
        )}

        {search.state === 'loading' && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        )}

        {/* Ingredients list */}
        {items.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mt-4 mb-2">
              {t('customMeal.ingredients')} ({items.length})
            </p>
            <div className="space-y-2">
              {items.map(item => (
                <IngredientCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onQuantityChange={handleQuantityChange}
                  showDragHandle
                />
              ))}
            </div>
          </>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="mt-4">
            <MealTotalsBar items={items} />
          </div>
        )}
      </div>

      {/* Save button — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-surface via-surface/95 to-transparent z-20">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full rounded-full py-4 text-center text-base font-semibold transition-all min-h-[48px] ${
            canSave
              ? 'btn-gradient text-white shadow-lg'
              : 'bg-surface-container-high text-disabled cursor-not-allowed'
          }`}
          style={canSave ? { boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' } : undefined}
        >
          {t('customMeal.save')}
        </button>
      </div>
    </div>
  )
}

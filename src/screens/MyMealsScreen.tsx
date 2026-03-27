/**
 * My Meals Screen — lists all saved custom meals with create button.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomMeals } from '@/hooks/useCustomMeals'
import { getCustomMealItems } from '@/db/customMealQueries'
import type { CustomMealItem } from '@/db/customMealQueries'
import { useLanguage } from '@/lib/i18n'
import MealCard from '@/components/MealCard'

export default function MyMealsScreen() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { meals, loading, deleteMeal } = useCustomMeals()
  const [itemsByMeal, setItemsByMeal] = useState<Record<string, CustomMealItem[]>>({})
  const [contextMenu, setContextMenu] = useState<string | null>(null)

  // Fetch items for all meals
  useEffect(() => {
    async function loadItems() {
      const map: Record<string, CustomMealItem[]> = {}
      for (const meal of meals) {
        map[meal.id] = await getCustomMealItems(meal.id)
      }
      setItemsByMeal(map)
    }
    if (meals.length > 0) loadItems()
  }, [meals])

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0 overflow-hidden">
      <header className="glass flex items-center justify-between px-5 py-3 z-10 flex-shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-title text-on-surface">{t('customMeal.myMealsTitle')}</h1>
        </div>
        <button
          onClick={() => navigate('/create-meal')}
          className="btn-gradient !py-2 !px-4 !text-sm rounded-full"
        >
          + {t('customMeal.new')}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-lg font-medium text-text-secondary">{t('customMeal.noMeals')}</p>
            <p className="text-sm text-text-tertiary mt-1 mb-6">{t('customMeal.noMealsHint')}</p>
            <button
              onClick={() => navigate('/create-meal')}
              className="btn-gradient rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' }}
            >
              {t('customMeal.createFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {meals.map(meal => (
              <div key={meal.id} className="relative">
                <MealCard
                  meal={meal}
                  items={itemsByMeal[meal.id] ?? []}
                  onTap={() => navigate(`/log-meal/${meal.id}`)}
                  onLongPress={() => setContextMenu(meal.id)}
                />

                {/* Context menu */}
                {contextMenu === meal.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                    <div className="absolute right-2 top-full mt-1 z-50 rounded-xl bg-card shadow-lg py-1 min-w-[140px]">
                      <button
                        onClick={() => { setContextMenu(null); navigate(`/create-meal?edit=${meal.id}`) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={async () => {
                          setContextMenu(null)
                          const { createCustomMeal, addCustomMealItem, getCustomMealItems: getItems } = await import('@/db/customMealQueries')
                          const srcItems = await getItems(meal.id)
                          const newId = await createCustomMeal(`${meal.name} (copy)`, meal.icon)
                          for (const item of srcItems) {
                            const { id: _, meal_id: __, ...rest } = item
                            await addCustomMealItem(newId, rest)
                          }
                          // Trigger refresh
                          window.location.reload()
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface"
                      >
                        📋 Duplicate
                      </button>
                      <button
                        onClick={() => { setContextMenu(null); deleteMeal(meal.id) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-surface"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

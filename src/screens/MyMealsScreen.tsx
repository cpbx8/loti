/**
 * My Meals Screen — lists all saved custom meals with create button.
 * Swipe left to delete. Tap heart to favorite.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomMeals } from '@/hooks/useCustomMeals'
import { getCustomMealItems } from '@/db/customMealQueries'
import type { CustomMealItem } from '@/db/customMealQueries'
import { useLanguage } from '@/lib/i18n'
import MealCard from '@/components/MealCard'

const SNAP_DISTANCE = 80
const SNAP_THRESHOLD = 40

export default function MyMealsScreen() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { meals, loading, deleteMeal, toggleFavorite } = useCustomMeals()
  const [itemsByMeal, setItemsByMeal] = useState<Record<string, CustomMealItem[]>>({})

  // Swipe-to-delete state
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const swipeRef = useRef<{ id: string; startX: number } | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

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

  function handleSwipeStart(id: string, e: React.TouchEvent) {
    // Close any other open swipe
    if (openSwipeId && openSwipeId !== id) setOpenSwipeId(null)
    swipeRef.current = { id, startX: e.touches[0].clientX }
    setActiveDragId(id)
    setDragOffset(0)
  }

  function handleSwipeMove(id: string, e: React.TouchEvent) {
    if (!swipeRef.current || swipeRef.current.id !== id) return
    const dx = e.touches[0].clientX - swipeRef.current.startX
    if (dx < 0) {
      e.preventDefault()
      setDragOffset(Math.max(dx, -SNAP_DISTANCE))
    }
  }

  function handleSwipeEnd(id: string) {
    if (!swipeRef.current || swipeRef.current.id !== id) return
    if (dragOffset < -SNAP_THRESHOLD) {
      setOpenSwipeId(id)
    } else {
      setOpenSwipeId(null)
    }
    setDragOffset(0)
    setActiveDragId(null)
    swipeRef.current = null
  }

  function getOffset(id: string): number {
    if (activeDragId === id) return dragOffset
    if (openSwipeId === id) return -SNAP_DISTANCE
    return 0
  }

  return (
    <div
      className="flex flex-1 flex-col bg-surface min-h-0 overflow-hidden"
      onClick={() => { if (openSwipeId) setOpenSwipeId(null) }}
    >
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
              <div key={meal.id} className="relative overflow-hidden rounded-2xl">
                {/* Delete button revealed by swipe */}
                <div
                  className="absolute right-0 inset-y-0 w-20 flex items-center justify-center bg-error rounded-2xl"
                  style={{ borderRadius: '1rem' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenSwipeId(null); deleteMeal(meal.id) }}
                    className="flex flex-col items-center gap-0.5 text-white"
                  >
                    <span className="text-lg">🗑️</span>
                    <span className="text-[10px] font-semibold">Delete</span>
                  </button>
                </div>

                {/* Swipeable card */}
                <div
                  style={{
                    transform: `translateX(${getOffset(meal.id)}px)`,
                    transition: activeDragId === meal.id ? 'none' : 'transform 0.2s ease-out',
                  }}
                  onTouchStart={(e) => handleSwipeStart(meal.id, e)}
                  onTouchMove={(e) => handleSwipeMove(meal.id, e)}
                  onTouchEnd={() => handleSwipeEnd(meal.id)}
                >
                  <MealCard
                    meal={meal}
                    items={itemsByMeal[meal.id] ?? []}
                    onTap={() => { if (openSwipeId) { setOpenSwipeId(null); return } navigate(`/create-meal?edit=${meal.id}`) }}
                    onFavorite={() => toggleFavorite(meal.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

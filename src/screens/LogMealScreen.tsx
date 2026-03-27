/**
 * Log Meal Screen — confirmation before logging a custom meal.
 * Shows meal name, GL hero, serving multiplier, ingredient list with adjust, macros.
 */
import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomMealItems, useLogCustomMeal } from '@/hooks/useCustomMeals'
import { getCustomMealById } from '@/db/customMealQueries'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '@/lib/i18n'
import { clampQuantity } from '@/lib/mealGroupUtils'
import { worstTrafficLight, sumGlycemicLoad } from '@/lib/mealGroupUtils'
import type { TrafficLight } from '@/types/shared'
import IngredientCard from '@/components/IngredientCard'
import MealTotalsBar from '@/components/MealTotalsBar'

const TL_CIRCLE_BG: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg', yellow: 'bg-tl-yellow-bg', red: 'bg-tl-red-bg',
}
const TL_NUMBER_COLOR: Record<TrafficLight, string> = {
  green: 'text-tl-green-accent', yellow: 'text-tl-yellow-accent', red: 'text-tl-red-accent',
}
const TL_BADGE_STYLE: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg text-tl-green-accent',
  yellow: 'bg-tl-yellow-bg text-tl-yellow-accent',
  red: 'bg-tl-red-bg text-tl-red-accent',
}
const TL_ICON: Record<TrafficLight, string> = { green: '✓', yellow: '⚠', red: '⊘' }
const TL_LABEL: Record<TrafficLight, string> = { green: 'Low Impact', yellow: 'Moderate', red: 'High Impact' }

export default function LogMealScreen() {
  const { mealId } = useParams<{ mealId: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { logMeal, logging } = useLogCustomMeal()
  const { items } = useCustomMealItems(mealId ?? null)

  const mealQuery = useQuery({
    queryKey: ['customMeal', mealId],
    queryFn: () => getCustomMealById(mealId!),
    enabled: !!mealId,
  })
  const meal = mealQuery.data

  const [multiplier, setMultiplier] = useState(1)
  const [itemOverrides, setItemOverrides] = useState<Map<string, { quantity: number }>>(new Map())

  const handleQuantityOverride = useCallback((itemId: string, qty: number) => {
    setItemOverrides(prev => {
      const next = new Map(prev)
      next.set(itemId, { quantity: clampQuantity(qty) })
      return next
    })
  }, [])

  const effectiveItems = items.map(item => ({
    ...item,
    quantity: itemOverrides.get(item.id)?.quantity ?? item.quantity,
  }))

  const tl = worstTrafficLight(effectiveItems.map(i => (i.traffic_light ?? 'green') as TrafficLight))
  const totalGL = sumGlycemicLoad(
    effectiveItems.map(i => ({ glycemic_load: i.glycemic_load ?? 0, quantity: i.quantity * multiplier })),
  )

  const handleLog = useCallback(async () => {
    if (!mealId) return
    await logMeal({ mealId, multiplier, itemOverrides })
    navigate('/')
  }, [mealId, multiplier, itemOverrides, logMeal, navigate])

  if (!meal || !mealId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      <header className="glass flex items-center px-5 py-3 z-10 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">{t('customMeal.logTitle')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-48">
        {/* Hero */}
        <div className="text-center py-6">
          <div className="text-5xl mb-1">{meal.icon}</div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">{meal.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`w-[52px] h-[52px] rounded-full flex flex-col items-center justify-center ${TL_CIRCLE_BG[tl]}`}>
              <span className={`font-serif text-[22px] font-bold leading-none ${TL_NUMBER_COLOR[tl]}`}>{Math.round(totalGL)}</span>
              <span className="text-[8px] font-semibold text-text-tertiary uppercase mt-0.5">GL</span>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TL_BADGE_STYLE[tl]}`}>
              {TL_ICON[tl]} {TL_LABEL[tl]}
            </span>
          </div>
        </div>

        {/* Serving multiplier */}
        <div className="rounded-2xl bg-card p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Servings</p>
              <p className="text-xs text-text-secondary mt-0.5">Multiply all ingredients</p>
            </div>
            <div className="flex items-center gap-5">
              <button
                onClick={() => setMultiplier(m => Math.max(0.5, m - 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-lg font-semibold text-on-surface-variant min-h-[36px]"
              >−</button>
              <span className="text-2xl font-bold text-text-primary min-w-[40px] text-center">{multiplier}×</span>
              <button
                onClick={() => setMultiplier(m => Math.min(10, m + 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-lg font-semibold text-on-surface-variant min-h-[36px]"
              >+</button>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          {t('customMeal.ingredients')}
        </p>
        <div className="space-y-2">
          {effectiveItems.map(item => (
            <IngredientCard
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityOverride}
              showAdjustLink
            />
          ))}
        </div>

        {/* Macros totals */}
        <div className="mt-4">
          <MealTotalsBar items={effectiveItems} multiplier={multiplier} />
        </div>
      </div>

      {/* Log button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-surface via-surface/95 to-transparent z-20">
        <button
          onClick={handleLog}
          disabled={logging}
          className="w-full btn-gradient rounded-full py-4 text-center text-base font-semibold text-white min-h-[48px]"
          style={{ boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' }}
        >
          {logging ? 'Logging...' : t('customMeal.log')}
        </button>
      </div>
    </div>
  )
}

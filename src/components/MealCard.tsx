/**
 * Custom meal card — displays a saved meal in My Meals list.
 * Shows icon, name, item count, total GL, and traffic light badge.
 */
import type { CustomMeal, CustomMealItem } from '@/db/customMealQueries'
import type { TrafficLight } from '@/types/shared'
import { worstTrafficLight, sumGlycemicLoad } from '@/lib/mealGroupUtils'

const TL_BADGE_STYLE: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg text-tl-green-accent',
  yellow: 'bg-tl-yellow-bg text-tl-yellow-accent',
  red: 'bg-tl-red-bg text-tl-red-accent',
}

const TL_GL_COLOR: Record<TrafficLight, string> = {
  green: 'text-tl-green-accent',
  yellow: 'text-tl-yellow-accent',
  red: 'text-tl-red-accent',
}

const TL_ICON: Record<TrafficLight, string> = {
  green: '✓',
  yellow: '⚠',
  red: '⊘',
}

const TL_SHORT: Record<TrafficLight, string> = {
  green: 'Low',
  yellow: 'Med',
  red: 'High',
}

interface Props {
  meal: CustomMeal
  items: CustomMealItem[]
  onTap?: () => void
  onLongPress?: () => void
  onFavorite?: () => void
}

export default function MealCard({ meal, items, onTap, onLongPress, onFavorite }: Props) {
  const tl = worstTrafficLight(
    items.map(i => (i.traffic_light ?? 'green') as TrafficLight),
  )
  const totalGL = sumGlycemicLoad(
    items.map(i => ({ glycemic_load: i.glycemic_load ?? 0, quantity: i.quantity })),
  )

  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  const handleTouchStart = () => {
    if (onLongPress) {
      longPressTimer = setTimeout(onLongPress, 500)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  return (
    <div className="w-full rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow flex items-center min-h-[60px]">
      <button
        onClick={onTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="flex-1 p-4 text-left flex items-center gap-3 min-w-0"
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-2xl">
          {meal.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-text-primary truncate">{meal.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">{items.length} items</p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className={`font-serif text-lg font-bold ${TL_GL_COLOR[tl]}`}>
            {Math.round(totalGL)} <span className="text-[10px] font-sans font-semibold text-text-tertiary">GL</span>
          </p>
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TL_BADGE_STYLE[tl]}`}>
            {TL_ICON[tl]} {TL_SHORT[tl]}
          </span>
        </div>
      </button>

      {onFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite() }}
          className={`flex-shrink-0 px-3 py-4 text-xl leading-none transition-colors ${meal.is_favorite ? 'text-error' : 'text-text-tertiary'}`}
          aria-label={meal.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {meal.is_favorite ? '♥' : '♡'}
        </button>
      )}
    </div>
  )
}

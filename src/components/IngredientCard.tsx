/**
 * Single ingredient row — used in meal builder and log confirmation screens.
 * Shows food name, macros subtitle, GL + traffic dot, quantity, and optional controls.
 */
import type { CustomMealItem } from '@/db/customMealQueries'
import type { TrafficLight } from '@/types/shared'

const TL_DOT: Record<string, string> = {
  green: 'bg-tl-green-fill',
  yellow: 'bg-tl-yellow-fill',
  red: 'bg-tl-red-fill',
}

interface Props {
  item: CustomMealItem
  onQuantityChange?: (itemId: string, qty: number) => void
  onRemove?: (itemId: string) => void
  showDragHandle?: boolean
  showAdjustLink?: boolean
}

export default function IngredientCard({ item, onQuantityChange, onRemove, showDragHandle, showAdjustLink }: Props) {
  const tl = (item.traffic_light ?? 'green') as TrafficLight
  const gl = item.glycemic_load ?? 0

  return (
    <div className="rounded-2xl bg-card p-3.5 shadow-sm flex items-center gap-2.5">
      {showDragHandle && (
        <span className="text-disabled text-sm cursor-grab select-none">⠿</span>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{item.food_name}</p>
        <p className="text-xs text-text-secondary mt-0.5 truncate">
          {item.protein_g ?? 0}g P · {item.carbs_g ?? 0}g C · {item.fat_g ?? 0}g F
        </p>
      </div>

      {/* GL + traffic dot */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`h-2 w-2 rounded-full ${TL_DOT[tl]}`} />
        <span className="text-sm font-bold text-text-primary">{Math.round(gl * item.quantity)}</span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase">GL</span>
      </div>

      {/* Quantity badge */}
      <div className="bg-surface-container-low rounded-lg px-2.5 py-1 text-[13px] font-semibold text-on-surface-variant flex-shrink-0">
        {item.quantity}×
      </div>

      {showAdjustLink && onQuantityChange && (
        <button
          onClick={() => {
            const next = parseFloat(prompt('Quantity:', String(item.quantity)) ?? String(item.quantity))
            if (!isNaN(next) && next > 0) onQuantityChange(item.id, next)
          }}
          className="text-xs font-medium text-primary flex-shrink-0"
        >
          adjust
        </button>
      )}

      {onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-disabled hover:text-error text-lg flex-shrink-0 min-w-[24px] min-h-[24px] flex items-center justify-center"
        >
          ×
        </button>
      )}
    </div>
  )
}

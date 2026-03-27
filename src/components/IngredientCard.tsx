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
}

export default function IngredientCard({ item, onQuantityChange, onRemove, showDragHandle }: Props) {
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
        <span className="text-sm font-bold text-text-primary">
          {Math.round(gl * item.quantity * 10) / 10}
        </span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase">GL</span>
      </div>

      {/* Quantity stepper */}
      {onQuantityChange ? (
        <div className="flex items-center gap-1 bg-surface-container-low rounded-lg flex-shrink-0">
          <button
            onClick={() => onQuantityChange(item.id, Math.max(0.5, Math.round((item.quantity - 0.5) * 2) / 2))}
            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary text-lg leading-none"
            aria-label="Decrease quantity"
          >−</button>
          <span className="text-[13px] font-semibold text-on-surface-variant min-w-[28px] text-center">
            {item.quantity}×
          </span>
          <button
            onClick={() => onQuantityChange(item.id, Math.round((item.quantity + 0.5) * 2) / 2)}
            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary text-lg leading-none"
            aria-label="Increase quantity"
          >+</button>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-lg px-2.5 py-1 text-[13px] font-semibold text-on-surface-variant flex-shrink-0">
          {item.quantity}×
        </div>
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

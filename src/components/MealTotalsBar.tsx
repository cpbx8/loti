/**
 * GL-focused totals bar — hero GL circle + verdict badge + macros row.
 * Reused in builder, log confirmation, and anywhere meal totals are shown.
 */
import type { TrafficLight } from '@/types/shared'
import type { CustomMealItem } from '@/db/customMealQueries'
import { worstTrafficLight, sumGlycemicLoad } from '@/lib/mealGroupUtils'

const TL_CIRCLE_BG: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg',
  yellow: 'bg-tl-yellow-bg',
  red: 'bg-tl-red-bg',
}

const TL_NUMBER_COLOR: Record<TrafficLight, string> = {
  green: 'text-tl-green-accent',
  yellow: 'text-tl-yellow-accent',
  red: 'text-tl-red-accent',
}

const TL_BADGE_STYLE: Record<TrafficLight, string> = {
  green: 'bg-tl-green-bg text-tl-green-accent',
  yellow: 'bg-tl-yellow-bg text-tl-yellow-accent',
  red: 'bg-tl-red-bg text-tl-red-accent',
}

const TL_ICON: Record<TrafficLight, string> = {
  green: '✓',
  yellow: '⚠',
  red: '⊘',
}

const TL_LABEL: Record<TrafficLight, string> = {
  green: 'Low Impact',
  yellow: 'Moderate',
  red: 'High Impact',
}

interface Props {
  items: CustomMealItem[]
  multiplier?: number
}

export default function MealTotalsBar({ items, multiplier = 1 }: Props) {
  const glItems = items.map(i => ({
    glycemic_load: (i.glycemic_load ?? 0),
    quantity: i.quantity * multiplier,
  }))
  const totalGL = sumGlycemicLoad(glItems)
  const tl = worstTrafficLight(
    items.map(i => (i.traffic_light ?? 'green') as TrafficLight),
  )

  const totalProtein = Math.round(items.reduce((s, i) => s + (i.protein_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalCarbs = Math.round(items.reduce((s, i) => s + (i.carbs_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalFat = Math.round(items.reduce((s, i) => s + (i.fat_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalFiber = Math.round(items.reduce((s, i) => s + (i.fiber_g ?? 0) * i.quantity * multiplier, 0) * 10) / 10
  const totalCal = Math.round(items.reduce((s, i) => s + (i.calories_kcal ?? 0) * i.quantity * multiplier, 0))

  return (
    <div className="rounded-[20px] bg-card p-5 shadow-md">
      {/* Hero: GL circle + verdict */}
      <div className="flex items-center justify-center gap-4 pb-4 mb-4 border-b border-border/40">
        <div className={`w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center ${TL_CIRCLE_BG[tl]}`}>
          <span className={`font-serif text-[28px] font-bold leading-none ${TL_NUMBER_COLOR[tl]}`}>
            {Math.round(totalGL)}
          </span>
          <span className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">GL</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TL_BADGE_STYLE[tl]}`}>
            {TL_ICON[tl]} {TL_LABEL[tl]}
          </span>
          <span className="text-xs text-text-secondary">Combined glycemic load</span>
        </div>
      </div>

      {/* Macros row */}
      <div className="flex justify-between text-center">
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalProtein}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Protein</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalCarbs}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Carbs</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalFat}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Fat</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalFiber}g</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Fiber</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-on-surface-variant">{totalCal}</p>
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mt-0.5">Cal</p>
        </div>
      </div>
    </div>
  )
}

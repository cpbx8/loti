/**
 * CompositeResultCard — for decomposed foods (bistec taco -> tortilla + steak).
 * Shows total macros + per-component breakdown.
 */
import type { FoodSearchResult } from '@/types/shared'

const SOURCE_INFO: Record<string, { label: string; color: string }> = {
  cache:         { label: 'Cached',          color: 'text-info' },
  seed:          { label: 'Verified',        color: 'text-tl-green-fill' },
  fatsecret:     { label: 'FatSecret',       color: 'text-info' },
  openfoodfacts: { label: 'Open Food Facts', color: 'text-tl-green-accent' },
  gpt4o:         { label: 'AI Estimated',    color: 'text-tl-yellow-fill' },
  user:          { label: 'Community',        color: 'text-info' },
}

function MacroCard({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-xl font-bold text-text-primary">
        {value != null ? Math.round(value) : '--'}
        <span className="text-sm font-normal text-text-tertiary"> {unit}</span>
      </p>
    </div>
  )
}

interface CompositeResultCardProps {
  total: FoodSearchResult
  components: FoodSearchResult[]
  onLog: () => void
  onScanAnother: () => void
}

export default function CompositeResultCard({ total, components, onLog, onScanAnother }: CompositeResultCardProps) {
  const info = SOURCE_INFO[total.source] ?? { label: total.source, color: 'text-text-tertiary' }

  return (
    <div className="rounded-xl bg-card shadow-md border-t-2 border-t-primary overflow-hidden">
      <div className="flex flex-col gap-5 p-5">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Your Meal</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {total.name_en || total.name_es}
          </p>
        </div>

        {/* Total macros grid */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={total.calories} unit="kcal" />
          <MacroCard label="Protein" value={total.protein_g} unit="g" />
          <MacroCard label="Carbs" value={total.carbs_g} unit="g" />
          <MacroCard label="Fat" value={total.fat_g} unit="g" />
        </div>

        {/* Component breakdown */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-2">Breakdown</p>
          <div className="space-y-2">
            {components.map((c, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{c.name_en || c.name_es}</p>
                  <p className="text-xs text-text-tertiary">{c.serving_size}g</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-text-primary">{Math.round(c.calories)} kcal</p>
                  <p className="text-xs text-text-tertiary">
                    {Math.round(c.protein_g)}p  {Math.round(c.carbs_g)}c  {Math.round(c.fat_g)}f
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-sm ${info.color}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            {info.label}
          </span>
        </div>

        {/* Action row */}
        <div className="flex gap-3">
          <button
            onClick={onScanAnother}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface active:bg-surface min-h-[44px]"
          >
            Scan Another
          </button>
          <button
            onClick={onLog}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark active:bg-primary-dark min-h-[44px]"
          >
            Log This
          </button>
        </div>
      </div>
    </div>
  )
}

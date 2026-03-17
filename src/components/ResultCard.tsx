/**
 * ResultCard — hero result card for displaying a single food search result.
 * White card, 12px border radius, subtle shadow, generous padding.
 * Thin 2px colored top border in brand.primary.
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

interface ResultCardProps {
  result: FoodSearchResult
  onScanAnother: () => void
  onLog: () => void
}

export default function ResultCard({ result: r, onScanAnother, onLog }: ResultCardProps) {
  const displayName = r.name_en || r.name_es
  const subtitle = r.name_en && r.name_es !== r.name_en ? r.name_es : undefined
  const info = SOURCE_INFO[r.source] ?? { label: r.source, color: 'text-text-tertiary' }

  return (
    <div className="rounded-xl bg-card shadow-md border-t-2 border-t-primary overflow-hidden">
      <div className="flex flex-col gap-5 p-5">
        {/* Food name */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{displayName}</h2>
          {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
          <p className="text-sm text-text-tertiary mt-1">
            Per {r.serving_description ?? `${r.serving_size}${r.serving_unit}`}
          </p>
        </div>

        {/* Macro grid */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={r.calories} unit="kcal" />
          <MacroCard label="Protein" value={r.protein_g} unit="g" />
          <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
          <MacroCard label="Fat" value={r.fat_g} unit="g" />
        </div>

        {/* Source badge + confidence */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-sm ${info.color}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            {info.label}
          </span>
          {r.confidence < 1 && (
            <span className="text-xs text-text-tertiary">
              ({Math.round(r.confidence * 100)}% confidence)
            </span>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-text-tertiary leading-relaxed">
          Values are estimates. Consult a healthcare professional for medical advice.
        </p>

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

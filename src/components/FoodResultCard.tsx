/**
 * Shared food result display — used by Search, Barcode, Text Input, and Photo Scan screens.
 */
import type { FoodSearchResult } from '@/types/shared'

// ─── Source Badge ─────────────────────────────────────────────

const SOURCE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  cache:         { icon: '⚡', label: 'Cached',        color: 'text-purple-400' },
  seed:          { icon: '🌱', label: 'Verified',      color: 'text-green-400' },
  fatsecret:     { icon: '📊', label: 'FatSecret',     color: 'text-blue-400' },
  openfoodfacts: { icon: '🌍', label: 'Open Food Facts', color: 'text-emerald-400' },
  gpt4o:         { icon: '🤖', label: 'AI Estimated',  color: 'text-amber-400' },
  user:          { icon: '👤', label: 'User Verified',  color: 'text-cyan-400' },
}

function SourceBadge({ source, confidence }: { source: string; confidence: number }) {
  const info = SOURCE_INFO[source] ?? { icon: '❓', label: source, color: 'text-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${info.color}`}>
      {info.icon} {info.label}
      {confidence < 1 && (
        <span className="text-gray-500">({Math.round(confidence * 100)}%)</span>
      )}
    </span>
  )
}

// ─── Macro Card ───────────────────────────────────────────────

function MacroCard({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  return (
    <div className="rounded-lg bg-gray-900 p-3">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold text-white">
        {value != null ? Math.round(value) : '—'}
        <span className="text-sm font-normal text-gray-400"> {unit}</span>
      </p>
    </div>
  )
}

// ─── Single Result Card ───────────────────────────────────────

interface FoodResultCardProps {
  result: FoodSearchResult
  showSource?: boolean
}

export function FoodResultCard({ result: r, showSource = true }: FoodResultCardProps) {
  const displayName = r.name_en || r.name_es
  const subtitle = r.name_en && r.name_es !== r.name_en ? r.name_es : undefined

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div>
        <h2 className="text-xl font-bold text-white">{displayName}</h2>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>

      {/* Macros */}
      <div className="grid grid-cols-2 gap-3">
        <MacroCard label="Calories" value={r.calories} unit="kcal" />
        <MacroCard label="Protein" value={r.protein_g} unit="g" />
        <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
        <MacroCard label="Fat" value={r.fat_g} unit="g" />
      </div>

      {/* Serving info */}
      <p className="text-sm text-gray-500">
        Per {r.serving_description ?? `${r.serving_size}${r.serving_unit}`}
        {r.fiber_g != null && ` · ${r.fiber_g}g fiber`}
      </p>

      {/* Source badge */}
      {showSource && (
        <SourceBadge source={r.source} confidence={r.confidence} />
      )}
    </div>
  )
}

// ─── Result List (multiple results) ──────────────────────────

interface FoodResultListProps {
  results: FoodSearchResult[]
  onSelect?: (result: FoodSearchResult) => void
  selectedIndex?: number
}

export function FoodResultList({ results, onSelect, selectedIndex }: FoodResultListProps) {
  return (
    <div className="flex flex-col gap-2">
      {results.map((r, i) => {
        const displayName = r.name_en || r.name_es
        const isSelected = selectedIndex === i
        return (
          <button
            key={r.id ?? `${r.name_es}-${i}`}
            onClick={() => onSelect?.(r)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
              isSelected ? 'bg-primary/20 border border-primary/40' : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-400">
                {Math.round(r.calories)} kcal · {Math.round(r.protein_g)}p · {Math.round(r.carbs_g)}c · {Math.round(r.fat_g)}f
              </p>
            </div>
            <SourceBadge source={r.source} confidence={r.confidence} />
          </button>
        )
      })}
    </div>
  )
}

// ─── Latency / Source Pill ────────────────────────────────────

export function SearchMeta({ source, cached, latencyMs }: { source: string; cached: boolean; latencyMs: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {cached && <span className="rounded bg-purple-900/30 px-1.5 py-0.5 text-purple-400">cached</span>}
      <span>{source}</span>
      <span>·</span>
      <span>{latencyMs}ms</span>
    </div>
  )
}

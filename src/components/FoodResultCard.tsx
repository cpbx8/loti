/**
 * Shared food result display — used by Search, Barcode, Text Input, and Photo Scan screens.
 * Light theme with white cards, subtle shadows, no emoji.
 * Shows TrafficLightBadge when GI data is available.
 */
import type { FoodSearchResult } from '@/types/shared'
import TrafficLightBadge from './TrafficLightBadge'

// ─── Source Badge ─────────────────────────────────────────────

const SOURCE_INFO: Record<string, { label: string; color: string }> = {
  cache:         { label: 'Cached',          color: 'text-info' },
  seed:          { label: 'Verified',        color: 'text-tl-green-fill' },
  fatsecret:     { label: 'FatSecret',       color: 'text-info' },
  openfoodfacts: { label: 'Open Food Facts', color: 'text-tl-green-accent' },
  gpt4o:         { label: 'AI Estimated',    color: 'text-tl-yellow-fill' },
  user:          { label: 'Community',        color: 'text-info' },
}

function SourceBadge({ source, confidence }: { source: string; confidence: number }) {
  const info = SOURCE_INFO[source] ?? { label: source, color: 'text-text-tertiary' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${info.color}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {info.label}
      {confidence < 1 && (
        <span className="text-text-tertiary">({Math.round(confidence * 100)}%)</span>
      )}
    </span>
  )
}

// ─── Macro Card ───────────────────────────────────────────────

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

// ─── Single Result Card ───────────────────────────────────────

interface FoodResultCardProps {
  result: FoodSearchResult
  showSource?: boolean
}

export function FoodResultCard({ result: r, showSource = true }: FoodResultCardProps) {
  const displayName = r.name_en || r.name_es
  const subtitle = r.name_en && r.name_es !== r.name_en ? r.name_es : undefined
  const hasTL = r.traffic_light != null

  return (
    <div className="flex flex-col gap-4">
      {/* Name + Traffic Light */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary">{displayName}</h2>
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {hasTL && (
          <TrafficLightBadge rating={r.traffic_light!} size="md" animated />
        )}
      </div>

      {/* GI / GL hero section */}
      {hasTL && r.glycemic_index != null && (
        <div className={`rounded-xl p-4 ${
          r.traffic_light === 'green' ? 'bg-tl-green-bg' :
          r.traffic_light === 'yellow' ? 'bg-tl-yellow-bg' :
          'bg-tl-red-bg'
        }`}>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: r.traffic_light === 'green' ? '#2E7D32' : r.traffic_light === 'yellow' ? '#E65100' : '#C62828' }}>
                {Math.round(r.glycemic_index)}
              </p>
              <p className="text-xs text-text-secondary">GI</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: r.traffic_light === 'green' ? '#2E7D32' : r.traffic_light === 'yellow' ? '#E65100' : '#C62828' }}>
                {r.glycemic_load != null ? Math.round(r.glycemic_load) : '--'}
              </p>
              <p className="text-xs text-text-secondary">GL</p>
            </div>
          </div>
          {r.gi_source && (
            <p className="mt-2 text-center text-xs text-text-tertiary">
              {r.gi_source === 'published' ? 'Published GI data' : 'AI-estimated GI'}
            </p>
          )}
        </div>
      )}

      {/* Swap suggestion */}
      {r.swap_suggestion && (
        <div className="rounded-xl bg-info/5 border border-info/10 px-4 py-3">
          <p className="text-sm text-info">{r.swap_suggestion}</p>
        </div>
      )}

      {/* Macros */}
      <div className="grid grid-cols-2 gap-3">
        <MacroCard label="Calories" value={r.calories} unit="kcal" />
        <MacroCard label="Protein" value={r.protein_g} unit="g" />
        <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
        <MacroCard label="Fat" value={r.fat_g} unit="g" />
      </div>

      {/* Serving info */}
      <p className="text-sm text-text-tertiary">
        Per {r.serving_description ?? `${r.serving_size}${r.serving_unit}`}
        {r.fiber_g != null && ` · ${r.fiber_g}g fiber`}
      </p>

      {/* Source badge */}
      {showSource && (
        <SourceBadge source={r.source} confidence={r.confidence} />
      )}

      {/* Disclaimer */}
      <p className="text-xs text-text-tertiary">
        This information is educational. Consult your doctor for treatment decisions.
      </p>
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
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors min-h-[44px] ${
              isSelected ? 'bg-primary-light border border-primary/30' : 'bg-card shadow-sm hover:bg-surface'
            }`}
          >
            {r.traffic_light && (
              <TrafficLightBadge rating={r.traffic_light} size="sm" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary truncate">{displayName}</p>
              <p className="text-xs text-text-secondary">
                {Math.round(r.calories)} kcal · {Math.round(r.protein_g)}p · {Math.round(r.carbs_g)}c · {Math.round(r.fat_g)}f
              </p>
            </div>
            {r.glycemic_load != null && (
              <span className="text-sm font-medium text-text-secondary">GL {Math.round(r.glycemic_load)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Composite Result (total + breakdown) ────────────────────

interface CompositeResultCardProps {
  total: FoodSearchResult
  components: FoodSearchResult[]
}

export function CompositeResultCard({ total, components }: CompositeResultCardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Total */}
      <FoodResultCard result={total} showSource={false} />

      {/* Component breakdown */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-2">Breakdown</p>
        <div className="space-y-1.5">
          {components.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2">
              {c.traffic_light && (
                <TrafficLightBadge rating={c.traffic_light} size="sm" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{c.name_en || c.name_es}</p>
                <p className="text-xs text-text-tertiary">{c.serving_size}g</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-text-primary">{Math.round(c.calories)} kcal</p>
                <p className="text-xs text-text-tertiary">
                  GL {c.glycemic_load != null ? Math.round(c.glycemic_load) : '--'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Check if results follow the composite pattern: first item is total, rest are components */
export function isCompositeResult(results: FoodSearchResult[]): boolean {
  if (results.length < 3) return false
  const first = results[0]
  return first.serving_description?.startsWith('Total (') ?? false
}

// ─── Latency / Source Pill ────────────────────────────────────

export function SearchMeta({ source, cached, latencyMs }: { source: string; cached: boolean; latencyMs: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-tertiary">
      {cached && <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-info">cached</span>}
      <span>{source}</span>
      <span>·</span>
      <span>{latencyMs}ms</span>
    </div>
  )
}

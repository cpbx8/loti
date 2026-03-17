import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '@/hooks/useSearch'
import { useFavorites } from '@/hooks/useFavorites'
import { useDailyLog } from '@/hooks/useDailyLog'
import type { FoodSearchResult, ScanResult } from '@/types/shared'
import FatSecretAttribution from '@/components/FatSecretAttribution'

const SOURCE_META: Record<string, { label: string; color: string }> = {
  cache:         { label: 'Cached',          color: 'text-info' },
  fatsecret:     { label: 'FatSecret',       color: 'text-info' },
  openfoodfacts: { label: 'Open Food Facts', color: 'text-tl-green-accent' },
  gpt4o:         { label: 'AI Estimated',    color: 'text-tl-yellow-fill' },
  seed:          { label: 'Verified',        color: 'text-tl-green-fill' },
  user:          { label: 'Community',        color: 'text-info' },
}

export default function SearchScreen() {
  const navigate = useNavigate()
  const search = useSearch()
  const { add: addFav, remove: removeFav, isFavorite, favorites } = useFavorites()
  const { addEntry } = useDailyLog()
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)

  const handleLog = (r: FoodSearchResult) => {
    addEntry({
      food_name: r.name_en || r.name_es,
      calories_kcal: r.calories,
      protein_g: r.protein_g,
      carbs_g: r.carbs_g,
      fat_g: r.fat_g,
      fiber_g: r.fiber_g ?? null,
      glycemic_load: r.glycemic_load ?? null,
      serving_size_g: r.serving_size,
      input_method: 'manual_search',
    })
    search.clear()
    setSelected(null)
    navigate('/')
  }

  const toggleFav = (result: FoodSearchResult) => {
    const scanResult = toScanResult(result)
    if (isFavorite(result.name_es)) {
      const fav = favorites.find(f => f.food_name.toLowerCase() === result.name_es.toLowerCase())
      if (fav) removeFav(fav.id)
    } else {
      addFav(scanResult)
    }
  }

  // ─── Detail view ─────────────────────────────────────────────
  if (selected) {
    return (
      <ResultView
        result={selected}
        source={search.source}
        cached={search.cached}
        latencyMs={search.latencyMs}
        isFav={isFavorite(selected.name_es)}
        onToggleFav={() => toggleFav(selected)}
        onBack={() => setSelected(null)}
        onLog={() => handleLog(selected)}
      />
    )
  }

  // ─── Search view ─────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-text-primary">Search Food</h1>
      </header>

      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            value={search.query}
            onChange={e => search.setQuery(e.target.value)}
            placeholder="Search any food..."
            autoFocus
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 shadow-sm"
          />
          {search.query && (
            <button
              onClick={search.clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Searching */}
        {search.state === 'searching' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
            <p className="text-sm text-text-secondary">Searching across databases...</p>
          </div>
        )}

        {/* Results list */}
        {search.state === 'done' && search.results.length > 0 && (
          <div>
            {/* Source info */}
            <div className="mb-3 flex items-center gap-2">
              <SourceBadge source={search.source} />
              {search.cached && (
                <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs text-info">Instant</span>
              )}
              <span className="ml-auto text-xs text-text-tertiary">{search.latencyMs}ms</span>
            </div>

            <div className="space-y-2">
              {search.results.map((result, i) => (
                <button
                  key={result.id ?? `${result.name_es}-${i}`}
                  onClick={() => setSelected(result)}
                  className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left shadow-sm hover:shadow-md transition-shadow min-h-[44px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{result.name_es}</p>
                    {result.name_en && result.name_en !== result.name_es && (
                      <p className="text-xs text-text-tertiary truncate">{result.name_en}</p>
                    )}
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {result.calories} kcal · {result.protein_g}g P · {result.carbs_g}g C · {result.fat_g}g F
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-text-tertiary">
                      {result.serving_size}{result.serving_unit}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs ${SOURCE_META[result.source]?.color ?? 'text-text-tertiary'}`}>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {SOURCE_META[result.source]?.label ?? result.source}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {search.state === 'error' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-error">{search.error ?? 'Search failed'}</p>
            <button
              onClick={search.retry}
              className="rounded-xl border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-card min-h-[44px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {search.state === 'idle' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 pt-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-text-secondary">Type any food to get nutrition info</p>
              <p className="text-xs text-text-tertiary">
                Searches FatSecret, Open Food Facts, and AI
              </p>

              {/* Quick examples */}
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {['cheesecake', 'tacos al pastor', 'arroz con leche', 'pozole', 'banana', 'Coca-Cola'].map(example => (
                  <button
                    key={example}
                    onClick={() => search.setQuery(example)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-secondary hover:border-primary hover:text-primary min-h-[32px]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent favorites */}
            {favorites.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Favorites</p>
                  <button
                    onClick={() => navigate('/favorites')}
                    className="text-xs text-primary hover:text-primary-dark"
                  >
                    See all
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {favorites.slice(0, 6).map(fav => (
                    <button
                      key={fav.id}
                      onClick={() => search.setQuery(fav.food_name)}
                      className="flex-shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-left hover:shadow-sm min-h-[44px]"
                    >
                      <p className="text-sm font-medium text-text-primary whitespace-nowrap">{fav.food_name}</p>
                      <p className="text-xs text-text-tertiary">{fav.cached_result.calories_kcal} kcal</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Result Detail View ──────────────────────────────────────

function ResultView({ result: r, source, cached, latencyMs, isFav, onToggleFav, onBack, onLog }: {
  result: FoodSearchResult
  source: string
  cached: boolean
  latencyMs: number
  isFav: boolean
  onToggleFav: () => void
  onBack: () => void
  onLog: () => void
}) {
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button onClick={onBack} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-text-primary truncate">{r.name_es}</h1>
        <button
          onClick={onToggleFav}
          className="ml-auto p-2 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              className={isFav ? 'text-primary' : 'text-text-tertiary'}
              strokeLinecap="round" strokeLinejoin="round"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Macros grid */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={r.calories} unit="kcal" highlight />
          <MacroCard label="Protein" value={r.protein_g} unit="g" />
          <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
          <MacroCard label="Fat" value={r.fat_g} unit="g" />
        </div>

        {r.fiber_g != null && (
          <div className="rounded-xl bg-card px-3 py-2 shadow-sm">
            <p className="text-sm text-text-secondary">Fiber: <span className="font-medium text-text-primary">{r.fiber_g}g</span></p>
          </div>
        )}

        {/* Serving info */}
        <p className="text-sm text-text-tertiary">
          Per {r.serving_size}{r.serving_unit}
          {r.serving_description && ` (${r.serving_description})`}
        </p>

        {/* Source attribution */}
        {r.source === 'fatsecret' ? (
          <FatSecretAttribution />
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 shadow-sm">
            <span className={`inline-block h-3 w-3 rounded-full ${
              SOURCE_META[r.source]?.color === 'text-info' ? 'bg-info' :
              SOURCE_META[r.source]?.color === 'text-tl-green-fill' ? 'bg-tl-green-fill' :
              SOURCE_META[r.source]?.color === 'text-tl-green-accent' ? 'bg-tl-green-accent' :
              SOURCE_META[r.source]?.color === 'text-tl-yellow-fill' ? 'bg-tl-yellow-fill' :
              'bg-text-tertiary'
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                {SOURCE_META[r.source]?.label ?? r.source}
              </p>
              <p className="text-xs text-text-tertiary">
                {r.source === 'cache' && 'Previously looked up -- instant result'}
                {r.source === 'openfoodfacts' && 'Open-source food database'}
                {r.source === 'gpt4o' && 'AI-estimated values -- may vary from actual'}
                {r.source === 'seed' && 'Pre-loaded Mexican food data'}
                {r.source === 'user' && 'Community-contributed data'}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-text-tertiary">
                {Math.round(r.confidence * 100)}% conf
              </span>
              {cached && <span className="text-xs text-info">cached</span>}
            </div>
          </div>
        )}

        {/* Latency */}
        <p className="text-xs text-text-tertiary text-center">
          Found via {source} in {latencyMs}ms
        </p>
      </div>

      <div className="flex gap-3 border-t border-border bg-card p-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface min-h-[44px]"
        >
          Back to Results
        </button>
        <button
          onClick={onLog}
          className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
        >
          Log This
        </button>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source]
  if (!meta) return null
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 text-xs font-medium shadow-sm ${meta.color}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  )
}

function MacroCard({ label, value, unit, highlight }: { label: string; value: number | null; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 shadow-sm ${highlight ? 'bg-primary-light' : 'bg-card'}`}>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-primary' : 'text-text-primary'}`}>
        {value != null ? value : '--'}<span className="text-sm font-normal text-text-tertiary"> {unit}</span>
      </p>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

/** Convert a FoodSearchResult to a ScanResult for favorites compatibility */
function toScanResult(r: FoodSearchResult): ScanResult {
  return {
    food_name: r.name_es,
    category: 'other',
    calories_kcal: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    fiber_g: r.fiber_g ?? null,
    serving_size_g: r.serving_size,
    serving_label: r.serving_description ?? null,
    glycemic_index: null,
    glycemic_load: null,
    traffic_light: 'green',
    confidence: r.confidence >= 0.8 ? 'high' : r.confidence >= 0.5 ? 'medium' : 'low',
    gi_source: 'unknown',
    swap_suggestion: null,
    disclaimer: 'Values are estimates. Consult a healthcare professional for medical advice.',
    input_method: 'manual_search',
    quantity: 1,
    per_unit_gl: null,
    matched_food_id: r.id ?? null,
    match_method: r.source,
  }
}

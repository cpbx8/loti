import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '@/hooks/useSearch'
import { useFavorites } from '@/hooks/useFavorites'
import { useDailyLog } from '@/hooks/useDailyLog'
import type { FoodSearchResult, ScanResult } from '@/types/shared'

const SOURCE_META: Record<string, { icon: string; label: string; color: string }> = {
  cache: { icon: '⚡', label: 'Cached', color: 'text-blue-400' },
  fatsecret: { icon: '📊', label: 'FatSecret', color: 'text-green-400' },
  openfoodfacts: { icon: '🌍', label: 'Open Food Facts', color: 'text-orange-400' },
  gpt4o: { icon: '🤖', label: 'AI Estimated', color: 'text-purple-400' },
  seed: { icon: '🌱', label: 'Verified', color: 'text-emerald-400' },
  user: { icon: '👤', label: 'Community', color: 'text-cyan-400' },
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
    <div className="flex flex-1 flex-col bg-gray-950">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">Search Food</h1>
      </header>

      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            value={search.query}
            onChange={e => search.setQuery(e.target.value)}
            placeholder="Search any food..."
            autoFocus
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
          />
          {search.query && (
            <button
              onClick={search.clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Searching */}
        {search.state === 'searching' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-700 border-t-primary" />
            <p className="text-sm text-gray-400">Searching across databases...</p>
          </div>
        )}

        {/* Results list */}
        {search.state === 'done' && search.results.length > 0 && (
          <div>
            {/* Source info */}
            <div className="mb-3 flex items-center gap-2">
              <SourceBadge source={search.source} />
              {search.cached && (
                <span className="rounded-full bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">⚡ Instant</span>
              )}
              <span className="ml-auto text-xs text-gray-600">{search.latencyMs}ms</span>
            </div>

            <div className="space-y-2">
              {search.results.map((result, i) => (
                <button
                  key={result.id ?? `${result.name_es}-${i}`}
                  onClick={() => setSelected(result)}
                  className="flex w-full items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-left hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{result.name_es}</p>
                    {result.name_en && result.name_en !== result.name_es && (
                      <p className="text-xs text-gray-500 truncate">{result.name_en}</p>
                    )}
                    <p className="mt-0.5 text-sm text-gray-400">
                      {result.calories} kcal · {result.protein_g}g P · {result.carbs_g}g C · {result.fat_g}g F
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {result.serving_size}{result.serving_unit}
                    </span>
                    <span className={`text-xs ${SOURCE_META[result.source]?.color ?? 'text-gray-500'}`}>
                      {SOURCE_META[result.source]?.icon} {SOURCE_META[result.source]?.label ?? result.source}
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
            <p className="text-sm text-red-400">{search.error ?? 'Search failed'}</p>
            <button
              onClick={search.retry}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {search.state === 'idle' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 pt-8 text-center">
              <div className="text-4xl">🔍</div>
              <p className="text-sm text-gray-400">Type any food to get nutrition info</p>
              <p className="text-xs text-gray-600">
                Searches FatSecret → Open Food Facts → AI
              </p>

              {/* Quick examples */}
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {['cheesecake', 'tacos al pastor', 'arroz con leche', 'pozole', 'banana', 'Coca-Cola'].map(example => (
                  <button
                    key={example}
                    onClick={() => search.setQuery(example)}
                    className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-white"
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
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Favorites</p>
                  <button
                    onClick={() => navigate('/favorites')}
                    className="text-xs text-primary hover:text-primary-light"
                  >
                    See all
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {favorites.slice(0, 6).map(fav => (
                    <button
                      key={fav.id}
                      onClick={() => search.setQuery(fav.food_name)}
                      className="flex-shrink-0 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-left hover:bg-gray-800"
                    >
                      <p className="text-sm font-medium text-white whitespace-nowrap">{fav.food_name}</p>
                      <p className="text-xs text-gray-500">{fav.cached_result.calories_kcal} kcal</p>
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
    <div className="flex flex-1 flex-col bg-gray-950">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white truncate">{r.name_es}</h1>
        <button
          onClick={onToggleFav}
          className="ml-auto p-1 flex-shrink-0"
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              className={isFav ? 'text-yellow-400' : 'text-gray-500'}
              strokeLinecap="round" strokeLinejoin="round"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Macros grid */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={r.calories} unit="kcal" highlight />
          <MacroCard label="Protein" value={r.protein_g} unit="g" />
          <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
          <MacroCard label="Fat" value={r.fat_g} unit="g" />
        </div>

        {r.fiber_g != null && (
          <div className="rounded-lg bg-gray-900 px-3 py-2">
            <p className="text-sm text-gray-400">Fiber: <span className="font-medium text-white">{r.fiber_g}g</span></p>
          </div>
        )}

        {/* Serving info */}
        <p className="text-sm text-gray-500">
          Per {r.serving_size}{r.serving_unit}
          {r.serving_description && ` (${r.serving_description})`}
        </p>

        {/* Source badge */}
        <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2.5">
          <span className="text-lg">{SOURCE_META[r.source]?.icon ?? '❓'}</span>
          <div className="flex-1">
            <p className={`text-sm font-medium ${SOURCE_META[r.source]?.color ?? 'text-gray-300'}`}>
              {SOURCE_META[r.source]?.label ?? r.source}
            </p>
            <p className="text-xs text-gray-500">
              {r.source === 'cache' && 'Previously looked up — instant result'}
              {r.source === 'fatsecret' && 'Verified nutrition database'}
              {r.source === 'openfoodfacts' && 'Open-source food database'}
              {r.source === 'gpt4o' && 'AI-estimated values — may vary from actual'}
              {r.source === 'seed' && 'Pre-loaded Mexican food data'}
              {r.source === 'user' && 'Community-contributed data'}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-600">
              {Math.round(r.confidence * 100)}% conf
            </span>
            {cached && <span className="text-xs text-blue-400">⚡ cached</span>}
          </div>
        </div>

        {/* Latency */}
        <p className="text-xs text-gray-600 text-center">
          Found via {source} in {latencyMs}ms
        </p>
      </div>

      <div className="flex gap-3 border-t border-gray-800 p-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
        >
          Back to Results
        </button>
        <button
          onClick={onLog}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
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
    <span className={`rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  )
}

function MacroCard({ label, value, unit, highlight }: { label: string; value: number | null; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-primary/10' : 'bg-gray-900'}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-primary' : 'text-white'}`}>
        {value != null ? value : '—'}<span className="text-sm font-normal text-gray-400"> {unit}</span>
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

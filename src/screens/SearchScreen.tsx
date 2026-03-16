import { useNavigate } from 'react-router-dom'
import { useSearch } from '@/hooks/useSearch'
import { useFavorites } from '@/hooks/useFavorites'
import type { ScanResult } from '@/types/shared'

export default function SearchScreen() {
  const navigate = useNavigate()
  const search = useSearch()
  const { add: addFav, remove: removeFav, isFavorite, favorites } = useFavorites()

  const toggleFav = (result: ScanResult) => {
    if (isFavorite(result.food_name)) {
      const fav = favorites.find(f => f.food_name.toLowerCase() === result.food_name.toLowerCase())
      if (fav) removeFav(fav.id)
    } else {
      addFav(result)
    }
  }

  // ─── Result detail view ────────────────────────────────────
  if (search.state === 'done' && search.result) {
    return (
      <ResultView
        result={search.result}
        isFav={isFavorite(search.result.food_name)}
        onToggleFav={() => toggleFav(search.result!)}
        onBack={search.clearResult}
        onLog={() => { search.clear(); navigate('/') }}
      />
    )
  }

  // ─── Search view ───────────────────────────────────────────
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
            <p className="text-sm text-gray-400">Finding nutrition info...</p>
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

        {/* Empty state with favorites quick access */}
        {search.state === 'idle' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 pt-8 text-center">
              <div className="text-4xl">🔍</div>
              <p className="text-sm text-gray-400">Type any food to get nutrition info</p>
              <p className="text-xs text-gray-600">Powered by FatSecret</p>

              {/* Quick examples */}
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {['cheesecake', 'banana', 'tacos al pastor', 'arroz con leche'].map(example => (
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

// ─── Result View ─────────────────────────────────────────────

function ResultView({ result: r, isFav, onToggleFav, onBack, onLog }: {
  result: ScanResult
  isFav: boolean
  onToggleFav: () => void
  onBack: () => void
  onLog: () => void
}) {
  const tlColor = r.traffic_light

  return (
    <div className="flex flex-1 flex-col bg-gray-950">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">{r.food_name}</h1>
        <button
          onClick={onToggleFav}
          className="ml-auto p-1"
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
        {/* Traffic light */}
        <div className={`rounded-xl p-4 ${
          tlColor === 'green' ? 'bg-green-900/20' :
          tlColor === 'yellow' ? 'bg-yellow-900/20' : 'bg-red-900/20'
        }`}>
          <p className={`text-lg font-bold ${
            tlColor === 'green' ? 'text-green-400' :
            tlColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {tlColor === 'green' ? 'Low Impact' :
             tlColor === 'yellow' ? 'Medium Impact' : 'High Impact'}
          </p>
          {r.glycemic_index != null && (
            <p className="mt-1 text-sm text-gray-400">
              GI: {r.glycemic_index} · GL: {r.glycemic_load ?? '—'}
            </p>
          )}
        </div>

        {/* Macros */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={r.calories_kcal} unit="kcal" />
          <MacroCard label="Protein" value={r.protein_g} unit="g" />
          <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
          <MacroCard label="Fat" value={r.fat_g} unit="g" />
        </div>

        <p className="text-sm text-gray-500">
          {r.serving_size_g}g per serving
        </p>

        {/* Source badge */}
        <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2">
          <span className="text-base">{r.match_method === 'fatsecret' ? '📊' : '🤖'}</span>
          <div>
            <p className="text-xs font-medium text-gray-300">
              {r.match_method === 'fatsecret' ? 'FatSecret Database' :
               r.match_method === 'not_found' ? 'Not Found' : 'AI-Estimated'}
            </p>
            <p className="text-xs text-gray-500">
              {r.match_method === 'fatsecret'
                ? 'Nutrition from FatSecret. GI estimated by AI.'
                : r.match_method === 'not_found'
                ? 'This food was not found in FatSecret.'
                : 'Values estimated by AI. May vary from actual values.'}
            </p>
          </div>
        </div>

        {r.swap_suggestion && (
          <div className="rounded-lg bg-blue-900/20 px-3 py-2">
            <p className="text-sm text-blue-300">💡 {r.swap_suggestion}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-gray-800 p-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
        >
          Search Again
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

function MacroCard({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-lg bg-gray-900 p-3">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold text-white">
        {value != null ? value : '—'}<span className="text-sm font-normal text-gray-400"> {unit}</span>
      </p>
    </div>
  )
}

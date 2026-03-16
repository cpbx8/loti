import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavorites } from '@/hooks/useFavorites'
import type { Favorite } from '@/hooks/useFavorites'
import type { ScanResult } from '@/types/shared'

export default function FavoritesScreen() {
  const navigate = useNavigate()
  const { favorites, remove, touch } = useFavorites()
  const [selected, setSelected] = useState<Favorite | null>(null)

  const handleSelect = (fav: Favorite) => {
    touch(fav.id)
    setSelected(fav)
  }

  const handleLog = () => {
    // TODO: log via edge function when auth exists
    setSelected(null)
    navigate('/')
  }

  // ─── Detail view ───────────────────────────────────────────
  if (selected) {
    const r = selected.cached_result
    return <ResultView result={r} onBack={() => setSelected(null)} onLog={handleLog} />
  }

  // ─── List view ─────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-gray-950">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">Favorites</h1>
        <span className="ml-auto text-sm text-gray-500">{favorites.length}</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
            <div className="text-4xl">⭐</div>
            <p className="text-sm text-gray-400">No favorites yet</p>
            <p className="text-xs text-gray-600">
              Search for a food, then tap the star to save it here for quick access
            </p>
            <button
              onClick={() => navigate('/search')}
              className="mt-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/30"
            >
              Search Foods
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {favorites.map(fav => (
              <FavoriteRow
                key={fav.id}
                favorite={fav}
                onSelect={() => handleSelect(fav)}
                onRemove={() => remove(fav.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Favorite Row ────────────────────────────────────────────

function FavoriteRow({ favorite: fav, onSelect, onRemove }: {
  favorite: Favorite
  onSelect: () => void
  onRemove: () => void
}) {
  const r = fav.cached_result
  const tlColor = r.traffic_light

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button onClick={onSelect} className="flex flex-1 items-center gap-3 text-left min-w-0">
        <div className={`h-3 w-3 flex-shrink-0 rounded-full ${
          tlColor === 'green' ? 'bg-gl-green' :
          tlColor === 'yellow' ? 'bg-gl-yellow' : 'bg-gl-red'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-white">{fav.food_name}</p>
          <p className="text-sm text-gray-500">
            {r.calories_kcal ?? '—'} kcal
            {r.glycemic_index != null && ` · GI ${r.glycemic_index}`}
          </p>
        </div>
      </button>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-gray-500 hover:text-red-400"
        aria-label="Remove favorite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    </div>
  )
}

// ─── Result View (reused pattern) ────────────────────────────

function ResultView({ result: r, onBack, onLog }: { result: ScanResult; onBack: () => void; onLog: () => void }) {
  const tlColor = r.traffic_light

  return (
    <div className="flex flex-1 flex-col bg-gray-950">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">{r.food_name}</h1>
        <span className="ml-auto rounded bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-400">★ Fav</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
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

        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={r.calories_kcal} unit="kcal" />
          <MacroCard label="Protein" value={r.protein_g} unit="g" />
          <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
          <MacroCard label="Fat" value={r.fat_g} unit="g" />
        </div>

        <p className="text-sm text-gray-500">
          {r.serving_size_g}g per serving
        </p>

        {r.swap_suggestion && (
          <div className="rounded-lg bg-blue-900/20 px-3 py-2">
            <p className="text-sm text-blue-300">{r.swap_suggestion}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-gray-800 p-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
        >
          Back
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

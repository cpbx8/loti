import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavorites } from '@/hooks/useFavorites'
import type { Favorite } from '@/hooks/useFavorites'
import type { ScanResult } from '@/types/shared'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'

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
        <h1 className="ml-3 text-lg font-bold text-text-primary">Favorites</h1>
        <span className="ml-auto text-sm text-text-tertiary">{favorites.length}</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <p className="text-sm text-text-secondary">No favorites yet</p>
            <p className="text-xs text-text-tertiary">
              Search for a food, then tap the star to save it here for quick access
            </p>
            <button
              onClick={() => navigate('/search')}
              className="mt-2 rounded-xl bg-primary-light px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 min-h-[44px]"
            >
              Search Foods
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
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
  const thresholds = useThresholds()
  const tlColor = r.glycemic_load != null
    ? getPersonalizedTrafficLight(r.glycemic_load, thresholds)
    : r.traffic_light

  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-card">
      <button onClick={onSelect} className="flex flex-1 items-center gap-3 text-left min-w-0 min-h-[44px]">
        <div className={`h-3 w-3 flex-shrink-0 rounded-full ${
          tlColor === 'green' ? 'bg-tl-green-fill' :
          tlColor === 'yellow' ? 'bg-tl-yellow-fill' : 'bg-tl-red-fill'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-text-primary">{fav.food_name}</p>
          <p className="text-sm text-text-tertiary">
            {r.calories_kcal ?? '--'} kcal
            {r.glycemic_index != null && ` · GI ${r.glycemic_index}`}
          </p>
        </div>
      </button>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-text-tertiary hover:text-error min-h-[44px] min-w-[44px] flex items-center justify-center"
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
  const thresholds = useThresholds()
  const tlColor = r.glycemic_load != null
    ? getPersonalizedTrafficLight(r.glycemic_load, thresholds)
    : r.traffic_light

  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button onClick={onBack} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-text-primary">{r.food_name}</h1>
        <span className="ml-auto rounded-lg bg-primary-light px-2 py-0.5 text-xs text-primary font-medium">Fav</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className={`rounded-xl p-4 ${
          tlColor === 'green' ? 'bg-tl-green-bg' :
          tlColor === 'yellow' ? 'bg-tl-yellow-bg' : 'bg-tl-red-bg'
        }`}>
          <p className={`text-lg font-bold ${
            tlColor === 'green' ? 'text-tl-green-fill' :
            tlColor === 'yellow' ? 'text-tl-yellow-fill' : 'text-tl-red-fill'
          }`}>
            {tlColor === 'green' ? 'Low Impact' :
             tlColor === 'yellow' ? 'Medium Impact' : 'High Impact'}
          </p>
          {r.glycemic_index != null && (
            <p className="mt-1 text-sm text-text-secondary">
              GI: {r.glycemic_index} · GL: {r.glycemic_load ?? '--'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={r.calories_kcal} unit="kcal" />
          <MacroCard label="Protein" value={r.protein_g} unit="g" />
          <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
          <MacroCard label="Fat" value={r.fat_g} unit="g" />
        </div>

        <p className="text-sm text-text-tertiary">
          {r.serving_size_g}g per serving
        </p>

        {r.swap_suggestion && (
          <div className="rounded-xl bg-info/10 px-3 py-2">
            <p className="text-sm text-info">{r.swap_suggestion}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-border bg-card p-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface min-h-[44px]"
        >
          Back
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

function MacroCard({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-xl font-bold text-text-primary">
        {value != null ? value : '--'}<span className="text-sm font-normal text-text-tertiary"> {unit}</span>
      </p>
    </div>
  )
}

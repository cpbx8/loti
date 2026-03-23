import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavorites } from '@/hooks/useFavorites'
import type { Favorite } from '@/hooks/useFavorites'
import type { ScanResult } from '@/types/shared'
import { useDailyLog } from '@/hooks/useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import { useLanguage } from '@/lib/i18n'

export default function FavoritesScreen() {
  const navigate = useNavigate()
  const { favorites, remove, touch } = useFavorites()
  const { addEntry } = useDailyLog()
  const { t } = useLanguage()
  const [selected, setSelected] = useState<Favorite | null>(null)

  const handleSelect = (fav: Favorite) => {
    touch(fav.id)
    setSelected(fav)
  }

  const handleLog = () => {
    if (!selected) return
    const r = selected.cached_result
    addEntry({
      food_name: r.food_name,
      calories_kcal: r.calories_kcal ?? 0,
      protein_g: r.protein_g ?? 0,
      carbs_g: r.carbs_g ?? 0,
      fat_g: r.fat_g ?? 0,
      fiber_g: r.fiber_g ?? null,
      glycemic_load: r.glycemic_load ?? null,
      serving_size_g: r.serving_size_g,
      input_method: 'favorite',
    })
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
      <header className="glass flex items-center px-5 py-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">{t('favorites.title')}</h1>
        <span className="ml-auto text-body text-on-surface-variant">{favorites.length}</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-body font-medium text-on-surface">{t('favorites.empty')}</p>
            <p className="text-body text-on-surface-variant">
              {t('favorites.emptyDesc')}
            </p>
            <button
              onClick={() => navigate('/text')}
              className="mt-2 btn-gradient min-h-[48px] px-6"
            >
              {t('favorites.searchFoods')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
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
    <div className="flex items-center gap-3 surface-card px-4 py-3">
      <button onClick={onSelect} className="flex flex-1 items-center gap-3 text-left min-w-0 min-h-[44px]">
        <div className={`h-3 w-3 flex-shrink-0 rounded-full ${
          tlColor === 'green' ? 'bg-tl-green-fill' :
          tlColor === 'yellow' ? 'bg-tl-yellow-fill' : 'bg-tl-red-fill'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="truncate text-body font-medium text-on-surface">{fav.food_name}</p>
          <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
            {r.calories_kcal ?? '--'} kcal
            {r.glycemic_load != null && ` · CG ${r.glycemic_load}`}
          </p>
        </div>
      </button>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-on-surface-variant hover:text-error min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Quitar de favoritos"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  )
}

// ─── Result View ─────────────────────────────────────────────

function ResultView({ result: r, onBack, onLog }: { result: ScanResult; onBack: () => void; onLog: () => void }) {
  const thresholds = useThresholds()
  const tlColor = r.glycemic_load != null
    ? getPersonalizedTrafficLight(r.glycemic_load, thresholds)
    : r.traffic_light

  const impactLabel = tlColor === 'green' ? 'Bajo Impacto' : tlColor === 'yellow' ? 'Moderado' : 'Alto Impacto'

  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="glass flex items-center px-5 py-3 sticky top-0 z-10">
        <button onClick={onBack} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">{r.food_name}</h1>
        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-label text-primary">Favorito</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Impact badge */}
        <div className={`rounded-2xl p-5 ${
          tlColor === 'green' ? 'bg-tl-green-bg' :
          tlColor === 'yellow' ? 'bg-tl-yellow-bg' : 'bg-tl-red-bg'
        }`}>
          <p className={`text-title font-semibold ${
            tlColor === 'green' ? 'text-tl-green-fill' :
            tlColor === 'yellow' ? 'text-tl-yellow-fill' : 'text-tl-red-fill'
          }`}>
            {impactLabel}
          </p>
          {r.glycemic_load != null && (
            <p className="mt-1 text-body text-on-surface-variant">
              CG: {r.glycemic_load}{r.glycemic_index != null && ` · IG: ${r.glycemic_index}`}
            </p>
          )}
        </div>

        {/* Macros */}
        <div className="grid grid-cols-2 gap-3">
          <div className="surface-card p-4">
            <p className="text-label text-on-surface-variant">Calorías</p>
            <p className="text-headline text-on-surface mt-1">
              {r.calories_kcal ?? '--'}<span className="text-body text-on-surface-variant ml-1">kcal</span>
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-label text-on-surface-variant">Carbohidratos</p>
            <p className="text-headline text-on-surface mt-1">
              {r.carbs_g != null ? Math.round(r.carbs_g) : '--'}<span className="text-body text-on-surface-variant ml-1">g</span>
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-label text-on-surface-variant">Fibra</p>
            <p className="text-headline text-on-surface mt-1">
              {r.fiber_g != null ? Math.round(r.fiber_g * 10) / 10 : '--'}<span className="text-body text-on-surface-variant ml-1">g</span>
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-label text-on-surface-variant">Proteína</p>
            <p className="text-headline text-on-surface mt-1">
              {r.protein_g != null ? Math.round(r.protein_g) : '--'}<span className="text-body text-on-surface-variant ml-1">g</span>
            </p>
          </div>
        </div>

        <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
          {r.serving_size_g}g por porción
        </p>

        {r.swap_suggestion && (
          <div className="surface-section p-5" style={{ background: 'rgba(0,107,50,0.06)' }}>
            <div className="flex items-start gap-3">
              <span className="text-sm mt-0.5">🔄</span>
              <div>
                <p className="text-body font-semibold text-on-surface">Consejo de Intercambio</p>
                <p className="text-body text-on-surface-variant mt-1">{r.swap_suggestion}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 glass p-4 sticky bottom-0">
        <button
          onClick={onBack}
          className="flex-1 ghost-border rounded-full px-4 py-3 text-body font-medium text-on-surface-variant min-h-[48px]"
        >
          Volver
        </button>
        <button
          onClick={onLog}
          className="flex-1 btn-gradient min-h-[48px]"
        >
          Registrar en diario
        </button>
      </div>
    </div>
  )
}

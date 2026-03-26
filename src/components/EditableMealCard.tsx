/**
 * EditableMealCard — Editable ingredient list for composite meals.
 * Users can adjust portions, remove ingredients, and add new ones.
 * Shows live-updating meal totals (calories, carbs, GL).
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { FoodSearchResult } from '@/types/shared'
import TrafficLightBadge from './TrafficLightBadge'
import { FoodResultCard } from './FoodResultCard'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import { useLanguage } from '@/lib/i18n'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { scaleToGrams, computeTotals } from '@/lib/mealUtils'

// ─── Add Ingredient Inline Search ─────────────────────────────

function AddIngredientRow({ onAdd }: { onAdd: (result: FoodSearchResult) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const search = useWaterfallSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const handleSubmit = () => {
    if (search.state === 'loading') return
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    search.searchText(trimmed)
  }

  const handleSelect = (result: FoodSearchResult) => {
    onAdd(result)
    setQuery('')
    setOpen(false)
    search.reset()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-3 text-body text-primary hover:bg-surface-container-high rounded-2xl transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {t('meal.addIngredient')}
      </button>
    )
  }

  return (
    <div className="surface-card rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={t('meal.searchPlaceholder')}
          className="flex-1 rounded-xl bg-surface-container px-3 py-2 text-body text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleSubmit}
          disabled={search.state === 'loading'}
          className="rounded-xl bg-primary px-3 py-2 text-body font-medium text-on-primary disabled:opacity-50"
        >
          {search.state === 'loading' ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
          ) : t('meal.search')}
        </button>
        <button
          onClick={() => { setOpen(false); setQuery(''); search.reset() }}
          className="rounded-xl px-2 py-2 text-on-surface-variant hover:text-on-surface"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {search.state === 'done' && search.results.length > 0 && (
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {search.results.slice(0, 5).map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-container-high text-left transition-colors"
            >
              <div className="min-w-0">
                <p className="text-body text-on-surface truncate">{r.name_es || r.name_en}</p>
                <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">{r.serving_size}g · {Math.round(r.calories)} kcal</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {search.state === 'done' && search.results.length === 0 && (
        <p className="text-label text-on-surface-variant px-3 py-2 font-normal normal-case tracking-normal">{t('meal.noResults')}</p>
      )}

      {search.state === 'error' && (
        <p className="text-label text-error px-3 py-2 font-normal normal-case tracking-normal">{t('meal.searchError')}</p>
      )}
    </div>
  )
}

// ─── Editable Ingredient Row ──────────────────────────────────

interface IngredientRowProps {
  item: FoodSearchResult
  onUpdateGrams: (grams: number) => void
  onReplace: (newItem: FoodSearchResult) => void
  onRemove: () => void
}

function IngredientRow({ item, onUpdateGrams, onReplace, onRemove }: IngredientRowProps) {
  const thresholds = useThresholds()
  const { t } = useLanguage()
  const search = useWaterfallSearch()
  const [editing, setEditing] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [gramsInput, setGramsInput] = useState(String(Math.round(item.serving_size)))
  const inputRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const tl = item.glycemic_load != null
    ? getPersonalizedTrafficLight(item.glycemic_load, thresholds)
    : item.traffic_light

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    if (editingName && nameRef.current) {
      nameRef.current.focus()
      nameRef.current.select()
    }
  }, [editingName])

  // When name search completes, replace the ingredient with the top result
  useEffect(() => {
    if (search.state === 'done' && search.results.length > 0) {
      onReplace(search.results[0])
      setEditingName(false)
      search.reset()
    } else if (search.state === 'done' && search.results.length === 0) {
      // No results — revert
      setEditingName(false)
      search.reset()
    }
  }, [search.state]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitName = () => {
    const trimmed = nameInput.trim()
    if (trimmed.length >= 2 && trimmed !== (item.name_es || item.name_en)) {
      search.searchText(trimmed)
    } else {
      setEditingName(false)
    }
  }

  const commitGrams = () => {
    const val = parseInt(gramsInput, 10)
    if (!isNaN(val) && val > 0 && val !== Math.round(item.serving_size)) {
      onUpdateGrams(val)
    }
    setGramsInput(String(Math.round(item.serving_size)))
    setEditing(false)
  }

  const displayName = item.name_es || item.name_en || ''

  return (
    <div className="flex items-center gap-3 surface-card px-4 py-3 rounded-2xl">
      {tl && <TrafficLightBadge rating={tl} size="sm" />}
      <div className="flex-1 min-w-0">
        {editingName ? (
          <div className="flex items-center gap-1">
            <input
              ref={nameRef}
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
              placeholder={displayName}
              className="flex-1 min-w-0 rounded-lg bg-surface-container px-2 py-0.5 text-body text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search.state === 'loading' && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent flex-shrink-0" />
            )}
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(displayName); setEditingName(true) }}
            className="text-body text-on-surface truncate block max-w-full text-left"
            title={t('meal.tapToEdit')}
          >
            {displayName}
          </button>
        )}
        {editing ? (
          <div className="flex items-center gap-1 mt-0.5">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={gramsInput}
              onChange={e => setGramsInput(e.target.value)}
              onBlur={commitGrams}
              onKeyDown={e => { if (e.key === 'Enter') commitGrams() }}
              className="w-16 rounded-lg bg-surface-container px-2 py-0.5 text-label text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-label text-on-surface-variant font-normal normal-case tracking-normal">g</span>
          </div>
        ) : (
          <button
            onClick={() => { setGramsInput(String(Math.round(item.serving_size))); setEditing(true) }}
            className="text-label text-primary font-normal normal-case tracking-normal underline underline-offset-2 decoration-primary/30 mt-0.5"
            aria-label={t('meal.editPortion')}
          >
            {Math.round(item.serving_size)}g
          </button>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-body font-medium text-on-surface">{Math.round(item.calories)} kcal</p>
        <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
          CG {item.glycemic_load != null ? Math.round(item.glycemic_load) : '--'}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-2.5 -m-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
        aria-label="Remove"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

interface EditableMealCardProps {
  total: FoodSearchResult
  initialComponents: FoodSearchResult[]
  onLog: (components: FoodSearchResult[]) => void
}

export default function EditableMealCard({ total, initialComponents, onLog }: EditableMealCardProps) {
  const [components, setComponents] = useState<FoodSearchResult[]>(initialComponents)
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true)
  const { t } = useLanguage()

  // Build a live-updating synthetic total from current components
  const totals = useMemo(() => computeTotals(components), [components])
  const liveTotal = useMemo<FoodSearchResult>(() => ({
    ...total,
    calories: totals.calories,
    protein_g: totals.protein_g,
    carbs_g: totals.carbs_g,
    fat_g: totals.fat_g,
    fiber_g: totals.fiber_g,
    glycemic_load: totals.glycemic_load,
    serving_size: components.reduce((s, c) => s + c.serving_size, 0),
  }), [total, totals, components])

  const handleUpdateGrams = useCallback((index: number, newGrams: number) => {
    setComponents(prev => prev.map((c, i) =>
      i === index ? scaleToGrams(c, newGrams) : c
    ))
  }, [])

  const handleReplace = useCallback((index: number, newItem: FoodSearchResult) => {
    setComponents(prev => prev.map((c, i) => i === index ? newItem : c))
  }, [])

  const handleRemove = useCallback((index: number) => {
    setComponents(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleAdd = useCallback((result: FoodSearchResult) => {
    setComponents(prev => [...prev, result])
  }, [])

  return (
    <div className="flex flex-col gap-5">
      {/* ── Full result card with GL hero, glucose curve, macros ── */}
      <FoodResultCard result={liveTotal} showSource={false} compact />

      {/* ── Editable ingredients ── */}
      <div>
        <button
          onClick={() => setIngredientsExpanded(prev => !prev)}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="text-label text-on-surface-variant">{t('meal.ingredients')}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-on-surface-variant transition-transform ${ingredientsExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {ingredientsExpanded && (
          <div className="flex flex-col gap-2">
            {components.length === 0 && (
              <div className="surface-card rounded-2xl p-6 text-center">
                <p className="text-body font-medium text-on-surface">{t('meal.emptyTitle')}</p>
                <p className="text-label text-on-surface-variant mt-1 font-normal normal-case tracking-normal">{t('meal.emptyDesc')}</p>
              </div>
            )}
            {components.map((c, i) => (
              <IngredientRow
                key={`${c.name_es || c.name_en}-${i}`}
                item={c}
                onUpdateGrams={(grams) => handleUpdateGrams(i, grams)}
                onReplace={(newItem) => handleReplace(i, newItem)}
                onRemove={() => handleRemove(i)}
              />
            ))}
            <AddIngredientRow onAdd={handleAdd} />
          </div>
        )}
      </div>

      {/* ── Log button ── */}
      {components.length > 0 && (
        <button
          onClick={() => onLog(components)}
          className="btn-gradient w-full min-h-[48px] mt-2"
        >
          {t('meal.logMeal')} ({components.length})
        </button>
      )}

      {/* ── Disclaimer (at very bottom) ── */}
      <p className="text-label text-text-tertiary font-normal normal-case tracking-normal text-center leading-relaxed">
        {t('result.disclaimer')}
      </p>
    </div>
  )
}

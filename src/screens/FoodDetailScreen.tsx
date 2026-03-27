/**
 * FoodDetailScreen — view/edit a logged food entry.
 * Portions (stepper + grams), macros, glucose curve, delete.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFoodDetail } from '@/hooks/useFoodDetail'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import TrafficLightBadge from '@/components/TrafficLightBadge'
import GlucoseSpikeCurve from '@/components/GlucoseSpikeCurve'
import { useLanguage } from '@/lib/i18n'

export default function FoodDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { entry, loading, updateEntry, deleteEntry } = useFoodDetail(id!)
  const thresholds = useThresholds()
  const { t } = useLanguage()

  // Track original values for ratio scaling
  const [origGrams, setOrigGrams] = useState<number | null>(null)
  const [origServings, setOrigServings] = useState<number>(1)

  // Editable state
  const [servings, setServings] = useState<number>(1)
  const [grams, setGrams] = useState<number>(0)
  const [editingGrams, setEditingGrams] = useState(false)
  const [gramsInput, setGramsInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const gramsRef = useRef<HTMLInputElement>(null)

  // Initialize from entry
  useEffect(() => {
    if (entry && origGrams === null) {
      const g = entry.serving_size_g ?? 100
      const s = entry.serving_count ?? 1
      setOrigGrams(g)
      setOrigServings(s)
      setGrams(g)
      setServings(s)
    }
  }, [entry, origGrams])

  useEffect(() => {
    if (editingGrams && gramsRef.current) {
      gramsRef.current.focus()
      gramsRef.current.select()
    }
  }, [editingGrams])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-surface gap-4">
        <p className="text-body text-on-surface-variant">Food entry not found</p>
        <button onClick={() => navigate('/')} className="text-primary text-body font-medium">Go back</button>
      </div>
    )
  }

  const og = origGrams ?? entry.serving_size_g ?? 100
  const safeOg = og > 0 ? og : 100 // guard against division by zero
  const gramsPerServing = safeOg / origServings
  const ratio = grams / safeOg
  const hasChanges = Math.abs(grams - og) > 0.5

  // Scaled macros
  const scaled = {
    calories: entry.calories_kcal != null ? Math.round(entry.calories_kcal * ratio) : null,
    carbs: entry.carbs_g != null ? Math.round(entry.carbs_g * ratio * 10) / 10 : null,
    protein: entry.protein_g != null ? Math.round(entry.protein_g * ratio * 10) / 10 : null,
    fat: entry.fat_g != null ? Math.round(entry.fat_g * ratio * 10) / 10 : null,
    fiber: (entry as any).fiber_g != null ? Math.round((entry as any).fiber_g * ratio * 10) / 10 : null,
    gl: entry.glycemic_load != null ? Math.round(entry.glycemic_load * ratio * 10) / 10 : null,
  }

  const tl = scaled.gl != null ? getPersonalizedTrafficLight(scaled.gl, thresholds) : entry.result_traffic_light

  const handleStepperChange = (delta: number) => {
    const newServings = Math.max(0.5, servings + delta)
    setServings(newServings)
    setGrams(Math.round(gramsPerServing * newServings))
  }

  const commitGrams = () => {
    const val = parseInt(gramsInput, 10)
    if (!isNaN(val) && val > 0) {
      setGrams(val)
      setServings(Math.round(val / gramsPerServing * 10) / 10)
    }
    setEditingGrams(false)
  }

  const handleSave = () => {
    updateEntry({ serving_size_g: grams, quantity: servings })
    navigate(-1)
  }

  const handleDelete = async () => {
    await deleteEntry()
    navigate('/')
  }

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* Header */}
      <header className="glass z-10 flex items-center justify-between px-5 py-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-on-surface-variant hover:text-error min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          aria-label="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 px-5">
        {/* Food name + badge */}
        <div className="flex items-center gap-3 mt-4 mb-6">
          {tl && <TrafficLightBadge rating={tl} size="md" />}
          <h1 className="text-title text-on-surface">{entry.food_name || '—'}</h1>
        </div>

        {/* Portion section */}
        <div className="mb-6">
          <p className="text-label text-on-surface-variant mb-3">{t('foodDetail.portion')}</p>
          <div className="surface-card rounded-2xl p-4">
            {/* Stepper */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => handleStepperChange(-0.5)}
                disabled={servings <= 0.5}
                className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface disabled:opacity-30 min-h-[44px] min-w-[44px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <div className="text-center">
                <p className="text-headline text-on-surface">{servings % 1 === 0 ? servings : servings.toFixed(1)}</p>
                <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
                  {servings === 1 ? t('foodDetail.serving') : t('foodDetail.servings')}
                </p>
              </div>
              <button
                onClick={() => handleStepperChange(0.5)}
                className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface min-h-[44px] min-w-[44px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Grams */}
            <div className="text-center mt-3">
              {editingGrams ? (
                <div className="inline-flex items-center gap-1">
                  <input
                    ref={gramsRef}
                    type="number"
                    inputMode="numeric"
                    value={gramsInput}
                    onChange={e => setGramsInput(e.target.value)}
                    onBlur={commitGrams}
                    onKeyDown={e => { if (e.key === 'Enter') commitGrams() }}
                    className="w-20 rounded-lg bg-surface-container px-2 py-1 text-center text-body text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-body text-on-surface-variant">g</span>
                </div>
              ) : (
                <button
                  onClick={() => { setGramsInput(String(grams)); setEditingGrams(true) }}
                  className="text-body text-primary underline underline-offset-2 decoration-primary/30"
                >
                  {grams}g
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nutrition section */}
        <div className="mb-6">
          <p className="text-label text-on-surface-variant mb-3">{t('foodDetail.nutrition')}</p>
          <div className="surface-card rounded-2xl divide-y divide-border">
            {[
              { label: t('foodDetail.calories'), value: scaled.calories != null ? `${scaled.calories} kcal` : '—' },
              { label: t('foodDetail.carbs'), value: scaled.carbs != null ? `${scaled.carbs}g` : '—' },
              { label: t('foodDetail.protein'), value: scaled.protein != null ? `${scaled.protein}g` : '—' },
              { label: t('foodDetail.fat'), value: scaled.fat != null ? `${scaled.fat}g` : '—' },
              { label: t('foodDetail.fiber'), value: scaled.fiber != null ? `${scaled.fiber}g` : '—' },
              { label: t('foodDetail.gl'), value: scaled.gl != null ? `${scaled.gl}` : '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-body text-on-surface-variant">{row.label}</span>
                <span className="text-body font-medium text-on-surface">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Glucose curve */}
        {scaled.gl != null && tl && entry.glycemic_index != null && (
          <div className="mb-6">
            <p className="text-label text-on-surface-variant mb-3">{t('foodDetail.glucoseImpact')}</p>
            <GlucoseSpikeCurve
              gi={entry.glycemic_index}
              gl={scaled.gl}
              trafficLight={tl}
            />
          </div>
        )}

        {/* Save button */}
        {hasChanges && (
          <button onClick={handleSave} className="btn-gradient w-full min-h-[48px] mt-2">
            {t('foodDetail.save')}
          </button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-6">
          <div className="surface-card rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-title text-on-surface mb-2">{t('foodDetail.deleteTitle')}</h2>
            <p className="text-body text-on-surface-variant mb-6">{t('foodDetail.deleteMessage')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 ghost-border rounded-full px-4 py-3 text-body font-medium text-on-surface-variant min-h-[48px]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-full bg-error px-4 py-3 text-body font-medium text-white min-h-[48px]"
              >
                {t('foodDetail.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

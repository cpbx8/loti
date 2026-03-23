/**
 * FoodResultCard — editorial wellness food analysis display.
 * Matches the Rork "Análisis de Alimento" screen design.
 */
import { useState, useCallback } from 'react'
import type { FoodSearchResult } from '@/types/shared'
import TrafficLightBadge from './TrafficLightBadge'
import GlucoseSpikeCurve from './GlucoseSpikeCurve'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import FatSecretAttribution from './FatSecretAttribution'
import { estimateSwapGL } from '@/lib/glucoseModel'
import { useFavorites } from '@/hooks/useFavorites'
import { useLanguage } from '@/lib/i18n'

// ─── Impact labels ───────────────────────────────────────────

const IMPACT_CONFIG: Record<string, { labelEs: string; bg: string; text: string; dot: string; descFn: (name: string, gl: number | null) => string }> = {
  green: {
    labelEs: 'BAJO IMPACTO',
    bg: 'bg-tl-green-bg',
    text: 'text-tl-green-fill',
    dot: 'bg-tl-green-fill',
    descFn: (_name, _gl) => `Impacto bajo en tu glucosa.`,
  },
  yellow: {
    labelEs: 'MODERADO',
    bg: 'bg-tl-yellow-bg',
    text: 'text-tl-yellow-fill',
    dot: 'bg-tl-yellow-fill',
    descFn: (_name, _gl) => `Impacto moderado en tu glucosa.`,
  },
  red: {
    labelEs: 'ALTO IMPACTO',
    bg: 'bg-tl-red-bg',
    text: 'text-tl-red-fill',
    dot: 'bg-tl-red-fill',
    descFn: (_name, _gl) => `Impacto alto en tu glucosa. Modera la porción.`,
  },
}

// ─── Source Badge ─────────────────────────────────────────────

const SOURCE_INFO: Record<string, { label: string }> = {
  cache:         { label: 'Cache' },
  seed:          { label: 'Verificado' },
  fatsecret:     { label: 'FatSecret' },
  openfoodfacts: { label: 'Open Food Facts' },
  gpt4o:         { label: 'Estimación IA' },
  user:          { label: 'Comunidad' },
}

// ─── Single Result Card ───────────────────────────────────────

interface FoodResultCardProps {
  result: FoodSearchResult
  showSource?: boolean
  onQuantityChange?: (qty: number, scaled: FoodSearchResult) => void
}

export function FoodResultCard({ result: r, showSource = true, onQuantityChange }: FoodResultCardProps) {
  const [quantity, setQuantity] = useState(1)
  const displayName = r.name_es || r.name_en || ''
  const thresholds = useThresholds()
  const { add: addFavorite, isFavorite, remove: removeFavorite, favorites } = useFavorites()
  const { t } = useLanguage()
  const foodName = r.name_en || r.name_es || ''
  const isFav = isFavorite(foodName)

  // Scale values by quantity
  const q = quantity
  const cal = r.calories * q
  const protein = r.protein_g * q
  const carbs = r.carbs_g * q
  const fiber = r.fiber_g != null ? r.fiber_g * q : null
  const gl = r.glycemic_load != null ? r.glycemic_load * q : null

  // Traffic light
  const tl = gl != null ? getPersonalizedTrafficLight(gl, thresholds) : r.traffic_light
  const hasTL = tl != null
  const impactLabel = tl === 'green' ? t('result.lowImpact') : tl === 'yellow' ? t('result.moderate') : t('result.highImpact')
  const impactDesc = tl === 'green' ? t('result.lowDesc') : tl === 'yellow' ? t('result.moderateDesc') : t('result.highDesc')
  const impact = hasTL ? IMPACT_CONFIG[tl!] : null

  // Swap GL for comparison curve
  const swapGL = (tl === 'yellow' || tl === 'red') && gl ? estimateSwapGL(gl) : null

  const adjustQty = useCallback((delta: number) => {
    const next = Math.max(0.5, Math.round((quantity + delta) * 2) / 2)
    setQuantity(next)
    onQuantityChange?.(next, {
      ...r,
      calories: r.calories * next,
      protein_g: r.protein_g * next,
      carbs_g: r.carbs_g * next,
      fat_g: r.fat_g * next,
      fiber_g: r.fiber_g != null ? r.fiber_g * next : undefined,
      glycemic_load: r.glycemic_load != null ? r.glycemic_load * next : undefined,
      serving_size: r.serving_size * next,
    })
  }, [quantity, r, onQuantityChange])

  return (
    <div className="flex flex-col gap-5">
      {/* ── Result header + impact badge ────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-label text-on-surface-variant">Resultado de escaneo</p>
          {impact && (
            <div className={`inline-flex items-center gap-1.5 rounded-full ${impact.bg} px-3 py-1`}>
              <div className={`h-2 w-2 rounded-full ${impact.dot}`} />
              <span className={`text-label ${impact.text}`}>{impactLabel}</span>
            </div>
          )}
        </div>
        <h2 className="text-headline text-on-surface mt-2">{displayName}</h2>
        {r.name_en && r.name_es && r.name_en !== r.name_es && (
          <p className="text-body text-on-surface-variant mt-0.5">{r.name_en}</p>
        )}
      </div>

      {/* ── GL hero card ───────────────────────────── */}
      {hasTL && gl != null && (
        <div className="surface-section p-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-display text-on-surface">{Math.round(gl)}</span>
            <span className="text-label text-on-surface-variant font-normal normal-case tracking-normal">CG</span>
          </div>
          <p className="text-body text-on-surface-variant mt-1">
            {impactDesc}
          </p>
        </div>
      )}

      {/* ── Quantity adjuster ──────────────────────── */}
      <div className="flex items-center justify-between surface-card p-4">
        <span className="text-body font-medium text-on-surface-variant">{t('result.portion')}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustQty(-0.5)}
            disabled={quantity <= 0.5}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface disabled:opacity-30 min-h-[32px] min-w-[32px]"
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center text-title text-on-surface">
            {quantity % 1 === 0 ? quantity : quantity.toFixed(1)}
          </span>
          <button
            onClick={() => adjustQty(0.5)}
            className="btn-gradient flex h-8 w-8 items-center justify-center !p-0 !rounded-full min-h-[32px] min-w-[32px] text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Glucose response curve ──────────────────── */}
      {hasTL && gl != null && gl > 0 && (
        <GlucoseSpikeCurve
          gi={r.glycemic_index ?? (tl === 'red' ? 75 : tl === 'yellow' ? 60 : 40)}
          gl={gl}
          trafficLight={tl!}
          swapGL={swapGL}
        />
      )}

      {/* ── Macros 2×2 grid ────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="surface-card p-4">
          <p className="text-label text-on-surface-variant">{t('result.calories')}</p>
          <p className="text-headline text-on-surface mt-1">
            {Math.round(cal)}
            <span className="text-body text-on-surface-variant ml-1">kcal</span>
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-label text-on-surface-variant">{t('result.carbs')}</p>
          <p className="text-headline text-on-surface mt-1">
            {Math.round(carbs)}
            <span className="text-body text-on-surface-variant ml-1">g</span>
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-label text-on-surface-variant">{t('result.fiber')}</p>
          <p className="text-headline text-on-surface mt-1">
            {fiber != null ? (Math.round(fiber * 10) / 10) : '--'}
            <span className="text-body text-on-surface-variant ml-1">g</span>
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-label text-on-surface-variant">{t('result.protein')}</p>
          <p className="text-headline text-on-surface mt-1">
            {Math.round(protein)}
            <span className="text-body text-on-surface-variant ml-1">g</span>
          </p>
        </div>
      </div>

      {/* ── Swap tip card ──────────────────────────── */}
      {r.swap_suggestion && (
        <div className="surface-section p-5" style={{ background: 'rgba(0,107,50,0.06)' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary/15 mt-0.5 flex-shrink-0">
              <span className="text-sm">🔄</span>
            </div>
            <div>
              <p className="text-body font-semibold text-on-surface">{t('result.swapTip')}</p>
              <p className="text-body text-on-surface-variant mt-1 leading-snug">
                {r.swap_suggestion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Pro tip (when no swap) ─────────────────── */}
      {!r.swap_suggestion && hasTL && (
        <div className="surface-section p-5" style={{ background: 'rgba(0,107,50,0.06)' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary/15 mt-0.5 flex-shrink-0">
              <span className="text-sm">💡</span>
            </div>
            <div>
              <p className="text-body font-semibold text-on-surface">{t('result.proTip')}</p>
              <p className="text-body text-on-surface-variant mt-1 leading-snug">
                {tl === 'green'
                  ? t('result.proTipGreen')
                  : tl === 'yellow'
                    ? t('result.proTipYellow')
                    : t('result.proTipRed')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Source ─────────────────────────────────── */}
      {showSource && (
        <div className="flex items-center gap-2">
          {r.source === 'fatsecret' ? (
            <FatSecretAttribution />
          ) : (
            <span className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
              {SOURCE_INFO[r.source]?.label ?? r.source}
              {r.confidence < 1 && ` · ${Math.round(r.confidence * 100)}%`}
            </span>
          )}
        </div>
      )}

      {/* ── Favorite button ─────────────────────────── */}
      <button
        onClick={() => {
          if (isFav) {
            const fav = favorites.find(f => f.food_name.toLowerCase() === foodName.toLowerCase())
            if (fav) removeFavorite(fav.id)
          } else {
            addFavorite({
              food_name: foodName,
              category: '',
              calories_kcal: r.calories,
              protein_g: r.protein_g,
              carbs_g: r.carbs_g,
              fat_g: r.fat_g,
              fiber_g: r.fiber_g ?? null,
              serving_size_g: r.serving_size,
              serving_label: r.serving_description ?? null,
              glycemic_index: r.glycemic_index ?? null,
              glycemic_load: r.glycemic_load ?? null,
              traffic_light: r.traffic_light ?? 'green',
              confidence: r.confidence < 0.6 ? 'low' : r.confidence < 0.85 ? 'medium' : 'high',
              gi_source: r.gi_source ?? 'estimated',
              swap_suggestion: r.swap_suggestion ?? null,
              disclaimer: 'AI-estimated',
              input_method: 'text_input',
              quantity: quantity,
              per_unit_gl: r.glycemic_load ?? null,
              matched_food_id: r.id ?? null,
              match_method: r.source,
            })
          }
        }}
        className={`flex items-center justify-center gap-2 w-full rounded-full py-3 min-h-[48px] transition-colors ${
          isFav
            ? 'bg-primary/10 text-primary'
            : 'ghost-border text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isFav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-body font-medium">{isFav ? t('result.inFavorites') : t('result.saveFavorite')}</span>
      </button>

      {/* ── Disclaimer ─────────────────────────────── */}
      <p className="text-label text-text-tertiary font-normal normal-case tracking-normal text-center leading-relaxed">
        {t('result.disclaimer')}
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
  const thresholds = useThresholds()
  return (
    <div className="flex flex-col gap-2.5">
      {results.map((r, i) => {
        const displayName = r.name_es || r.name_en || ''
        const isSelected = selectedIndex === i
        const itemTL = r.glycemic_load != null
          ? getPersonalizedTrafficLight(r.glycemic_load, thresholds)
          : r.traffic_light
        return (
          <button
            key={r.id ?? `${r.name_es}-${i}`}
            onClick={() => onSelect?.(r)}
            className={`flex items-center gap-3 surface-card px-4 py-3.5 text-left transition-colors min-h-[48px] ${
              isSelected ? 'ring-2 ring-primary/30' : ''
            }`}
          >
            {itemTL && <TrafficLightBadge rating={itemTL} size="sm" />}
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-on-surface truncate">{displayName}</p>
              <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
                {Math.round(r.calories)} kcal · {Math.round(r.protein_g)}p · {Math.round(r.carbs_g)}c · {Math.round(r.fat_g)}f
              </p>
            </div>
            {r.glycemic_load != null && (
              <span className="text-body font-semibold text-on-surface-variant">CG {Math.round(r.glycemic_load)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Composite Result ────────────────────────────────────────

interface CompositeResultCardProps {
  total: FoodSearchResult
  components: FoodSearchResult[]
}

export function CompositeResultCard({ total, components }: CompositeResultCardProps) {
  const thresholds = useThresholds()
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-5">
      <FoodResultCard result={total} showSource={false} />

      <div>
        <p className="text-label text-on-surface-variant mb-3">{t('result.breakdown')}</p>
        <div className="flex flex-col gap-2">
          {components.map((c, i) => {
            const compTL = c.glycemic_load != null
              ? getPersonalizedTrafficLight(c.glycemic_load, thresholds)
              : c.traffic_light
            return (
              <div key={i} className="flex items-center gap-3 surface-card px-4 py-3">
                {compTL && <TrafficLightBadge rating={compTL} size="sm" />}
                <div className="flex-1 min-w-0">
                  <p className="text-body text-on-surface truncate">{c.name_es || c.name_en}</p>
                  <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">{c.serving_size}g</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-body font-medium text-on-surface">{Math.round(c.calories)} kcal</p>
                  <p className="text-label text-on-surface-variant font-normal normal-case tracking-normal">
                    CG {c.glycemic_load != null ? Math.round(c.glycemic_load) : '--'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function isCompositeResult(results: FoodSearchResult[]): boolean {
  if (results.length < 3) return false
  return results[0].serving_description?.startsWith('Total (') ?? false
}

export function SearchMeta({ source, cached, latencyMs }: { source: string; cached: boolean; latencyMs: number }) {
  return (
    <div className="flex items-center gap-2 text-label text-on-surface-variant font-normal normal-case tracking-normal">
      {cached && <span className="surface-card px-2 py-0.5 text-info">cache</span>}
      <span>{source}</span>
      <span>·</span>
      <span>{latencyMs}ms</span>
    </div>
  )
}

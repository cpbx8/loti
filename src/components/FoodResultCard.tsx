/**
 * Food result display — redesigned to match premium iOS-style layout.
 * Shows: food image/hero, impact badge, AI description, macro cards,
 * fiber/sugar detail, pro tip, and source attribution.
 */
import { useState, useCallback } from 'react'
import type { FoodSearchResult } from '@/types/shared'
import TrafficLightBadge from './TrafficLightBadge'
import GlucoseSpikeCurve from './GlucoseSpikeCurve'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import FatSecretAttribution from './FatSecretAttribution'

// ─── Impact labels in Spanish ────────────────────────────────

const IMPACT_CONFIG: Record<string, { label: string; labelEs: string; bg: string; text: string; dot: string }> = {
  green:  { label: 'Low Impact',      labelEs: 'Bajo impacto',     bg: 'bg-tl-green-bg',  text: 'text-tl-green-fill',  dot: 'bg-tl-green-fill' },
  yellow: { label: 'Moderate Impact',  labelEs: 'Impacto moderado', bg: 'bg-tl-yellow-bg', text: 'text-tl-yellow-fill', dot: 'bg-tl-yellow-fill' },
  red:    { label: 'High Impact',      labelEs: 'Impacto alto',     bg: 'bg-tl-red-bg',    text: 'text-tl-red-fill',    dot: 'bg-tl-red-fill' },
}

/** Generate a contextual AI description of the food's glucose impact */
function getImpactDescription(name: string, tl: string, gl: number | null, fiber: number | null): string {
  const foodName = name.toLowerCase()
  if (tl === 'green') {
    if (fiber && fiber > 3) {
      return `${name} tiene un impacto mínimo en tu glucosa gracias a su alto contenido de fibra. Es una excelente opción.`
    }
    return `${name} tiene un impacto bajo en tu glucosa. Es una buena elección para mantener niveles estables.`
  }
  if (tl === 'yellow') {
    return `${name} tiene un impacto moderado en tu glucosa. Considera combinarlo con proteína o fibra para reducir el pico.`
  }
  return `${name} tiene un impacto alto en tu glucosa. Modera la porción y acompáñalo con proteína, fibra o grasa saludable.`
}

/** Generate a pro tip based on traffic light and food type */
function getProTip(name: string, tl: string, swap?: string | null): string {
  if (swap) return swap
  if (tl === 'green') return `Acompáñalo con proteína para una comida completa y equilibrada.`
  if (tl === 'yellow') return `Agrega verduras o ensalada para aumentar la fibra y reducir el impacto glucémico.`
  return `Come la proteína y verduras primero, deja los carbohidratos para el final del plato.`
}

// ─── Source Badge ─────────────────────────────────────────────

const SOURCE_INFO: Record<string, { label: string; color: string }> = {
  cache:         { label: 'Cached',          color: 'text-info' },
  seed:          { label: 'Verificado',      color: 'text-tl-green-fill' },
  fatsecret:     { label: 'FatSecret',       color: 'text-info' },
  openfoodfacts: { label: 'Open Food Facts', color: 'text-tl-green-accent' },
  gpt4o:         { label: 'Estimación IA',   color: 'text-tl-yellow-fill' },
  user:          { label: 'Comunidad',       color: 'text-info' },
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

// ─── Single Result Card ───────────────────────────────────────

interface FoodResultCardProps {
  result: FoodSearchResult
  showSource?: boolean
  onQuantityChange?: (qty: number, scaled: FoodSearchResult) => void
}

export function FoodResultCard({ result: r, showSource = true, onQuantityChange }: FoodResultCardProps) {
  const [quantity, setQuantity] = useState(1)
  const displayName = r.name_es || r.name_en
  const thresholds = useThresholds()

  // Scale values by quantity
  const q = quantity
  const cal = r.calories * q
  const protein = r.protein_g * q
  const carbs = r.carbs_g * q
  const fat = r.fat_g * q
  const fiber = r.fiber_g != null ? r.fiber_g * q : null
  const sugar = r.sugar_g != null ? r.sugar_g * q : null
  const gl = r.glycemic_load != null ? r.glycemic_load * q : null
  const servingG = r.serving_size * q

  // Recompute traffic light from scaled GL
  const tl = gl != null
    ? getPersonalizedTrafficLight(gl, thresholds)
    : r.traffic_light
  const hasTL = tl != null
  const impact = hasTL ? IMPACT_CONFIG[tl!] : null

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
    <div className="flex flex-col gap-4">
      {/* ── Food name hero ─────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 p-6 pb-5">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary leading-tight">{displayName}</h2>
            {r.name_en && r.name_es && r.name_en !== r.name_es && (
              <p className="text-sm text-text-secondary mt-0.5">{r.name_en}</p>
            )}
          </div>
          {hasTL && <TrafficLightBadge rating={tl!} size="md" animated />}
        </div>

        {/* Serving size pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1">
          <span className="text-xs font-medium text-text-secondary">
            {r.serving_description ?? `${Math.round(servingG)}${r.serving_unit}`}
          </span>
        </div>
      </div>

      {/* ── Impact badge ───────────────────────────── */}
      {impact && (
        <div className="flex justify-center">
          <div className={`inline-flex items-center gap-2 rounded-full ${impact.bg} px-5 py-2`}>
            <div className={`h-2.5 w-2.5 rounded-full ${impact.dot}`} />
            <span className={`text-sm font-semibold ${impact.text} uppercase tracking-wide`}>
              {impact.labelEs}
            </span>
          </div>
        </div>
      )}

      {/* ── AI description ─────────────────────────── */}
      {hasTL && (
        <p className="text-[15px] text-text-secondary leading-relaxed px-1">
          {getImpactDescription(displayName, tl!, gl, fiber)}
        </p>
      )}

      {/* ── Quantity adjuster ──────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl bg-card border border-border px-4 py-3">
        <span className="text-sm font-medium text-text-secondary">Porción</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustQty(-0.5)}
            disabled={quantity <= 0.5}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border text-text-primary disabled:opacity-30 min-h-[32px] min-w-[32px]"
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center text-lg font-bold text-text-primary">
            {quantity % 1 === 0 ? quantity : quantity.toFixed(1)}
          </span>
          <button
            onClick={() => adjustQty(0.5)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white min-h-[32px] min-w-[32px]"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Carbs hero card ────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Carbohidratos</p>
            <p className="text-3xl font-bold text-text-primary mt-0.5">
              {Math.round(carbs)}
              <span className="text-base font-normal text-text-tertiary ml-0.5">g</span>
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Fiber + Sugar side by side ──────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fiber */}
        <div className="rounded-2xl border-2 border-tl-green-fill/20 bg-tl-green-bg/50 p-4">
          <p className="text-[10px] font-semibold text-tl-green-fill uppercase tracking-wider">Fibra</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {fiber != null ? (Math.round(fiber * 10) / 10) : '--'}
            <span className="text-sm font-normal text-text-tertiary ml-0.5">g</span>
          </p>
          {fiber != null && fiber >= 3 && (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-tl-green-fill/10 px-2 py-0.5">
              <span className="text-[10px]">👍</span>
              <span className="text-[10px] font-semibold text-tl-green-fill">GOOD</span>
            </div>
          )}
        </div>

        {/* Sugar */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Azúcares</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {sugar != null ? Math.round(sugar) : '--'}
            <span className="text-sm font-normal text-text-tertiary ml-0.5">g</span>
          </p>
          {sugar != null && (
            <p className="text-[10px] text-text-tertiary mt-1.5">
              {sugar < 5 ? 'Bajo' : sugar < 15 ? 'Naturales' : 'Elevado'}
            </p>
          )}
        </div>
      </div>

      {/* ── GI/GL detail row ───────────────────────── */}
      {hasTL && r.glycemic_index != null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Índice glucémico</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{Math.round(r.glycemic_index)}</p>
          </div>
          <div className={`rounded-2xl p-4 text-center ${impact?.bg ?? 'bg-card border border-border'}`}>
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Carga glucémica</p>
            <p className={`text-2xl font-bold mt-1 ${impact?.text ?? 'text-text-primary'}`}>
              {gl != null ? Math.round(gl) : '--'}
            </p>
          </div>
        </div>
      )}

      {/* ── Macros grid ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border border-border p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{Math.round(cal)}</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">Calorías</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{Math.round(carbs)}g</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">Carbos</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{Math.round(protein)}g</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">Proteína</p>
        </div>
      </div>

      {/* ── Glucose spike curve ────────────────────── */}
      {hasTL && gl != null && gl > 0 && (
        <GlucoseSpikeCurve
          gi={r.glycemic_index ?? (tl === 'red' ? 75 : tl === 'yellow' ? 60 : 40)}
          gl={gl}
          trafficLight={tl!}
          peakMgDl={{ low: Math.round(gl * 2), high: Math.round(gl * 4) }}
        />
      )}

      {/* ── Pro tip card ───────────────────────────── */}
      {hasTL && (
        <div className="rounded-2xl bg-tl-green-bg/40 border border-tl-green-fill/10 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tl-green-fill/15 mt-0.5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-tl-green-fill" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Consejo Pro</p>
              <p className="text-sm text-text-secondary mt-0.5 leading-snug">
                {getProTip(displayName, tl!, r.swap_suggestion)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Source attribution ──────────────────────── */}
      {showSource && (
        <div className="flex items-center justify-between">
          {r.source === 'fatsecret'
            ? <FatSecretAttribution />
            : <SourceBadge source={r.source} confidence={r.confidence} />
          }
        </div>
      )}

      {/* ── Disclaimer ─────────────────────────────── */}
      <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
        Esta información es educativa. Consulta a tu médico para decisiones de tratamiento.
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
    <div className="flex flex-col gap-2">
      {results.map((r, i) => {
        const displayName = r.name_es || r.name_en
        const isSelected = selectedIndex === i
        const itemTL = r.glycemic_load != null
          ? getPersonalizedTrafficLight(r.glycemic_load, thresholds)
          : r.traffic_light
        return (
          <button
            key={r.id ?? `${r.name_es}-${i}`}
            onClick={() => onSelect?.(r)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors min-h-[48px] ${
              isSelected ? 'bg-primary-light border border-primary/30' : 'bg-card shadow-sm hover:bg-surface'
            }`}
          >
            {itemTL && <TrafficLightBadge rating={itemTL} size="sm" />}
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
  const thresholds = useThresholds()
  return (
    <div className="flex flex-col gap-4">
      <FoodResultCard result={total} showSource={false} />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Desglose</p>
        <div className="space-y-1.5">
          {components.map((c, i) => {
            const compTL = c.glycemic_load != null
              ? getPersonalizedTrafficLight(c.glycemic_load, thresholds)
              : c.traffic_light
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2">
                {compTL && <TrafficLightBadge rating={compTL} size="sm" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{c.name_es || c.name_en}</p>
                  <p className="text-xs text-text-tertiary">{c.serving_size}g</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-text-primary">{Math.round(c.calories)} kcal</p>
                  <p className="text-xs text-text-tertiary">
                    GL {c.glycemic_load != null ? Math.round(c.glycemic_load) : '--'}
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

/** Check if results follow the composite pattern */
export function isCompositeResult(results: FoodSearchResult[]): boolean {
  if (results.length < 3) return false
  const first = results[0]
  return first.serving_description?.startsWith('Total (') ?? false
}

// ─── Latency / Source Pill ────────────────────────────────────

export function SearchMeta({ source, cached, latencyMs }: { source: string; cached: boolean; latencyMs: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-tertiary">
      {cached && <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-info">cache</span>}
      <span>{source}</span>
      <span>·</span>
      <span>{latencyMs}ms</span>
    </div>
  )
}

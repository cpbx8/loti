/**
 * SuggestionSheet — bottom sheet for AI food suggestions.
 * Three states: idle (quick-select + free text), loading, results.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useThresholds } from '@/hooks/useThresholds'
import { useDailyLog } from '@/hooks/useDailyLog'
import { useProfile } from '@/hooks/useProfile'
import { getScanSummary, formatScanSummaryForPrompt, getTodaySummaryLine } from '@/utils/scanSummary'
import SuggestionCard from './SuggestionCard'
import ModifierTipBanner, { getRandomTip } from './ModifierTipBanner'
import TrafficLightBadge from './TrafficLightBadge'

// ─── Types ────────────────────────────────────────────────────

interface Suggestion {
  food_name: string
  estimated_gl: number
  traffic_light: 'green' | 'yellow'
  reasoning: string
}

type SheetState = 'idle' | 'loading' | 'results' | 'error' | 'rate_limited'

interface SuggestionSheetProps {
  open: boolean
  onClose: () => void
}

// ─── Constants ────────────────────────────────────────────────

const ONBOARDING_KEY = 'loti_onboarding'
const SUGGEST_COUNT_KEY = 'loti_suggest_count'
const MAX_DAILY_SUGGESTIONS = 20

const MEAL_BUTTONS = [
  { type: 'breakfast' as const, icon: '🌅', label: 'Breakfast' },
  { type: 'lunch' as const, icon: '☀️', label: 'Lunch' },
  { type: 'dinner' as const, icon: '🌙', label: 'Dinner' },
  { type: 'snack' as const, icon: '🍿', label: 'Snack' },
]

const PLACEHOLDERS = [
  'I\'m craving tacos...',
  'What can I eat at OXXO?',
  'A green dinner idea...',
  'Something sweet but safe...',
  'Low-GI breakfast options...',
]

// ─── Rate limiting (localStorage) ─────────────────────────────

function getDailyCount(): number {
  try {
    const raw = localStorage.getItem(SUGGEST_COUNT_KEY)
    if (!raw) return 0
    const { date, count } = JSON.parse(raw)
    if (date !== new Date().toISOString().slice(0, 10)) return 0
    return count
  } catch {
    return 0
  }
}

function incrementDailyCount() {
  const today = new Date().toISOString().slice(0, 10)
  const current = getDailyCount()
  localStorage.setItem(SUGGEST_COUNT_KEY, JSON.stringify({ date: today, count: current + 1 }))
}

// ─── Profile loader ───────────────────────────────────────────

function loadProfile(thresholds: { greenMax: number; yellowMax: number }) {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    const state = raw ? JSON.parse(raw) : {}
    return {
      health_state: state.healthState ?? 'healthy',
      goal: state.goal ?? 'learn',
      a1c_value: state.a1cValue ?? null,
      age: state.age ?? null,
      sex: state.sex ?? 'not_specified',
      activity_level: state.activityLevel ?? 'moderate',
      dietary_restrictions: state.dietaryRestrictions ?? [],
      meal_struggles: state.mealStruggles ?? [],
      medications: state.medications ?? [],
      gl_threshold_green: thresholds.greenMax,
      gl_threshold_yellow: thresholds.yellowMax,
    }
  } catch {
    return {
      health_state: 'healthy',
      goal: 'learn',
      a1c_value: null,
      age: null,
      sex: 'not_specified',
      activity_level: 'moderate',
      dietary_restrictions: [],
      meal_struggles: [],
      medications: [],
      gl_threshold_green: thresholds.greenMax,
      gl_threshold_yellow: thresholds.yellowMax,
    }
  }
}

// ─── Component ────────────────────────────────────────────────

export default function SuggestionSheet({ open, onClose }: SuggestionSheetProps) {
  const navigate = useNavigate()
  const thresholds = useThresholds()
  const { addEntry } = useDailyLog()
  const { profile: serverProfile } = useProfile()
  const [state, setState] = useState<SheetState>('idle')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [excludeList, setExcludeList] = useState<string[]>([])
  const [tip, setTip] = useState('')
  const [freetext, setFreetext] = useState('')
  const [contextHeader, setContextHeader] = useState('')
  const [error, setError] = useState('')
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setState('idle')
      setSuggestions([])
      setExcludeList([])
      setFreetext('')
      setTip(getRandomTip())
      setError('')
    }
  }, [open])

  const callSuggest = useCallback(async (
    contextType: 'meal' | 'freetext',
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    text?: string,
    exclude?: string[],
  ) => {
    // Rate limit check
    if (getDailyCount() >= MAX_DAILY_SUGGESTIONS) {
      setState('rate_limited')
      return
    }

    setState('loading')

    const headerMap: Record<string, string> = {
      breakfast: 'Breakfast ideas for you',
      lunch: 'Lunch ideas for you',
      dinner: 'Dinner ideas for you',
      snack: 'Snack ideas for you',
    }
    setContextHeader(
      contextType === 'meal' && mealType
        ? headerMap[mealType] ?? 'Ideas for you'
        : 'Ideas for you'
    )

    try {
      const profile = serverProfile
        ? {
            health_state: serverProfile.health_state ?? 'healthy',
            goal: serverProfile.goal ?? 'learn',
            a1c_value: serverProfile.a1c_value ?? null,
            age: serverProfile.age ?? null,
            sex: serverProfile.sex ?? 'not_specified',
            activity_level: serverProfile.activity_level ?? 'moderate',
            dietary_restrictions: serverProfile.dietary_restrictions ?? [],
            meal_struggles: serverProfile.meal_struggles ?? [],
            medications: serverProfile.medications ?? [],
            gl_threshold_green: thresholds.greenMax,
            gl_threshold_yellow: thresholds.yellowMax,
          }
        : loadProfile(thresholds)
      const summary = getScanSummary(7, thresholds)
      const scanSummaryText = formatScanSummaryForPrompt(summary)

      const { data, error: fnError } = await supabase.functions.invoke('suggest', {
        body: {
          context: {
            type: contextType,
            meal_type: mealType,
            freetext: text,
            exclude: exclude,
          },
          profile,
          scan_summary: scanSummaryText,
        },
      })

      if (fnError) throw fnError

      if (data?.error) {
        setError(data.error)
        setState('error')
        return
      }

      const newSuggestions: Suggestion[] = data.suggestions ?? []
      setSuggestions(newSuggestions)
      setExcludeList(prev => [...prev, ...newSuggestions.map(s => s.food_name)])
      incrementDailyCount()
      setState('results')
    } catch (err) {
      console.error('[suggest] Error:', err)
      setError('Could not get suggestions. Please try again.')
      setState('error')
    }
  }, [thresholds, serverProfile])

  const handleMealTap = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    callSuggest('meal', mealType)
  }

  const handleFreetextSubmit = () => {
    const text = freetext.trim()
    if (!text) return
    callSuggest('freetext', undefined, text)
  }

  const handleMoreIdeas = () => {
    callSuggest('meal', undefined, undefined, excludeList)
  }

  const handleAskAgain = () => {
    setState('idle')
    setSuggestions([])
    setFreetext('')
    setTip(getRandomTip())
  }

  const handleSuggestionTap = (foodName: string) => {
    onClose()
    navigate(`/search?q=${encodeURIComponent(foodName)}`)
  }

  const logSuggestion = (s: Suggestion) => {
    addEntry({
      food_name: s.food_name,
      calories_kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: null,
      glycemic_load: s.estimated_gl,
      result_traffic_light: s.traffic_light,
      serving_size_g: 0,
      input_method: 'ai_suggestion',
    })
  }

  if (!open) return null

  const summary = getScanSummary(7, thresholds)
  const todayLine = getTodaySummaryLine(summary)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card shadow-2xl animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-6">
          {/* ── Idle State ─────────────────────────────── */}
          {state === 'idle' && (
            <div className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold text-text-primary">What should I eat?</h2>

              {/* Quick-select grid */}
              <div className="grid grid-cols-2 gap-3">
                {MEAL_BUTTONS.map(m => (
                  <button
                    key={m.type}
                    onClick={() => handleMealTap(m.type)}
                    className="flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-left transition-colors hover:bg-primary/10 active:bg-primary/10 min-h-[48px]"
                  >
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-base font-medium text-text-primary">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Free-text input */}
              <form
                onSubmit={e => { e.preventDefault(); handleFreetextSubmit() }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={freetext}
                  onChange={e => setFreetext(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none min-h-[48px]"
                />
                <button
                  type="submit"
                  disabled={!freetext.trim()}
                  className="rounded-3xl bg-primary px-4 py-3 text-white font-medium disabled:opacity-40 min-h-[48px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>

              {/* Today's scan summary */}
              {summary.today_scans.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    {summary.today_scans.map((s, i) => (
                      <TrafficLightBadge key={i} rating={s.traffic_light} size="sm" showIcon={false} />
                    ))}
                  </div>
                  <p className="text-xs text-text-tertiary">{todayLine}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Loading State ──────────────────────────── */}
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
              <p className="text-base text-text-secondary">Finding glucose-friendly ideas...</p>
            </div>
          )}

          {/* ── Results State ──────────────────────────── */}
          {state === 'results' && (
            <div className="flex flex-col gap-4">
              {/* Context header */}
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{contextHeader}</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Based on your {serverProfile?.health_state ?? loadProfile(thresholds).health_state} profile
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="flex flex-col gap-3">
                {suggestions.map((s, i) => (
                  <SuggestionCard
                    key={i}
                    foodName={s.food_name}
                    estimatedGL={s.estimated_gl}
                    trafficLight={s.traffic_light}
                    reasoning={s.reasoning}
                    onTap={() => handleSuggestionTap(s.food_name)}
                    onLog={() => logSuggestion(s)}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleMoreIdeas}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface active:bg-surface min-h-[44px]"
                >
                  More ideas
                </button>
                <button
                  onClick={handleAskAgain}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface active:bg-surface min-h-[44px]"
                >
                  Ask again
                </button>
              </div>

              {/* Modifier tip */}
              <ModifierTipBanner tip={tip} />

              {/* Remaining count + Disclaimer */}
              <p className="text-xs text-text-tertiary">
                {MAX_DAILY_SUGGESTIONS - getDailyCount()} suggestions remaining today
              </p>
              <p className="text-xs text-text-tertiary leading-relaxed">
                Values are estimates. Consult a healthcare professional for medical advice.
              </p>
            </div>
          )}

          {/* ── Error State ────────────────────────────── */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <p className="text-base text-text-secondary text-center">{error}</p>
              <button
                onClick={handleAskAgain}
                className="rounded-3xl bg-primary px-6 py-3 text-base font-medium text-white min-h-[44px]"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Rate Limited State ─────────────────────── */}
          {state === 'rate_limited' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-base text-text-secondary text-center">
                You've used all your daily suggestions. They reset at midnight!
              </p>
              <button
                onClick={onClose}
                className="rounded-xl border border-border px-6 py-3 text-base font-medium text-text-secondary min-h-[44px]"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { FoodSearchResult, TrafficLight } from '@/types/shared'

// ─── Types ───────────────────────────────────────────────────

export type HealthState = 'healthy' | 'prediabetic' | 'type2' | 'gestational'
export type Goal = 'lower_a1c' | 'lose_weight' | 'learn' | 'wellness'
export type Sex = 'male' | 'female' | 'not_specified'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active'

export interface OnboardingState {
  // Pre-signup scan
  firstScanResult: FoodSearchResult | null
  firstScanPhoto: string | null

  // Profile data
  healthState: HealthState | null
  goal: Goal | null
  diagnosisDuration: string | null
  a1cValue: number | null
  medications: string[]
  age: number | null
  sex: Sex | null
  activityLevel: ActivityLevel | null
  dietaryRestrictions: string[]
  mealStruggles: string[]

  // Flow state
  currentScreen: number
  screensCompleted: number
  skippedScreens: number[]
}

const INITIAL_STATE: OnboardingState = {
  firstScanResult: null,
  firstScanPhoto: null,
  healthState: null,
  goal: null,
  diagnosisDuration: null,
  a1cValue: null,
  medications: [],
  age: null,
  sex: null,
  activityLevel: null,
  dietaryRestrictions: [],
  mealStruggles: [],
  currentScreen: 0,
  screensCompleted: 0,
  skippedScreens: [],
}

const STORAGE_KEY = 'loti_onboarding'

// ─── Threshold computation ───────────────────────────────────

function getBaseThresholds(healthState: HealthState | null) {
  switch (healthState) {
    case 'prediabetic':
      return { greenMax: 8, yellowMax: 15 }
    case 'type2':
      return { greenMax: 7, yellowMax: 13 }
    case 'gestational':
      return { greenMax: 7, yellowMax: 12 }
    default:
      return { greenMax: 10, yellowMax: 19 }
  }
}

export function computeThresholds(state: OnboardingState): { greenMax: number; yellowMax: number } {
  let { greenMax, yellowMax } = getBaseThresholds(state.healthState)

  if (state.a1cValue && state.a1cValue > 8.0) {
    greenMax = Math.max(5, greenMax - 1)
    yellowMax = Math.max(10, yellowMax - 2)
  }

  if (state.activityLevel === 'very_active') {
    greenMax += 1
    yellowMax += 1
  }

  if (state.age && state.age > 65) {
    greenMax = Math.max(5, greenMax - 1)
  }

  return { greenMax, yellowMax }
}

export function getTrafficLightFromGL(gl: number, greenMax: number, yellowMax: number): TrafficLight {
  if (gl <= greenMax) return 'green'
  if (gl <= yellowMax) return 'yellow'
  return 'red'
}

// ─── Screen definitions ──────────────────────────────────────

export interface ScreenDef {
  id: string
  label: string
  skippable: boolean
  shouldShow: (state: OnboardingState) => boolean
}

export const ONBOARDING_SCREENS: ScreenDef[] = [
  { id: 'welcome', label: 'Welcome', skippable: false, shouldShow: () => true },
  { id: 'health_state', label: 'Health State', skippable: false, shouldShow: () => true },
  { id: 'goal', label: 'Goal', skippable: false, shouldShow: () => true },
  { id: 'diagnosis', label: 'Diagnosis', skippable: true, shouldShow: (s) => s.healthState !== 'healthy' },
  { id: 'a1c', label: 'A1C', skippable: true, shouldShow: () => true },
  { id: 'medications', label: 'Medications', skippable: true, shouldShow: (s) => s.healthState !== 'healthy' },
  { id: 'age_sex', label: 'About You', skippable: false, shouldShow: () => true },
  { id: 'activity', label: 'Activity', skippable: true, shouldShow: () => true },
  { id: 'dietary', label: 'Dietary', skippable: true, shouldShow: () => true },
  { id: 'meal_struggles', label: 'Meals', skippable: true, shouldShow: () => true },
  { id: 'create_account', label: 'Account', skippable: false, shouldShow: () => true },
  { id: 'summary', label: 'Summary', skippable: false, shouldShow: () => true },
]

// ─── Context ─────────────────────────────────────────────────

interface OnboardingContextValue {
  state: OnboardingState
  update: (partial: Partial<OnboardingState>) => void
  next: () => void
  back: () => void
  skip: () => void
  goToScreen: (index: number) => void
  reset: () => void
  visibleScreens: ScreenDef[]
  currentScreenDef: ScreenDef
  stepNumber: number
  totalSteps: number
  thresholds: { greenMax: number; yellowMax: number }
  isComplete: boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...INITIAL_STATE, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return INITIAL_STATE
  })

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const update = useCallback((partial: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  const visibleScreens = ONBOARDING_SCREENS.filter(s => s.shouldShow(state))

  const findNextVisible = (fromIndex: number): number => {
    for (let i = fromIndex + 1; i < ONBOARDING_SCREENS.length; i++) {
      if (ONBOARDING_SCREENS[i].shouldShow(state)) return i
    }
    return fromIndex
  }

  const findPrevVisible = (fromIndex: number): number => {
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (ONBOARDING_SCREENS[i].shouldShow(state)) return i
    }
    return fromIndex
  }

  // Sync to localStorage inside updaters so state survives auth-triggered re-mounts
  const persistAndSet = useCallback((updater: (prev: OnboardingState) => OnboardingState) => {
    setState(prev => {
      const next = updater(prev)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const next = useCallback(() => {
    persistAndSet(prev => ({
      ...prev,
      currentScreen: findNextVisible(prev.currentScreen),
      screensCompleted: Math.max(prev.screensCompleted, prev.currentScreen + 1),
    }))
  }, [state.healthState])

  const back = useCallback(() => {
    persistAndSet(prev => ({
      ...prev,
      currentScreen: findPrevVisible(prev.currentScreen),
    }))
  }, [state.healthState])

  const skip = useCallback(() => {
    persistAndSet(prev => ({
      ...prev,
      currentScreen: findNextVisible(prev.currentScreen),
      screensCompleted: Math.max(prev.screensCompleted, prev.currentScreen + 1),
      skippedScreens: [...prev.skippedScreens, prev.currentScreen],
    }))
  }, [state.healthState])

  const goToScreen = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentScreen: index }))
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(INITIAL_STATE)
  }, [])

  const currentScreenDef = ONBOARDING_SCREENS[state.currentScreen] ?? ONBOARDING_SCREENS[0]
  const visibleIndex = visibleScreens.findIndex(s => s.id === currentScreenDef.id)
  const thresholds = computeThresholds(state)
  const isComplete = currentScreenDef.id === 'summary' && state.screensCompleted >= ONBOARDING_SCREENS.length - 1

  return (
    <OnboardingContext.Provider
      value={{
        state,
        update,
        next,
        back,
        skip,
        goToScreen,
        reset,
        visibleScreens,
        currentScreenDef,
        stepNumber: visibleIndex + 1,
        totalSteps: visibleScreens.length,
        thresholds,
        isComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

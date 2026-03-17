import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding, computeThresholds, getTrafficLightFromGL, ONBOARDING_SCREENS } from '@/contexts/OnboardingContext'
import TrafficLightBadge from '@/components/TrafficLightBadge'

const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Healthy / Curious',
  prediabetic: 'Prediabetic',
  type2: 'Type 2 Diabetes',
  gestational: 'Gestational Diabetes',
}

const GOAL_LABELS: Record<string, string> = {
  lower_a1c: 'Lower my A1C',
  lose_weight: 'Lose weight',
  learn: 'Learn about food',
  wellness: 'General wellness',
}

export default function SummaryScreen() {
  const navigate = useNavigate()
  const { state, reset } = useOnboarding()
  const thresholds = computeThresholds(state)
  const [visibleLines, setVisibleLines] = useState(0)

  // Stagger in each line
  useEffect(() => {
    const total = 5
    let i = 0
    const timer = setInterval(() => {
      i++
      setVisibleLines(i)
      if (i >= total) clearInterval(timer)
    }, 200)
    return () => clearInterval(timer)
  }, [])

  const completedCount = ONBOARDING_SCREENS.filter(s => s.shouldShow(state)).length - state.skippedScreens.length
  const totalCount = ONBOARDING_SCREENS.filter(s => s.shouldShow(state)).length

  // Check if the first scan result traffic light changed with personalized thresholds
  const firstScan = state.firstScanResult
  let trafficLightChanged = false
  let oldTL = firstScan?.traffic_light
  let newTL = firstScan?.traffic_light
  if (firstScan?.glycemic_load != null) {
    newTL = getTrafficLightFromGL(firstScan.glycemic_load, thresholds.greenMax, thresholds.yellowMax)
    trafficLightChanged = !!oldTL && oldTL !== newTL
  }

  const handleStart = () => {
    // Clear onboarding state, mark as done
    localStorage.setItem('loti_onboarding_complete', 'true')
    reset()
    navigate('/')
  }

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-[100svh] px-6 pb-8">
      <h1 className="mt-12 text-center text-2xl font-bold text-text-primary">
        Your Loti profile is ready
      </h1>

      {/* Animated profile card */}
      <div className="mt-8 rounded-2xl bg-card p-5 shadow-sm border border-border">
        <div className="flex flex-col gap-3">
          {/* Health state */}
          <div className={`transition-all duration-300 ${visibleLines >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${
                state.healthState === 'healthy' ? 'bg-tl-green-accent'
                  : state.healthState === 'prediabetic' ? 'bg-tl-yellow-accent'
                  : 'bg-tl-red-accent'
              }`} />
              <span className="font-medium text-text-primary">
                {HEALTH_LABELS[state.healthState ?? 'healthy']}
              </span>
            </div>
          </div>

          {/* Goal */}
          <div className={`transition-all duration-300 ${visibleLines >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className="text-sm text-text-secondary">Goal: </span>
            <span className="text-sm font-medium text-text-primary">
              {GOAL_LABELS[state.goal ?? 'learn']}
            </span>
          </div>

          {/* Thresholds */}
          <div className={`transition-all duration-300 ${visibleLines >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <p className="text-sm text-text-secondary">Your thresholds:</p>
            <div className="mt-1 flex gap-3 text-sm">
              <span className="text-tl-green-fill font-medium">Green &lt; {thresholds.greenMax} GL</span>
              <span className="text-tl-yellow-fill font-medium">Yellow &lt; {thresholds.yellowMax} GL</span>
              <span className="text-tl-red-fill font-medium">Red &ge; {thresholds.yellowMax} GL</span>
            </div>
          </div>

          {/* A1C */}
          <div className={`transition-all duration-300 ${visibleLines >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className="text-sm text-text-secondary">A1C: </span>
            <span className="text-sm font-medium text-text-primary">
              {state.a1cValue ? `${state.a1cValue}%` : 'Not provided — you can add this anytime'}
            </span>
          </div>

          {/* Completion */}
          <div className={`transition-all duration-300 ${visibleLines >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className="text-sm text-text-tertiary">
              {completedCount}/{totalCount} profile complete
              {completedCount < totalCount && ' — finish later in Settings'}
            </span>
          </div>
        </div>
      </div>

      {/* First scan update */}
      {firstScan && (
        <div className="mt-6">
          <p className="text-sm text-text-secondary text-center mb-3">
            Your first scan has been updated with your personalized thresholds
          </p>

          <div className="rounded-xl bg-card p-4 border border-border shadow-sm">
            <div className="flex items-center gap-3">
              {newTL && <TrafficLightBadge level={newTL} size="md" />}
              <div>
                <p className="font-medium text-text-primary">
                  {firstScan.name_en || firstScan.name_es}
                </p>
                <p className="text-sm text-text-secondary">
                  GL {firstScan.glycemic_load} · {firstScan.calories} kcal
                </p>
              </div>
            </div>
          </div>

          {trafficLightChanged && oldTL && newTL && (
            <div className="mt-3 rounded-xl bg-primary-light px-4 py-3">
              <p className="text-sm text-primary">
                Based on your {HEALTH_LABELS[state.healthState ?? 'healthy']} profile, this food has been reclassified from {oldTL} to {newTL} impact.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-8">
        <button
          onClick={handleStart}
          className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark transition-colors min-h-[52px]"
        >
          Start scanning
        </button>
      </div>
    </div>
  )
}

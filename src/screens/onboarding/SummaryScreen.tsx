import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding, computeThresholds, getTrafficLightFromGL, ONBOARDING_SCREENS } from '@/contexts/OnboardingContext'
import TrafficLightBadge from '@/components/TrafficLightBadge'
import { upsertProfile, completeOnboarding } from '@/db/queries'
import { startTrial } from '@/lib/revenuecat'
import { useLanguage } from '@/lib/i18n'

export default function SummaryScreen() {
  const navigate = useNavigate()
  const { state } = useOnboarding()
  const { t } = useLanguage()
  const thresholds = computeThresholds(state)
  const [visibleLines, setVisibleLines] = useState(0)

  const HEALTH_LABELS: Record<string, string> = {
    healthy: t('onboarding.summary.healthy'),
    prediabetic: t('onboarding.summary.prediabetic'),
    type2: t('onboarding.summary.type2'),
    gestational: t('onboarding.summary.gestational'),
  }

  // Stagger in each line
  useEffect(() => {
    const total = 4
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
    // Flip onboarding flag immediately so the route guard lets us through
    localStorage.setItem('loti_onboarding_complete', 'true')
    navigate('/', { replace: true })

    // Fire-and-forget DB writes — non-blocking
    upsertProfile({
      health_state: state.healthState ?? 'healthy',
      goal: state.goal ?? null,
      diagnosis_duration: state.diagnosisDuration ?? null,
      a1c_value: state.a1cValue ?? null,
      age: state.age ?? null,
      sex: state.sex ?? 'not_specified',
      activity_level: state.activityLevel ?? 'moderate',
      medications: state.medications ?? [],
      dietary_restrictions: state.dietaryRestrictions ?? [],
      meal_struggles: state.mealStruggles ?? [],
      gl_threshold_green: thresholds.greenMax,
      gl_threshold_yellow: thresholds.yellowMax,
    }).catch(console.warn)
    completeOnboarding().catch(console.warn)
    startTrial().catch(console.warn)
  }

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <h1 className="mt-12 text-center text-headline text-on-surface">
          {t('onboarding.summary.title')}
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

            {/* Thresholds */}
            <div className={`transition-all duration-300 ${visibleLines >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <p className="text-sm text-text-secondary">{t('onboarding.summary.thresholds')}</p>
              <div className="mt-1 flex gap-3 text-sm">
                <span className="text-tl-green-fill font-medium">Green &lt; {thresholds.greenMax} GL</span>
                <span className="text-tl-yellow-fill font-medium">Yellow &lt; {thresholds.yellowMax} GL</span>
                <span className="text-tl-red-fill font-medium">Red &ge; {thresholds.yellowMax} GL</span>
              </div>
            </div>

            {/* A1C */}
            <div className={`transition-all duration-300 ${visibleLines >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="text-sm text-text-secondary">{t('onboarding.summary.a1cLabel')} </span>
              <span className="text-sm font-medium text-text-primary">
                {state.a1cValue ? `${state.a1cValue}%` : t('onboarding.summary.a1cNone')}
              </span>
            </div>

            {/* Completion */}
            <div className={`transition-all duration-300 ${visibleLines >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="text-sm text-text-tertiary">
                {t('onboarding.summary.profileComplete').replace('{{completed}}', String(completedCount)).replace('{{total}}', String(totalCount))}
                {completedCount < totalCount && ` — ${t('onboarding.summary.finishLater')}`}
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

            <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
              <div className="flex items-center gap-3">
                {newTL && <TrafficLightBadge rating={newTL} size="md" />}
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
              <div className="mt-3 rounded-3xl bg-primary-light px-4 py-3">
                <p className="text-sm text-primary">
                  Based on your {HEALTH_LABELS[state.healthState ?? 'healthy']} profile, this food has been reclassified from {oldTL} to {newTL} impact.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned CTA */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        <button
          onClick={handleStart}
          className="w-full rounded-3xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark transition-colors min-h-[52px]"
        >
          {t('onboarding.scanFirst')}
        </button>
      </div>
    </div>
  )
}

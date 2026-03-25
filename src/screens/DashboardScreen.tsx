import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n'
import { useDailyLog, getToday } from '@/hooks/useDailyLog'
import { useStreak } from '@/hooks/useStreak'
import { useSubscription } from '@/hooks/useSubscription'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import TrialBanner from '@/components/TrialBanner'
import DailyGlucoseCurve from '@/components/DailyGlucoseCurve'
import GlucoseScoreHero from '@/components/GlucoseScoreHero'
import MealTimeline from '@/components/MealTimeline'
import PaywallScreen from '@/screens/PaywallScreen'

export default function DashboardScreen() {
  const navigate = useNavigate()
  const { entries, totals, loading, removeEntry } = useDailyLog(getToday())
  const streak = useStreak()
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState<'scan' | 'barcode' | 'text' | 'ai_assistant' | undefined>()
  useSubscription() // keep hook active for trial state
  const { t } = useLanguage()
  const thresholds = useThresholds()

  const scoreTL = totals.averageGL != null
    ? getPersonalizedTrafficLight(totals.averageGL, thresholds)
    : null

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* ── Header: glass nav ── */}
      <header className="glass z-10 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                <circle cx="18" cy="18" r="4" fill="var(--color-primary)" />
                <ellipse cx="18" cy="10" rx="3.5" ry="6" fill="var(--color-primary)" opacity="0.3" />
                <ellipse cx="18" cy="26" rx="3.5" ry="6" fill="var(--color-primary)" opacity="0.3" />
                <ellipse cx="10" cy="18" rx="6" ry="3.5" fill="var(--color-primary)" opacity="0.3" />
                <ellipse cx="26" cy="18" rx="6" ry="3.5" fill="var(--color-primary)" opacity="0.3" />
                <ellipse cx="12.3" cy="12.3" rx="3" ry="5.5" transform="rotate(45 12.3 12.3)" fill="var(--color-primary)" opacity="0.2" />
                <ellipse cx="23.7" cy="12.3" rx="3" ry="5.5" transform="rotate(-45 23.7 12.3)" fill="var(--color-primary)" opacity="0.2" />
                <ellipse cx="12.3" cy="23.7" rx="3" ry="5.5" transform="rotate(-45 12.3 23.7)" fill="var(--color-primary)" opacity="0.2" />
                <ellipse cx="23.7" cy="23.7" rx="3" ry="5.5" transform="rotate(45 23.7 23.7)" fill="var(--color-primary)" opacity="0.2" />
                <circle cx="18" cy="18" r="2" fill="white" opacity="0.6" />
              </svg>
            </div>
            <span className="text-title text-primary italic">Loti</span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center rounded-full p-2.5 text-on-surface-variant hover:bg-surface-container-high min-h-[48px] min-w-[48px] transition-colors"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Streak bar ── */}
      <div className="flex items-center justify-center gap-1.5 px-5 py-1.5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #fff5f5, #faf7f5)' }}>
        {streak.currentStreak > 0 ? (
          <span
            className={`text-body font-semibold text-primary${streak.currentStreak >= 7 ? ' streak-glow' : ''}`}
            aria-label={`Current streak: ${streak.currentStreak} days`}
          >
            {streak.currentStreak >= 30
              ? `🏆 ${t('streak.milestone30')}`
              : streak.currentStreak >= 7
                ? `🎉 ${t('streak.milestone7')}`
                : `🔥 ${t('streak.days').replace('{{count}}', String(streak.currentStreak))}`}
          </span>
        ) : (
          <span className="text-body text-on-surface-variant">{t('streak.start')}</span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Trial Banner */}
          <TrialBanner onUpgrade={() => setPaywallOpen(true)} />

          {/* ── Score Hero ── */}
          <GlucoseScoreHero
            score={totals.averageGL}
            trafficLight={scoreTL}
            entryCount={entries.length}
          />

          {/* ── Daily Glucose Curve ── */}
          <div className="px-5">
            <DailyGlucoseCurve entries={entries} />
          </div>

          {/* ── Meals or Empty State ── */}
          <div className="px-5 mt-6">
            {entries.length > 0 ? (
              <MealTimeline entries={entries} onRemove={removeEntry} />
            ) : (
              /* Empty state: Loti greets */
              <div className="text-center py-8">
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-[44px]" style={{ background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }}>
                  🦎
                </div>
                <p className="mt-4 text-title text-on-surface">{t('dashboard.empty.greeting')}</p>
                <p className="mt-2 text-body text-on-surface-variant max-w-[240px] mx-auto leading-relaxed">
                  {t('dashboard.empty.subtitle')}
                </p>
                <button
                  onClick={() => navigate('/scan')}
                  className="btn-gradient mt-6 px-8 py-3.5 min-h-[48px]"
                >
                  {t('dashboard.empty.cta')}
                </button>
              </div>
            )}
          </div>

          {/* ── Disclaimer ── */}
          <p className="px-6 mt-10 mb-6 text-label text-text-tertiary font-normal normal-case tracking-normal leading-relaxed text-center">
            {t('dashboard.disclaimer')}
          </p>
        </div>
      )}

      {/* Paywall */}
      {paywallOpen && (
        <PaywallScreen
          blockedFeature={paywallFeature}
          onClose={() => { setPaywallOpen(false); setPaywallFeature(undefined) }}
        />
      )}
    </div>
  )
}

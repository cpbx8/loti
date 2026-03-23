import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n'
import { useDailyLog, getToday } from '@/hooks/useDailyLog'
import { useStreak } from '@/hooks/useStreak'
import { useSubscription } from '@/hooks/useSubscription'
import DateNav from '@/components/DateNav'
import TrialBanner from '@/components/TrialBanner'
import AxolotlTip from '@/components/AxolotlTip'
import DailyGlucoseCurve from '@/components/DailyGlucoseCurve'
import FoodLogList from '@/components/FoodLog/FoodLogList'
import SuggestionSheet from '@/components/SuggestionSheet'
import DailyInsight from '@/components/DailyInsight'
import PaywallScreen from '@/screens/PaywallScreen'

function getGreetingKey(): string {
  const h = new Date().getHours()
  if (h < 12) return 'greeting.morning'
  if (h < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

export default function DashboardScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState(() => searchParams.get('date') ?? getToday())
  const { entries, loading, removeEntry, updateServingCount } = useDailyLog(date)
  const streak = useStreak()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState<'scan' | 'barcode' | 'text' | 'ai_assistant' | undefined>()
  const sub = useSubscription()
  const { t } = useLanguage()

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    if (newDate === getToday()) setSearchParams({})
    else setSearchParams({ date: newDate })
  }

  const gatedNavigate = (path: string, feature: 'scan' | 'barcode' | 'text') => {
    const perm = sub.checkScanPermission()
    if (!perm.allowed) {
      setPaywallFeature(feature)
      setPaywallOpen(true)
      return
    }
    navigate(path)
  }

  const openAI = () => {
    const perm = sub.checkScanPermission()
    if (!perm.allowed) {
      setPaywallFeature('ai_assistant')
      setPaywallOpen(true)
      return
    }
    if (!navigator.onLine) {
      alert('Las sugerencias necesitan conexión a internet')
      return
    }
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* ── Header: glass nav with botanical accent ── */}
      <header className="glass sticky top-0 z-10 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Botanical logo mark — stylized leaf/flower */}
            <div className="flex h-9 w-9 items-center justify-center">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                {/* Central flower */}
                <circle cx="18" cy="18" r="4" fill="var(--color-primary)" />
                {/* Petals */}
                <ellipse cx="18" cy="10" rx="3.5" ry="6" fill="var(--color-primary)" opacity="0.3" />
                <ellipse cx="18" cy="26" rx="3.5" ry="6" fill="var(--color-primary)" opacity="0.3" />
                <ellipse cx="10" cy="18" rx="6" ry="3.5" fill="var(--color-primary)" opacity="0.3" />
                <ellipse cx="26" cy="18" rx="6" ry="3.5" fill="var(--color-primary)" opacity="0.3" />
                {/* Diagonal petals */}
                <ellipse cx="12.3" cy="12.3" rx="3" ry="5.5" transform="rotate(45 12.3 12.3)" fill="var(--color-primary)" opacity="0.2" />
                <ellipse cx="23.7" cy="12.3" rx="3" ry="5.5" transform="rotate(-45 23.7 12.3)" fill="var(--color-primary)" opacity="0.2" />
                <ellipse cx="12.3" cy="23.7" rx="3" ry="5.5" transform="rotate(-45 12.3 23.7)" fill="var(--color-primary)" opacity="0.2" />
                <ellipse cx="23.7" cy="23.7" rx="3" ry="5.5" transform="rotate(45 23.7 23.7)" fill="var(--color-primary)" opacity="0.2" />
                {/* Center dot */}
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

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Trial Banner */}
          <TrialBanner onUpgrade={() => setPaywallOpen(true)} />

          {/* ── Date navigation (top) ────────────────── */}
          <div className="mt-2">
            <DateNav date={date} onChange={handleDateChange} />
          </div>

          {/* ── Greeting + Streak Badge ──────────────── */}
          <div className="px-6 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <p className="text-label text-on-surface-variant">{t(getGreetingKey())}</p>
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
                <span className="text-body text-on-surface-variant">
                  {t('streak.start')}
                </span>
              )}
            </div>
            <h1 className="text-headline text-on-surface mt-1">{t('dashboard.summary')}</h1>
          </div>

          {/* ── Glucose Status Card (centerpiece) ─────── */}
          <div className="mt-4">
            <DailyGlucoseCurve entries={entries} />
          </div>

          {/* ── Axolotl Tip ────────────────────────────── */}
          <AxolotlTip />

          {/* ── Escaneos Recientes ─────────────────────── */}
          <div className="px-6 mt-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-headline text-on-surface">{t('dashboard.recent')}</h2>
              {entries.length > 0 && (
                <button
                  onClick={() => navigate('/history')}
                  className="text-label text-primary"
                >
                  {t('dashboard.viewAll')}
                </button>
              )}
            </div>
            <DailyInsight entries={entries} />
            {entries.length > 0 ? (
              <FoodLogList
                entries={entries.slice(0, 3)}
                onRemove={removeEntry}
                onUpdateServing={updateServingCount}
              />
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-text-tertiary">{t('dashboard.noScans')}</p>
              </div>
            )}
          </div>

          {/* ── Disclaimer ─────────────────────────────── */}
          <p className="px-6 mt-10 mb-6 text-label text-text-tertiary font-normal normal-case tracking-normal leading-relaxed">
            {t('dashboard.disclaimer')}
          </p>
        </div>
      )}

      {/* Floating AI button — gradient, ambient shadow */}
      <div className="fixed z-20" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)', right: '20px' }}>
        <button
          onClick={openAI}
          className="btn-gradient flex h-14 w-14 items-center justify-center !p-0 !rounded-full"
          style={{ boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' }}
          aria-label={t('common.aiMealIdeas')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
          </svg>
        </button>
      </div>

      {/* AI Suggestion Sheet */}
      <SuggestionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

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

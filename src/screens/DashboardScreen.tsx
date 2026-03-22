import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDailyLog, getToday } from '@/hooks/useDailyLog'
import { useSubscription } from '@/hooks/useSubscription'
import DateNav from '@/components/DateNav'
import TodaySummaryBar from '@/components/TodaySummaryBar'
import TrialBanner from '@/components/TrialBanner'
import TipCarousel from '@/components/TipCarousel'
import DailyGlucoseCurve from '@/components/DailyGlucoseCurve'
import FoodLogList from '@/components/FoodLog/FoodLogList'
import SuggestionSheet from '@/components/SuggestionSheet'
import PaywallScreen from '@/screens/PaywallScreen'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function DashboardScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState(() => searchParams.get('date') ?? getToday())
  const { entries, loading, removeEntry, updateServingCount } = useDailyLog(date)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState<'scan' | 'barcode' | 'text' | 'ai_assistant' | undefined>()
  const sub = useSubscription()

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
      {/* ── Header: Loti brand + settings ──────────────── */}
      <header className="flex items-center justify-between bg-card px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          {/* Profile avatar placeholder */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-bold text-primary">🦎</span>
          </div>
          <span className="text-lg font-bold text-primary italic">Loti</span>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface min-h-[48px] min-w-[48px]"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Trial Banner */}
          <TrialBanner onUpgrade={() => setPaywallOpen(true)} />

          {/* ── Greeting + Daily Summary heading ──────── */}
          <div className="mx-5 mt-4">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
              {getGreeting()}
            </p>
            <h1 className="text-xl font-bold text-text-primary mt-0.5">Tu resumen diario</h1>
          </div>

          {/* ── Date navigation ────────────────────────── */}
          <div className="mt-3">
            <DateNav date={date} onChange={handleDateChange} />
          </div>

          {/* ── Glucose Status Card (centerpiece) ─────── */}
          <div className="mt-3">
            <DailyGlucoseCurve entries={entries} />
          </div>

          {/* ── Goal Summary Bar (compact) ────────────── */}
          <div className="mt-3">
            <TodaySummaryBar
              entries={entries}
              onScanTap={() => gatedNavigate('/scan', 'scan')}
              onHistoryTap={() => navigate('/history')}
            />
          </div>

          {/* ── Daily Tips ─────────────────────────────── */}
          <div className="mt-5">
            <div className="mx-5 mb-2">
              <h2 className="text-base font-bold text-text-primary">Consejos del día</h2>
            </div>
            <TipCarousel />
          </div>

          {/* ── Recent Scans ───────────────────────────── */}
          <div className="mx-5 mt-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-text-primary">Escaneos recientes</h2>
              {entries.length > 0 && (
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs font-semibold text-primary"
                >
                  VER TODO
                </button>
              )}
            </div>
            {entries.length > 0 ? (
              <FoodLogList
                entries={entries.slice(0, 3)}
                onRemove={removeEntry}
                onUpdateServing={updateServingCount}
              />
            ) : (
              <div className="rounded-2xl bg-card p-5 text-center shadow-sm">
                <p className="text-2xl mb-2">🦎</p>
                <p className="text-sm font-medium text-text-primary">No hay escaneos hoy</p>
                <p className="text-xs text-text-secondary mt-1">
                  Toca el botón + para escanear tu primer alimento
                </p>
              </div>
            )}
          </div>

          {/* ── Disclaimer ─────────────────────────────── */}
          <p className="mx-5 mt-6 mb-4 text-[11px] leading-relaxed text-text-tertiary">
            Loti AI es solo para fines informativos. No sustituye el consejo médico profesional, diagnóstico o tratamiento. Siempre consulta a tu médico antes de hacer cambios en tu plan de manejo de diabetes.
          </p>
        </div>
      )}

      {/* Floating AI button — bottom right, above tab bar */}
      <div className="fixed z-20" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)', right: '20px' }}>
        <button
          onClick={openAI}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-90 transition-transform"
          aria-label="Ideas de comida con IA"
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

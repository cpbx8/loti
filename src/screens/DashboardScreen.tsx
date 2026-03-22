import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDailyLog, getToday } from '@/hooks/useDailyLog'
import { useSubscription } from '@/hooks/useSubscription'
import DateNav from '@/components/DateNav'
import TodaySummaryBar from '@/components/TodaySummaryBar'
import StreakBadge from '@/components/StreakBadge'
import TrialBanner from '@/components/TrialBanner'
import TipCarousel from '@/components/TipCarousel'
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
      alert('Food suggestions need an internet connection')
      return
    }
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between bg-card px-5 py-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-secondary">{getGreeting()}</p>
            <StreakBadge />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Escanear</h1>
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

          {/* Scan Options — 3 large buttons */}
          <div className="mx-5 mt-4 space-y-3">
            <button
              onClick={() => gatedNavigate('/scan', 'scan')}
              className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-md min-h-[48px] active:opacity-85 active:scale-[0.98] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-text-primary">Tomar foto</p>
                <p className="text-xs text-text-secondary">Escanea tu comida con la cámara</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => gatedNavigate('/barcode', 'barcode')}
              className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-md min-h-[48px] active:opacity-85 active:scale-[0.98] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h3v16H3V4zm5 0h1v16H8V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h3v16h-3V4z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-text-primary">Código de barras</p>
                <p className="text-xs text-text-secondary">Buscar producto empaquetado</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => gatedNavigate('/text', 'text')}
              className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-md min-h-[48px] active:opacity-85 active:scale-[0.98] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-text-primary">Buscar alimento</p>
                <p className="text-xs text-text-secondary">Escribe el nombre de tu comida</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* AI Suggestions button */}
          <div className="mx-5 mt-3">
            <button
              onClick={openAI}
              className="flex w-full items-center gap-4 rounded-2xl bg-primary/5 border border-primary/20 p-4 min-h-[48px] active:opacity-85 active:scale-[0.98] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-primary">Ideas de comida con IA</p>
                <p className="text-xs text-text-secondary">Sugerencias personalizadas</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Tip Carousel */}
          <TipCarousel />

          {/* Date navigation + Today's summary */}
          <div className="mt-5">
            <DateNav date={date} onChange={handleDateChange} />
            <TodaySummaryBar
              entries={entries}
              onScanTap={() => gatedNavigate('/scan', 'scan')}
              onHistoryTap={() => navigate('/history')}
            />
          </div>

          {/* Recent Scans */}
          {entries.length > 0 && (
            <div className="mx-5 mt-3">
              <p className="text-sm font-semibold text-text-primary mb-2">Escaneos recientes</p>
              <FoodLogList entries={entries} onRemove={removeEntry} onUpdateServing={updateServingCount} />
            </div>
          )}

          {/* Disclaimer */}
          <p className="mx-5 mt-6 mb-4 text-[11px] leading-relaxed text-text-tertiary">
            Loti AI es solo para fines informativos. No sustituye el consejo médico profesional, diagnóstico o tratamiento. Siempre consulta a tu médico antes de hacer cambios en tu plan de manejo de diabetes.
          </p>
        </div>
      )}

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

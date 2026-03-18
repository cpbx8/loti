import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDailyLog, getToday } from '@/hooks/useDailyLog'
import DateNav from '@/components/DateNav'
import TodaySummaryBar from '@/components/TodaySummaryBar'
import TipCarousel from '@/components/TipCarousel'
import TrafficLightExplainer from '@/components/TrafficLightExplainer'
import FoodLogList from '@/components/FoodLog/FoodLogList'
import SuggestionSheet from '@/components/SuggestionSheet'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState(() => searchParams.get('date') ?? getToday())
  const { entries, loading, removeEntry, updateServingCount } = useDailyLog(date)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    if (newDate === getToday()) setSearchParams({})
    else setSearchParams({ date: newDate })
  }

  const openScan = () => navigate('/scan')

  return (
    <div className="flex flex-1 flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between bg-card px-5 py-3 border-b border-border">
        <div>
          <p className="text-sm text-text-secondary">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-text-primary">Loti</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface min-h-[44px] min-w-[44px]"
            aria-label="History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/favorites')}
            className="flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-primary min-h-[44px] min-w-[44px]"
            aria-label="Favorites"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface min-h-[44px] min-w-[44px]"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Date navigation */}
      <DateNav date={date} onChange={handleDateChange} />

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-28">
          {/* Section 1: Today's Summary Bar */}
          <TodaySummaryBar
            entries={entries}
            onScanTap={openScan}
            onHistoryTap={() => navigate('/history')}
          />

          {/* Section 2: Tip Carousel */}
          <TipCarousel />

          {/* Search bar */}
          <button
            onClick={() => navigate('/search')}
            className="mx-5 mt-3 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-text-tertiary min-h-[44px] shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search or type what you ate...
          </button>

          {/* Section 3: Recent Scans or Explainer */}
          {entries.length === 0 ? (
            <TrafficLightExplainer onScanTap={openScan} />
          ) : (
            <div className="mx-5 mt-3">
              <p className="text-sm font-semibold text-text-primary mb-2">Recent Scans</p>
              <FoodLogList entries={entries} onRemove={removeEntry} onUpdateServing={updateServingCount} />
            </div>
          )}
        </div>
      )}

      {/* OXXO floating button — bottom left */}
      <button
        onClick={() => navigate('/store-guide/oxxo')}
        className="fixed bottom-6 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#8B0000] text-[#F2CD00] shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="OXXO Guide"
      >
        <span className="text-[11px] font-black tracking-tighter leading-none">OXXO</span>
      </button>

      {/* Camera scan — center bottom */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="mx-auto max-w-[430px] flex justify-center pb-4">
          <button
            onClick={openScan}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            aria-label="Scan food"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* AI Ideas floating button — bottom right */}
      <button
        onClick={() => {
          if (!navigator.onLine) {
            alert('Food suggestions need an internet connection')
            return
          }
          setSheetOpen(true)
        }}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="AI food ideas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
        </svg>
      </button>

      {/* AI Suggestion Sheet */}
      <SuggestionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}

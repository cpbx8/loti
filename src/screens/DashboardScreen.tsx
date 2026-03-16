import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDailyLog, getToday } from '@/hooks/useDailyLog'
import MacroSummary from '@/components/MacroSummary/MacroSummary'
import FoodLogList from '@/components/FoodLog/FoodLogList'
import DateNav from '@/components/DateNav'

export default function DashboardScreen() {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState(() => searchParams.get('date') ?? getToday())
  const { totals, entries, loading } = useDailyLog(date)

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    const today = getToday()
    if (newDate === today) {
      setSearchParams({})
    } else {
      setSearchParams({ date: newDate })
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/favorites')}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-yellow-400"
            aria-label="Favorites"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Date navigation */}
      <DateNav date={date} onChange={handleDateChange} />

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
        </div>
      ) : (
        <>
          {/* Macro summary (always shown) */}
          <MacroSummary totals={totals} />

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Food log */}
          <FoodLogList entries={entries} />

          {/* Spacer for FAB */}
          <div className="h-20" />
        </>
      )}

      {/* Action FABs */}
      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-3">
        <button
          onClick={() => navigate('/text')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-gray-300 shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Text input"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/scan')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Scan food"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/barcode')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-gray-300 shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Scan barcode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h1v16h-1V4zm3 0h2v16h-2V4z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeeklyHistory, getToday, shiftDate, displayDate } from '@/hooks/useDailyLog'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import type { TrafficLight } from '@/types/shared'

function getEntryTL(e: FoodLogEntry, thresholds: { greenMax: number; yellowMax: number }): TrafficLight {
  if (e.glycemic_load != null) return getPersonalizedTrafficLight(e.glycemic_load, thresholds)
  return e.result_traffic_light ?? 'yellow'
}

export default function HistoryScreen() {
  const navigate = useNavigate()
  const thresholds = useThresholds()
  const [weekEnd, setWeekEnd] = useState(getToday())
  const { days, loading, daysLogged } = useWeeklyHistory(weekEnd)

  const weekStart = shiftDate(weekEnd, -6)
  const canGoForward = weekEnd !== getToday()

  const goBack = () => setWeekEnd(shiftDate(weekEnd, -7))
  const goForward = () => { if (canGoForward) setWeekEnd(shiftDate(weekEnd, 7)) }

  // Compute weekly GI stats from all entries
  const allEntries = days.flatMap(d => {
    // We need entries — load them from localStorage for each day
    const LOG_KEY = 'loti_food_log'
    try {
      const raw = localStorage.getItem(LOG_KEY)
      const entries: FoodLogEntry[] = raw ? JSON.parse(raw) : []
      return entries.filter(e => e.created_at.startsWith(d.date))
    } catch { return [] }
  })

  const weekGreen = allEntries.filter(e => getEntryTL(e, thresholds) === 'green').length
  const weekYellow = allEntries.filter(e => getEntryTL(e, thresholds) === 'yellow').length
  const weekRed = allEntries.filter(e => getEntryTL(e, thresholds) === 'red').length
  const weekTotal = allEntries.length

  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="glass flex items-center px-5 py-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-title text-on-surface">Historial</h1>
      </header>

      {/* Week navigator */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <button onClick={goBack} className="rounded-lg p-2 text-text-secondary hover:bg-surface min-h-[44px] min-w-[44px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="text-sm font-medium text-text-primary">
          {displayDate(weekStart)} — {displayDate(weekEnd)}
        </p>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className={`rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center ${canGoForward ? 'text-text-secondary hover:bg-surface' : 'text-disabled cursor-default'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5">
          {/* Weekly GI breakdown */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">Weekly Impact</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-card p-3 shadow-sm text-center">
                <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-tl-green-fill" />
                <p className="text-2xl font-bold text-text-primary">{weekGreen}</p>
                <p className="text-xs text-text-secondary">Green</p>
              </div>
              <div className="rounded-2xl bg-card p-3 shadow-sm text-center">
                <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-tl-yellow-fill" />
                <p className="text-2xl font-bold text-text-primary">{weekYellow}</p>
                <p className="text-xs text-text-secondary">Yellow</p>
              </div>
              <div className="rounded-2xl bg-card p-3 shadow-sm text-center">
                <div className="mx-auto mb-1 h-3 w-3 rounded-full bg-tl-red-fill" />
                <p className="text-2xl font-bold text-text-primary">{weekRed}</p>
                <p className="text-xs text-text-secondary">Red</p>
              </div>
            </div>
            {/* Proportional bar */}
            {weekTotal > 0 && (
              <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full">
                {weekGreen > 0 && <div className="bg-tl-green-fill" style={{ width: `${(weekGreen / weekTotal) * 100}%` }} />}
                {weekYellow > 0 && <div className="bg-tl-yellow-fill" style={{ width: `${(weekYellow / weekTotal) * 100}%` }} />}
                {weekRed > 0 && <div className="bg-tl-red-fill" style={{ width: `${(weekRed / weekTotal) * 100}%` }} />}
              </div>
            )}
          </div>

          {/* Daily GI bars */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">Daily Breakdown</p>
            <div className="flex items-end gap-1.5 h-28">
              {days.map(day => {
                const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })
                const count = day.totals.scan_count

                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-text-tertiary">
                      {count > 0 ? count : ''}
                    </span>
                    <DayBar date={day.date} thresholds={thresholds} />
                    <span className="text-xs text-text-tertiary">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* This week summary */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">This Week</p>
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-text-primary">{daysLogged}</p>
                  <p className="text-sm text-text-secondary">days logged this week</p>
                </div>
                <div className="flex gap-1">
                  {days.map(day => (
                    <div
                      key={day.date}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                        day.totals.scan_count > 0
                          ? 'bg-primary-light text-primary font-medium'
                          : 'bg-surface text-text-tertiary'
                      }`}
                    >
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Day-by-day breakdown */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">Day by Day</p>
            <div className="space-y-2">
              {[...days].reverse().map(day => {
                const dayEntries = getDayEntries(day.date)
                const green = dayEntries.filter(e => getEntryTL(e, thresholds) === 'green').length
                const yellow = dayEntries.filter(e => getEntryTL(e, thresholds) === 'yellow').length
                const red = dayEntries.filter(e => getEntryTL(e, thresholds) === 'red').length

                return (
                  <button
                    key={day.date}
                    onClick={() => navigate(`/?date=${day.date}`)}
                    className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 text-left shadow-sm hover:shadow-md transition-shadow min-h-[44px]"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{displayDate(day.date)}</p>
                      <p className="text-xs text-text-tertiary">
                        {day.totals.scan_count > 0
                          ? `${day.totals.scan_count} items logged`
                          : 'No meals logged'}
                      </p>
                    </div>
                    {day.totals.scan_count > 0 && (
                      <div className="flex items-center gap-1.5">
                        {green > 0 && <span className="flex items-center gap-0.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-tl-green-fill" />{green}</span>}
                        {yellow > 0 && <span className="flex items-center gap-0.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-tl-yellow-fill" />{yellow}</span>}
                        {red > 0 && <span className="flex items-center gap-0.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-tl-red-fill" />{red}</span>}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Load entries for a specific date from localStorage */
function getDayEntries(date: string): FoodLogEntry[] {
  try {
    const raw = localStorage.getItem('loti_food_log')
    const entries: FoodLogEntry[] = raw ? JSON.parse(raw) : []
    return entries.filter(e => e.created_at.startsWith(date))
  } catch { return [] }
}

/** Stacked GI bar for a single day */
function DayBar({ date, thresholds }: { date: string; thresholds: { greenMax: number; yellowMax: number } }) {
  const entries = getDayEntries(date)
  const total = entries.length
  if (total === 0) {
    return <div className="w-full rounded-t bg-border" style={{ height: '4px' }} />
  }

  const green = entries.filter(e => getEntryTL(e, thresholds) === 'green').length
  const yellow = entries.filter(e => getEntryTL(e, thresholds) === 'yellow').length
  const red = entries.filter(e => getEntryTL(e, thresholds) === 'red').length

  // Scale: max 6 items = full height (72px)
  const scale = Math.min(total / 6, 1)
  const barH = Math.max(scale * 72, 8)

  return (
    <div className="flex w-full flex-col justify-end overflow-hidden rounded-t" style={{ height: '72px' }}>
      <div className="flex flex-col w-full" style={{ height: `${barH}px` }}>
        {green > 0 && <div className="bg-tl-green-fill" style={{ flex: green }} />}
        {yellow > 0 && <div className="bg-tl-yellow-fill" style={{ flex: yellow }} />}
        {red > 0 && <div className="bg-tl-red-fill" style={{ flex: red }} />}
      </div>
    </div>
  )
}

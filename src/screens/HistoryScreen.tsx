import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeeklyHistory, getToday, shiftDate, displayDate } from '@/hooks/useDailyLog'
import { DEFAULT_GOALS } from '@/lib/constants'

export default function HistoryScreen() {
  const navigate = useNavigate()
  const [weekEnd, setWeekEnd] = useState(getToday())
  const { days, loading, averages, daysLogged } = useWeeklyHistory(weekEnd)

  const weekStart = shiftDate(weekEnd, -6)
  const canGoForward = weekEnd !== getToday()

  const goBack = () => setWeekEnd(shiftDate(weekEnd, -7))
  const goForward = () => { if (canGoForward) setWeekEnd(shiftDate(weekEnd, 7)) }

  // Find max calories in the week for bar scaling
  const maxCal = Math.max(...days.map(d => d.totals.total_calories), DEFAULT_GOALS.calories)

  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-text-primary">History</h1>
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
          {/* Weekly calorie bars */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">Daily Calories</p>
            <div className="flex items-end gap-1.5 h-32">
              {days.map(day => {
                const pct = maxCal > 0 ? (day.totals.total_calories / maxCal) * 100 : 0
                const isGoalDay = day.totals.total_calories > 0 && day.totals.total_calories <= DEFAULT_GOALS.calories
                const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })

                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-text-tertiary">
                      {day.totals.total_calories > 0 ? day.totals.total_calories : ''}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                      <div
                        className={`w-full rounded-t ${
                          day.totals.scan_count === 0 ? 'bg-border' :
                          isGoalDay ? 'bg-primary' : 'bg-error'
                        }`}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-tertiary">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" /> Under goal
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-error" /> Over goal
              </span>
            </div>
          </div>

          {/* Weekly averages */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">Weekly Averages</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Avg Calories" value={averages.avgCalories} unit="kcal" />
              <StatCard label="Avg Protein" value={averages.avgProtein} unit="g" />
              <StatCard label="Avg Carbs" value={averages.avgCarbs} unit="g" />
              <StatCard label="Avg Fat" value={averages.avgFat} unit="g" />
            </div>
          </div>

          {/* This week summary */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">This Week</p>
            <div className="rounded-xl bg-card p-4 shadow-sm">
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
              {[...days].reverse().map(day => (
                <button
                  key={day.date}
                  onClick={() => navigate(`/?date=${day.date}`)}
                  className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3 text-left shadow-sm hover:shadow-md transition-shadow min-h-[44px]"
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
                    <p className="text-sm font-medium text-text-primary">{day.totals.total_calories} kcal</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-lg font-bold text-text-primary">
        {value}<span className="text-sm font-normal text-text-tertiary"> {unit}</span>
      </p>
    </div>
  )
}

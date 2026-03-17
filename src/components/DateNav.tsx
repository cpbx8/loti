import { displayDate, isToday, shiftDate } from '@/hooks/useDailyLog'

interface Props {
  date: string
  onChange: (date: string) => void
}

export default function DateNav({ date, onChange }: Props) {
  const today = isToday(date)

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
      <button
        onClick={() => onChange(shiftDate(date, -1))}
        className="rounded-lg p-2 text-text-secondary hover:bg-surface min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Previous day"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => { if (!today) onChange(shiftDate(date, 0)) }}
        className="text-sm font-medium text-text-primary"
      >
        {displayDate(date)}
      </button>

      <button
        onClick={() => { if (!today) onChange(shiftDate(date, 1)) }}
        className={`rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center ${today ? 'text-disabled cursor-default' : 'text-text-secondary hover:bg-surface'}`}
        disabled={today}
        aria-label="Next day"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

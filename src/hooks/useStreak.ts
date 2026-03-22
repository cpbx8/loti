/**
 * Streak tracking — computed from SQLite scan_logs (local-first).
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDistinctScanDates } from '@/db/queries'
import { formatDate, shiftDate } from './useDailyLog'

interface StreakData {
  currentStreak: number
  longestStreak: number
  loggedToday: boolean
}

export function useStreak(): StreakData {
  const query = useQuery({
    queryKey: ['streak'],
    queryFn: () => getDistinctScanDates(90),
    staleTime: 1000 * 60,
  })

  return useMemo(() => {
    const dates = query.data
    if (!dates || dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, loggedToday: false }
    }

    const datesWithEntries = new Set(dates)
    const today = formatDate(new Date())
    const loggedToday = datesWithEntries.has(today)

    let current = 0
    const checkDate = loggedToday ? today : shiftDate(today, -1)

    if (!loggedToday && !datesWithEntries.has(shiftDate(today, -1))) {
      return { currentStreak: 0, longestStreak: computeLongest(datesWithEntries), loggedToday }
    }

    let d = checkDate
    while (datesWithEntries.has(d)) {
      current++
      d = shiftDate(d, -1)
    }

    const longest = Math.max(current, computeLongest(datesWithEntries))
    return { currentStreak: current, longestStreak: longest, loggedToday }
  }, [query.data])
}

function computeLongest(dates: Set<string>): number {
  if (dates.size === 0) return 0

  const sorted = Array.from(dates).sort()
  let longest = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00')
    const curr = new Date(sorted[i] + 'T12:00:00')
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

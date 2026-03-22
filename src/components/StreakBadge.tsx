import { useStreak } from '@/hooks/useStreak'

const MILESTONES = [7, 14, 30, 60, 100]

export default function StreakBadge() {
  const { currentStreak, loggedToday } = useStreak()

  if (currentStreak === 0 && !loggedToday) return null

  const isMilestone = MILESTONES.includes(currentStreak)
  const active = currentStreak > 0

  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
      active
        ? isMilestone
          ? 'bg-tl-yellow-bg text-tl-yellow-fill animate-pulse'
          : 'bg-primary-light text-primary'
        : 'bg-surface text-text-tertiary'
    }`}>
      <span className="text-base leading-none">{active ? '🔥' : '💤'}</span>
      {active ? (
        <span>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
      ) : (
        <span>Log to start streak</span>
      )}
    </div>
  )
}

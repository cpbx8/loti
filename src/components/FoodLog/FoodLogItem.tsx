import type { FoodLogEntry } from '@/hooks/useDailyLog'

interface Props {
  entry: FoodLogEntry
}

const trafficDot: Record<string, string> = {
  green: 'bg-tl-green-fill',
  yellow: 'bg-tl-yellow-fill',
  red: 'bg-tl-red-fill',
}

export default function FoodLogItem({ entry }: Props) {
  const time = new Date(entry.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-card">
      {/* Traffic light dot */}
      <div
        className={`h-3 w-3 flex-shrink-0 rounded-full ${
          entry.result_traffic_light ? trafficDot[entry.result_traffic_light] : 'bg-disabled'
        }`}
      />

      {/* Food info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">
          {entry.food_name ?? 'Unknown'}
        </p>
        <p className="text-xs text-text-tertiary">{time}</p>
      </div>

      {/* Calories */}
      <span className="text-sm font-medium text-text-primary">
        {entry.calories_kcal ?? '--'} kcal
      </span>
    </div>
  )
}

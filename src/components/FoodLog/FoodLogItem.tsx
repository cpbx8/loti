import type { FoodLogEntry } from '@/hooks/useDailyLog'

interface Props {
  entry: FoodLogEntry
}

const trafficDot: Record<string, string> = {
  green: 'bg-gl-green',
  yellow: 'bg-gl-yellow',
  red: 'bg-gl-red',
}

export default function FoodLogItem({ entry }: Props) {
  const time = new Date(entry.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Traffic light dot */}
      <div
        className={`h-3 w-3 flex-shrink-0 rounded-full ${
          entry.result_traffic_light ? trafficDot[entry.result_traffic_light] : 'bg-gray-500'
        }`}
      />

      {/* Food info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {entry.food_name ?? 'Unknown'}
        </p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>

      {/* Calories */}
      <span className="text-sm font-medium text-gray-300">
        {entry.calories_kcal ?? '—'} kcal
      </span>
    </div>
  )
}

interface Props {
  label: string
  value: number
  goal: number
  color: string
}

export default function MacroBar({ label, value, goal, color }: Props) {
  const percent = Math.min((value / goal) * 100, 100)

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 shrink-0 text-xs text-text-secondary">{label}</span>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-right text-xs text-text-primary">
        {value}/{goal}g
      </span>
    </div>
  )
}

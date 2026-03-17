/**
 * TrafficLightBadge — the most important visual element.
 * Filled circle with traffic light color, white icon inside.
 * Colorblind-safe: always includes a shape icon (checkmark/triangle/circle).
 * Traffic light colors are SACRED and used ONLY for GI ratings.
 */

type Rating = 'green' | 'yellow' | 'red'
type Size = 'sm' | 'md' | 'lg'

interface TrafficLightBadgeProps {
  rating: Rating
  size?: Size
  showIcon?: boolean
  animated?: boolean
}

const RATING_CONFIG: Record<Rating, { bg: string; label: string }> = {
  green:  { bg: 'bg-tl-green-fill',  label: 'Low Impact' },
  yellow: { bg: 'bg-tl-yellow-fill', label: 'Moderate' },
  red:    { bg: 'bg-tl-red-fill',    label: 'High Impact' },
}

const SIZE_MAP: Record<Size, { px: number; iconClass: string }> = {
  sm: { px: 32, iconClass: 'h-4 w-4' },
  md: { px: 48, iconClass: 'h-6 w-6' },
  lg: { px: 80, iconClass: 'h-10 w-10' },
}

/** Checkmark icon for green (low impact) */
function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

/** Triangle/warning icon for yellow (moderate) */
function TriangleIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

/** Circle/stop icon for red (high impact) */
function CircleIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6" />
      <path d="M9 9l6 6" />
    </svg>
  )
}

const ICON_MAP: Record<Rating, (props: { className: string }) => JSX.Element> = {
  green: CheckIcon,
  yellow: TriangleIcon,
  red: CircleIcon,
}

export default function TrafficLightBadge({
  rating,
  size = 'md',
  showIcon = true,
  animated = false,
}: TrafficLightBadgeProps) {
  const config = RATING_CONFIG[rating]
  const sizeConfig = SIZE_MAP[size]
  const Icon = ICON_MAP[rating]

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex items-center justify-center rounded-full ${config.bg} ${animated ? 'animate-pulse' : ''}`}
        style={{ width: sizeConfig.px, height: sizeConfig.px }}
      >
        {showIcon && <Icon className={`${sizeConfig.iconClass} text-white`} />}
      </div>
      {size === 'lg' && (
        <span className="text-sm font-medium text-text-primary">{config.label}</span>
      )}
    </div>
  )
}

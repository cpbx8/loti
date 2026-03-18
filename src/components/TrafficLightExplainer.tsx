/**
 * TrafficLightExplainer — empty-state education card.
 * Teaches the traffic light concept when no meals are logged.
 */
import TrafficLightBadge from './TrafficLightBadge'

interface Props {
  onScanTap: () => void
}

export default function TrafficLightExplainer({ onScanTap }: Props) {
  return (
    <div className="mx-5 mt-3 rounded-xl bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-text-primary mb-4">How Loti works</p>

      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <TrafficLightBadge rating="green" size="sm" />
          <div>
            <p className="text-sm font-medium text-text-primary">Green — Low impact</p>
            <p className="text-xs text-text-secondary">Eat freely</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TrafficLightBadge rating="yellow" size="sm" />
          <div>
            <p className="text-sm font-medium text-text-primary">Yellow — Moderate impact</p>
            <p className="text-xs text-text-secondary">Be mindful of portions</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TrafficLightBadge rating="red" size="sm" />
          <div>
            <p className="text-sm font-medium text-text-primary">Red — High impact</p>
            <p className="text-xs text-text-secondary">Consider a swap</p>
          </div>
        </div>
      </div>

      <button
        onClick={onScanTap}
        className="mt-4 text-sm font-medium text-primary"
      >
        Scan your first meal to see it in action ↓
      </button>
    </div>
  )
}

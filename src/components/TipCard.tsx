/**
 * TipCard — educational card for the home screen carousel.
 * 5 visual variants: mythbuster, swap, modifier, featured_food, did_you_know.
 */
import type { TipCard as TipCardData } from '@/data/tipCards'
import TrafficLightBadge from './TrafficLightBadge'

const TYPE_LABELS: Record<TipCardData['type'], string> = {
  mythbuster: 'MITO',
  swap: 'INTERCAMBIO',
  modifier: 'HÁBITO ACTIVO',
  featured_food: 'NUTRICIÓN',
  did_you_know: '¿SABÍAS QUE?',
}

const MODIFIER_EMOJIS: Record<string, string> = {
  'Add lime to your tacos': '🍋',
  'Add nopales to any dish': '🌵',
  'Eat your protein before the carbs': '🥩',
  "Reheat yesterday's tortillas": '🫓',
}

export default function TipCard({ tip }: { tip: TipCardData }) {
  const typeLabel = TYPE_LABELS[tip.type]

  return (
    <div className={`flex min-h-[180px] w-full flex-col justify-between rounded-2xl p-5 shadow-md ${getCardBg(tip)}`}>
      <div>
        {/* Type label */}
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          {typeLabel}
        </p>

        {/* Traffic light transition (mythbuster/swap) */}
        {tip.trafficLights && (tip.type === 'mythbuster' || tip.type === 'swap') && (
          <div className="flex items-center gap-2 mb-2">
            {tip.trafficLights.before && (
              <TrafficLightBadge rating={tip.trafficLights.before} size="sm" />
            )}
            {tip.trafficLights.after && (
              <>
                <span className="text-text-tertiary">→</span>
                <TrafficLightBadge rating={tip.trafficLights.after} size="sm" />
              </>
            )}
          </div>
        )}

        {/* Featured food badge */}
        {tip.type === 'featured_food' && tip.trafficLights?.before && (
          <div className="flex items-center gap-2 mb-2">
            <TrafficLightBadge rating={tip.trafficLights.before} size="sm" />
            {tip.gl != null && (
              <span className="text-sm text-text-secondary">GL: {tip.gl}</span>
            )}
          </div>
        )}

        {/* Modifier emoji */}
        {tip.type === 'modifier' && (
          <p className="text-lg mb-1">{MODIFIER_EMOJIS[tip.headline] ?? '💡'}</p>
        )}

        {/* Headline */}
        <p className="text-base font-semibold text-text-primary leading-snug">
          {tip.headline}
        </p>

        {/* Body */}
        <p className="text-sm text-text-secondary mt-1 leading-snug">
          {tip.body}
        </p>
      </div>

      {/* Source */}
      {tip.source && (
        <p className="text-xs text-text-tertiary mt-auto pt-1">{tip.source}</p>
      )}
    </div>
  )
}

function getCardBg(_tip: TipCardData): string {
  // Uniform card color for all carousel cards
  return 'bg-card'
}

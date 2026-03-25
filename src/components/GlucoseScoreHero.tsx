/**
 * GlucoseScoreHero — big score number + mood phrase.
 * The "weather forecast" for your glucose today.
 */
import type { TrafficLight } from '@/types/shared'
import { useLanguage } from '@/lib/i18n'

const MOOD_KEYS: Record<string, string[]> = {
  green:  ['dashboard.mood.green.1', 'dashboard.mood.green.2', 'dashboard.mood.green.3'],
  yellow: ['dashboard.mood.yellow.1', 'dashboard.mood.yellow.2'],
  red:    ['dashboard.mood.red.1'],
}

const PILL_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  green:  { bg: 'bg-tl-green-bg',  text: 'text-tl-green-fill', dot: 'bg-tl-green-fill' },
  yellow: { bg: 'bg-tl-yellow-bg', text: 'text-tl-yellow-fill', dot: 'bg-tl-yellow-fill' },
  red:    { bg: 'bg-tl-red-bg',    text: 'text-tl-red-fill',    dot: 'bg-tl-red-fill' },
}

interface Props {
  score: number | null
  trafficLight: TrafficLight | null
  entryCount: number
}

export default function GlucoseScoreHero({ score, trafficLight, entryCount }: Props) {
  const { t } = useLanguage()

  const hasData = score != null && trafficLight != null
  const pill = hasData ? PILL_STYLE[trafficLight!] : null
  const moodKeys = hasData ? MOOD_KEYS[trafficLight!] ?? [] : []
  const moodKey = moodKeys.length > 0 ? moodKeys[entryCount % moodKeys.length] : null

  return (
    <div
      className="text-center py-6"
      aria-label={hasData ? `Today's average glucose load is ${Math.round(score!)}, status: ${t(moodKey!)}` : t('dashboard.mood.empty')}
    >
      <p className="text-label text-on-surface-variant">{t('dashboard.hero.label')}</p>

      <div className="mt-3 mb-2">
        {hasData ? (
          <span className="text-display text-on-surface">{Math.round(score!)}</span>
        ) : (
          <span className="text-display text-disabled">—</span>
        )}
      </div>

      {hasData && pill ? (
        <div className={`inline-flex items-center gap-1.5 rounded-full ${pill.bg} px-3.5 py-1.5`}>
          <div className={`h-2 w-2 rounded-full ${pill.dot}`} />
          <span className={`text-label ${pill.text}`}>{t(moodKey!)}</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3.5 py-1.5">
          <span className="text-label text-on-surface-variant">{t('dashboard.mood.empty')}</span>
        </div>
      )}
    </div>
  )
}

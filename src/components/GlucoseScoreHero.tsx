/**
 * GlucoseScoreHero — estimated glucose level + mood phrase.
 * Shows the user's current estimated blood glucose in mg/dL,
 * computed from today's meals via the glucose simulation model.
 */
import { useMemo } from 'react'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useProfile } from '@/hooks/useProfile'
import { useLanguage } from '@/lib/i18n'
import { computeDailyGlucose } from '@/lib/glucoseModel'

const MOOD_KEYS: Record<string, string[]> = {
  stable:   ['dashboard.mood.green.1', 'dashboard.mood.green.2', 'dashboard.mood.green.3'],
  elevated: ['dashboard.mood.yellow.1', 'dashboard.mood.yellow.2'],
  high:     ['dashboard.mood.red.1'],
}

const PILL_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  stable:   { bg: 'bg-tl-green-bg',  text: 'text-tl-green-fill', dot: 'bg-tl-green-fill' },
  elevated: { bg: 'bg-tl-yellow-bg', text: 'text-tl-yellow-fill', dot: 'bg-tl-yellow-fill' },
  high:     { bg: 'bg-tl-red-bg',    text: 'text-tl-red-fill',    dot: 'bg-tl-red-fill' },
}

interface Props {
  entries: FoodLogEntry[]
}

export default function GlucoseScoreHero({ entries }: Props) {
  const { t } = useLanguage()
  const { profile } = useProfile()
  const healthState = profile?.health_state || 'healthy'

  const result = useMemo(
    () => computeDailyGlucose(entries, healthState),
    [entries, healthState]
  )

  const hasData = entries.some(e => e.glycemic_load != null && e.glycemic_load > 0)
  const pill = PILL_STYLE[result.status]
  const moodKeys = MOOD_KEYS[result.status] ?? []
  const moodKey = moodKeys.length > 0 ? moodKeys[entries.length % moodKeys.length] : null

  return (
    <div
      className="text-center py-6"
      aria-label={hasData
        ? `Estimated glucose is ${result.currentEstimate} mg/dL, status: ${t(moodKey!)}`
        : t('dashboard.mood.empty')
      }
    >
      <p className="text-label text-on-surface-variant">{t('dashboard.hero.label')}</p>

      <div className="mt-3 mb-2">
        {hasData ? (
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-display text-on-surface">{result.currentEstimate}</span>
            <span className="text-label text-text-tertiary font-normal normal-case tracking-normal">mg/dL</span>
          </div>
        ) : (
          <span className="text-display text-disabled">—</span>
        )}
      </div>

      {hasData && pill && moodKey ? (
        <div className={`inline-flex items-center gap-1.5 rounded-full ${pill.bg} px-3.5 py-1.5`}>
          <div className={`h-2 w-2 rounded-full ${pill.dot}`} />
          <span className={`text-label ${pill.text}`}>{t(moodKey)}</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3.5 py-1.5">
          <span className="text-label text-on-surface-variant">{t('dashboard.mood.empty')}</span>
        </div>
      )}
    </div>
  )
}

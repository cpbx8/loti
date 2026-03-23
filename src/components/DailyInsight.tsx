/**
 * Daily insight — one smart sentence derived from today's food log.
 * Placed after the glucose curve on the dashboard.
 */

import { useMemo } from 'react'
import { useLanguage } from '@/lib/i18n'
import type { FoodLogEntry } from '@/hooks/useDailyLog'

interface Props {
  entries: FoodLogEntry[]
}

export default function DailyInsight({ entries }: Props) {
  const { t } = useLanguage()

  const insight = useMemo(() => {
    if (entries.length === 0) return null

    const greenCount = entries.filter(e => e.result_traffic_light === 'green').length
    const redCount = entries.filter(e => e.result_traffic_light === 'red').length
    const total = entries.length

    if (total === 1) {
      return { text: t('insight.greatStart'), highlight: false }
    }

    if (greenCount === total) {
      return { text: t('insight.allGreen'), highlight: true }
    }

    if (redCount === total) {
      return { text: t('insight.encourageGreen'), highlight: false }
    }

    if (greenCount > 0) {
      return {
        text: t('insight.greenCount').replace('{{count}}', String(greenCount)),
        highlight: true,
        greenCount,
      }
    }

    return { text: t('insight.encourageGreen'), highlight: false }
  }, [entries, t])

  if (!insight) return null

  return (
    <div className="mb-3 py-1">
      <p className="text-body text-on-surface-variant">
        {insight.highlight && insight.greenCount ? (
          <>
            <span className="font-semibold text-tl-green-fill">{insight.greenCount}</span>
            {' '}{t('insight.greenCount').replace('{{count}} ', '').replace(`${insight.greenCount}`, '')}
          </>
        ) : (
          insight.text
        )}
      </p>
    </div>
  )
}

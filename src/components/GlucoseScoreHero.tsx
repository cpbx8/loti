/**
 * GlucoseScoreHero — estimated glucose level + mood phrase.
 * Shows the user's current estimated blood glucose in mg/dL,
 * computed from today's meals via the glucose simulation model.
 * When no meals are logged, shows fasting baseline with info button.
 */
import { useState, useMemo } from 'react'
import type { FoodLogEntry } from '@/hooks/useDailyLog'
import { useProfile } from '@/hooks/useProfile'
import { useThresholds } from '@/hooks/useThresholds'
import { useLanguage } from '@/lib/i18n'
import { computeDailyGlucose, getFastingBaseline } from '@/lib/glucoseModel'

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
  const thresholds = useThresholds()
  const healthState = profile?.health_state || 'healthy'
  const a1c = profile?.a1c_value ?? null
  const [infoOpen, setInfoOpen] = useState(false)

  const result = useMemo(
    () => computeDailyGlucose(entries, healthState, undefined, a1c),
    [entries, healthState, a1c]
  )

  const hasData = entries.some(e => e.glycemic_load != null && e.glycemic_load > 0)
  const pill = PILL_STYLE[result.status]
  const moodKeys = MOOD_KEYS[result.status] ?? []
  const moodKey = moodKeys.length > 0 ? moodKeys[entries.length % moodKeys.length] : null

  const fastingBaseline = getFastingBaseline(healthState, a1c)

  return (
    <>
      <div
        className="text-center py-6 relative"
        aria-label={hasData
          ? `Estimated glucose is ${result.currentEstimate} mg/dL, status: ${t(moodKey!)}`
          : `Fasting glucose baseline: ${fastingBaseline} mg/dL`
        }
      >
        <div className="flex items-center justify-center gap-1.5">
          <p className="text-label text-on-surface-variant">{t('dashboard.hero.label')}</p>
          <button
            onClick={() => setInfoOpen(true)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high text-[11px] font-bold text-text-tertiary"
            aria-label={t('dashboard.info.title')}
          >
            i
          </button>
        </div>

        <div className="mt-3 mb-2">
          {hasData ? (
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-display text-on-surface">{result.currentEstimate}</span>
              <span className="text-label text-text-tertiary font-normal normal-case tracking-normal">mg/dL</span>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-display text-on-surface">{fastingBaseline}</span>
              <span className="text-label text-text-tertiary font-normal normal-case tracking-normal">mg/dL</span>
            </div>
          )}
        </div>

        {hasData && pill && moodKey ? (
          <div className={`inline-flex items-center gap-1.5 rounded-full ${pill.bg} px-3.5 py-1.5`}>
            <div className={`h-2 w-2 rounded-full ${pill.dot}`} />
            <span className={`text-label ${pill.text}`}>{t(moodKey)}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-tl-green-bg px-3.5 py-1.5">
            <div className="h-2 w-2 rounded-full bg-tl-green-fill" />
            <span className="text-label text-tl-green-fill">{t('dashboard.mood.fasting')}</span>
          </div>
        )}
      </div>

      {/* Info bottom sheet */}
      {infoOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={() => setInfoOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card px-6 pt-6 pb-10 shadow-xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
            {/* Drag handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border/60" />

            <h3 className="text-title text-on-surface mb-4">{t('dashboard.info.title')}</h3>

            {/* Green zone */}
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tl-green-bg">
                <span className="text-sm font-bold text-tl-green-fill">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-tl-green-fill">{t('dashboard.info.greenTitle')}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t('dashboard.info.greenDesc').replace('{{max}}', String(thresholds.greenMax))}
                </p>
              </div>
            </div>

            {/* Yellow zone */}
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tl-yellow-bg">
                <span className="text-sm font-bold text-tl-yellow-fill">⚠</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-tl-yellow-fill">{t('dashboard.info.yellowTitle')}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t('dashboard.info.yellowDesc').replace('{{min}}', String(thresholds.greenMax + 1)).replace('{{max}}', String(thresholds.yellowMax))}
                </p>
              </div>
            </div>

            {/* Red zone */}
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tl-red-bg">
                <span className="text-sm font-bold text-tl-red-fill">⊘</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-tl-red-fill">{t('dashboard.info.redTitle')}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t('dashboard.info.redDesc').replace('{{min}}', String(thresholds.yellowMax + 1))}
                </p>
              </div>
            </div>

            <p className="text-xs text-text-tertiary mt-2 leading-relaxed">
              {t('dashboard.info.footnote')}
            </p>

            <button
              onClick={() => setInfoOpen(false)}
              className="w-full mt-5 rounded-full bg-surface-container-high py-3.5 text-sm font-semibold text-on-surface min-h-[44px]"
            >
              {t('dashboard.info.close')}
            </button>
          </div>
        </>
      )}
    </>
  )
}

import { useNavigate } from 'react-router-dom'
import { useCamera } from '@/hooks/useCamera'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog, toLogEntry } from '@/hooks/useDailyLog'
import { FoodResultCard, FoodResultList, isCompositeResult, SearchMeta } from '@/components/FoodResultCard'
import { useLanguage } from '@/lib/i18n'
import EditableMealCard from '@/components/EditableMealCard'
import type { FoodSearchResult } from '@/types/shared'
import { useState, useEffect, useRef } from 'react'

/** Animated progress that ticks up while analyzing */
function useProgress(active: boolean) {
  const [progress, setProgress] = useState(0)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (active) {
      setProgress(0)
      interval.current = setInterval(() => {
        setProgress(p => {
          if (p >= 95) return 95
          // Fast at first, slows down as it approaches 95
          const increment = p < 30 ? 8 : p < 60 ? 4 : p < 80 ? 2 : 0.5
          return Math.min(p + increment, 95)
        })
      }, 200)
    } else {
      if (interval.current) clearInterval(interval.current)
      if (progress > 0) setProgress(100)
    }
    return () => { if (interval.current) clearInterval(interval.current) }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  return progress
}

/** Cycling Loti analysis messages during scan */
const LOTI_PHASES = ['scan.analyzing1', 'scan.analyzing2', 'scan.analyzing3', 'scan.analyzing4'] as const

function useLotiPhase(active: boolean) {
  const [phase, setPhase] = useState(0)
  const { t } = useLanguage()
  useEffect(() => {
    if (!active) { setPhase(0); return }
    const timer = setInterval(() => setPhase(p => (p + 1) % LOTI_PHASES.length), 2500)
    return () => clearInterval(timer)
  }, [active])
  return t(LOTI_PHASES[phase])
}

/** Stagger-reveal chips one at a time */
function useChipStagger(results: FoodSearchResult[], isLoading: boolean) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [staggerDone, setStaggerDone] = useState(false)

  useEffect(() => {
    if (isLoading) { setVisibleCount(0); setStaggerDone(false); return }
    if (results.length === 0) return

    const maxStagger = Math.min(results.length, 5)
    let count = 0
    const timer = setInterval(() => {
      count++
      if (count >= maxStagger) {
        clearInterval(timer)
        setVisibleCount(results.length)
        setTimeout(() => setStaggerDone(true), 500)
      } else {
        setVisibleCount(count)
      }
    }, 400)
    setVisibleCount(1)
    return () => clearInterval(timer)
  }, [results, isLoading])

  return { visibleCount, staggerDone }
}

export default function ScanScreen() {
  const navigate = useNavigate()
  const camera = useCamera()
  const search = useWaterfallSearch()
  const { addEntry } = useDailyLog()
  const { t } = useLanguage()
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)

  const isAnalyzing = search.state === 'loading'
  const progress = useProgress(isAnalyzing)
  const scanPhase = useLotiPhase(isAnalyzing)

  // Chip stagger for analysis view
  const chipResults = search.state === 'done' ? search.results : []
  const { visibleCount, staggerDone } = useChipStagger(chipResults, isAnalyzing)
  const [showSheet, setShowSheet] = useState(false)

  useEffect(() => {
    if (staggerDone && search.results.length > 0) setShowSheet(true)
  }, [staggerDone, search.results.length])

  const handleCapture = async () => {
    await camera.capture()
  }

  // Auto-analyze when photo is captured
  useEffect(() => {
    if (camera.base64 && search.state === 'idle') {
      search.searchPhoto(camera.base64)
    }
  }, [camera.base64]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLog = () => {
    const item = selected ?? search.topResult
    if (!item) return
    addEntry(toLogEntry(item, 'photo_scan'))
    camera.reset()
    search.reset()
    setSelected(null)
    navigate('/')
  }

  const handleLogAll = () => {
    for (const item of search.results) {
      addEntry(toLogEntry(item, 'photo_scan'))
    }
    camera.reset()
    search.reset()
    navigate('/')
  }

  const handleScanAnother = () => {
    camera.reset()
    search.reset()
    setSelected(null)
    setShowSheet(false)
  }

  const handleLogComposite = (components: FoodSearchResult[]) => {
    for (const item of components) {
      addEntry(toLogEntry(item, 'photo_scan'))
    }
    camera.reset()
    search.reset()
    setSelected(null)
    navigate('/')
  }

  // ─── Result view ──────────────────────────────────────────
  if (search.state === 'done' && search.results.length > 0 && showSheet) {
    const display = selected ?? search.topResult!
    const composite = isCompositeResult(search.results)
    const multiple = search.results.length > 1 && !composite

    return (
      <div className="flex flex-1 flex-col bg-surface min-h-0">
        <header className="glass flex items-center px-5 py-3 z-10 flex-shrink-0">
          <button onClick={handleScanAnother} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-title text-on-surface">{t('text.analysis')}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 pb-24">
          {camera.previewUrl && (
            <div className="w-24 h-24 overflow-hidden rounded-xl self-center shadow-sm">
              <img src={camera.previewUrl} alt="Scanned food" className="h-full w-full object-cover" />
            </div>
          )}

          {composite ? (
            <EditableMealCard
              total={search.results[0]}
              initialComponents={search.results.slice(1)}
              onLog={handleLogComposite}
            />
          ) : multiple ? (
            <>
              <FoodResultList
                results={search.results}
                onSelect={setSelected}
                selectedIndex={selected ? search.results.indexOf(selected) : 0}
              />
              {selected && (
                <FoodResultCard result={selected} />
              )}
            </>
          ) : (
            <FoodResultCard result={display} />
          )}

          <SearchMeta source={search.source} cached={search.cached} latencyMs={search.latencyMs} />
        </div>

        {!composite && (
          <div className="flex gap-3 glass p-4 sticky bottom-0">
            <button
              onClick={handleScanAnother}
              className="flex-1 ghost-border rounded-full px-4 py-3 text-body font-medium text-on-surface-variant hover:bg-surface-container-high min-h-[48px]"
            >
              {t('text.searchAnother')}
            </button>
            {multiple ? (
              <button
                onClick={selected ? handleLog : handleLogAll}
                className="flex-1 btn-gradient min-h-[48px]"
              >
                {selected ? t('text.logSelected') : t('text.logAll')}
              </button>
            ) : (
              <button
                onClick={handleLog}
                className="flex-1 btn-gradient min-h-[48px]"
              >
                {t('text.log')}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Analysis view (photo taken, analyzing or chips staggering) ───
  if ((camera.base64 || camera.previewUrl) && !showSheet) {
    const hasError = search.state === 'error' || (search.state === 'done' && search.results.length === 0)

    return (
      <div className="flex flex-1 flex-col bg-surface min-h-0">
        {/* Top bar */}
        <div className="flex items-center px-4 pt-4 pb-2 flex-shrink-0">
          <button
            onClick={handleScanAnother}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high"
            aria-label={t('common.back')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-on-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Full-width photo */}
        {camera.previewUrl && (
          <div className="w-full overflow-hidden rounded-2xl mx-auto px-4" style={{ aspectRatio: '4/3', maxHeight: '40vh' }}>
            <img src={camera.previewUrl} alt="Scanned food" className="w-full h-full object-cover rounded-2xl" />
          </div>
        )}

        <div className="flex flex-1 flex-col items-center px-5 pt-4 gap-4 overflow-y-auto">
          {/* Error state */}
          {hasError && (
            <div className="w-full rounded-2xl bg-white p-5 shadow-sm loti-message-enter">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🥺</span>
                <div className="flex-1">
                  <p className="text-body font-semibold text-on-surface">{t('scan.errorTitle')}</p>
                  <p className="text-caption text-on-surface-variant mt-1">
                    {search.error ?? t('scan.errorNoFood')}
                  </p>
                  <p className="text-caption text-on-surface-variant mt-0.5">{t('scan.errorSub')}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleScanAnother}
                  className="flex-1 ghost-border rounded-full px-4 py-3 text-body font-medium text-on-surface-variant hover:bg-surface-container-high min-h-[48px]"
                >
                  {t('scan.tryAgain')}
                </button>
                <button
                  onClick={() => navigate('/text')}
                  className="flex-1 btn-gradient min-h-[48px]"
                >
                  {t('scan.errorTypeInstead')}
                </button>
              </div>
            </div>
          )}

          {/* Analyzing state */}
          {isAnalyzing && (
            <div className="w-full rounded-2xl bg-white p-5 shadow-sm loti-message-enter">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🔍</span>
                <div className="flex-1">
                  <p className="text-body font-semibold text-on-surface">{scanPhase}</p>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-on-surface-variant mt-1 text-right">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ingredient chips (staggering in) */}
          {chipResults.length > 0 && visibleCount > 0 && (
            <div className="flex flex-wrap gap-2 w-full">
              {chipResults.slice(0, visibleCount).map((item, i) => (
                <span
                  key={item.name_es + i}
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-3 py-1.5 text-sm font-medium text-green-800 animate-chip-in"
                >
                  <span className="text-green-500">&#10003;</span>
                  {item.name_es}
                </span>
              ))}
              {visibleCount < chipResults.length && (
                <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 animate-chip-in">
                  {t('scan.moreIngredients').replace('{{count}}', String(chipResults.length - visibleCount))}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Loti's Kitchen Entry Screen ──────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-surface min-h-0">
      {/* Close button */}
      <div className="flex items-center px-4 pt-4 pb-2 flex-shrink-0">
        <button
          onClick={() => { camera.reset(); search.reset(); navigate('/') }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high"
          aria-label={t('common.closeMenu')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-on-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Loti greeting */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6">
        <span className="text-[64px] leading-none">🦎</span>
        <h1 className="text-title text-on-surface mt-4">{t('scan.greeting')}</h1>
        <p className="text-body text-on-surface-variant mt-1">{t('scan.greetingSub')}</p>
      </div>

      {/* Action cards */}
      <div className="flex gap-4 px-6">
        {/* Take Photo */}
        <button
          onClick={handleCapture}
          disabled={camera.loading}
          className="flex-1 flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 min-h-[140px] justify-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-body font-semibold text-on-surface">{t('scan.takePhoto')}</p>
            <p className="text-caption text-on-surface-variant mt-0.5">{t('scan.takePhotoSub')}</p>
          </div>
        </button>

        {/* From Gallery */}
        <button
          onClick={() => camera.uploadFromGallery()}
          disabled={camera.loading}
          className="flex-1 flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 min-h-[140px] justify-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-body font-semibold text-on-surface">{t('scan.fromGallery')}</p>
            <p className="text-caption text-on-surface-variant mt-0.5">{t('scan.fromGallerySub')}</p>
          </div>
        </button>
      </div>

      {/* Camera error */}
      {camera.error && (
        <div className="mx-6 mt-4 rounded-2xl bg-error/10 p-4">
          <p className="text-body text-error text-center">{t('scan.permissionNeeded')}</p>
        </div>
      )}

      {/* "Or type what you ate" link */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate('/text')}
          className="text-body text-primary font-medium hover:underline min-h-[44px] flex items-center"
        >
          {t('scan.typeInstead')}
        </button>
      </div>
    </div>
  )
}

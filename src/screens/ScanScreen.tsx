import { useNavigate } from 'react-router-dom'
import { useCamera } from '@/hooks/useCamera'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog, toLogEntry } from '@/hooks/useDailyLog'
import { FoodResultCard, FoodResultList, isCompositeResult, SearchMeta } from '@/components/FoodResultCard'
import { useLanguage } from '@/lib/i18n'
import EditableMealCard from '@/components/EditableMealCard'
import type { FoodSearchResult } from '@/types/shared'
import { useThresholds, getPersonalizedTrafficLight } from '@/hooks/useThresholds'
import type { TrafficLight } from '@/types/shared'
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
  const [editMode, setEditMode] = useState(false)
  const [verdictFlash, setVerdictFlash] = useState<TrafficLight | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const thresholds = useThresholds()

  const isAnalyzing = search.state === 'loading'
  const progress = useProgress(isAnalyzing)
  const scanPhase = useLotiPhase(isAnalyzing)

  // Chip stagger for analysis view
  const chipResults = search.state === 'done' ? search.results : []
  const { visibleCount, staggerDone } = useChipStagger(chipResults, isAnalyzing)
  const [showSheet, setShowSheet] = useState(false)

  // Verdict flash before bottom sheet
  useEffect(() => {
    if (staggerDone && search.results.length > 0) {
      const top = search.topResult
      if (top) {
        const tl = top.glycemic_load != null
          ? getPersonalizedTrafficLight(top.glycemic_load, thresholds)
          : top.traffic_light ?? 'yellow'
        setVerdictFlash(tl)
        const timer = setTimeout(() => {
          setVerdictFlash(null)
          setShowSheet(true)
        }, 1200)
        return () => clearTimeout(timer)
      } else {
        setShowSheet(true)
      }
    }
  }, [staggerDone, search.results.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start/stop live camera stream for viewfinder
  const isViewfinder = !camera.base64 && !camera.previewUrl && !showSheet && !verdictFlash
  useEffect(() => {
    if (!isViewfinder) return
    let cancelled = false
    camera.startStream().then(stream => {
      if (cancelled || !stream || !videoRef.current) return
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    })
    return () => { cancelled = true }
  }, [isViewfinder]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = async () => {
    if (videoRef.current) {
      await camera.captureFrame(videoRef.current)
    } else {
      await camera.capture()
    }
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
    setEditMode(false)
    setVerdictFlash(null)
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

  // ─── Bottom Sheet Result view ─────────────────────────────
  if (showSheet && search.state === 'done' && search.results.length > 0) {
    const display = selected ?? search.topResult!
    const composite = isCompositeResult(search.results)
    const multiple = search.results.length > 1 && !composite

    return (
      <div className="flex flex-1 flex-col bg-surface min-h-0 relative">
        {/* Shrunk photo at top */}
        {camera.previewUrl && (
          <div className="w-full overflow-hidden" style={{ maxHeight: '25vh' }}>
            <img src={camera.previewUrl} alt="Scanned food" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Bottom sheet */}
        <div
          className="flex flex-1 flex-col bg-white rounded-t-3xl -mt-4 relative z-10 animate-sheet-up min-h-0"
          role="dialog"
          aria-label={t('text.analysis')}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Scrollable content */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-24">
            {composite || editMode ? (
              <EditableMealCard
                total={search.results[0]}
                initialComponents={composite ? search.results.slice(1) : [search.results[0]]}
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
              <>
                <FoodResultCard result={display} />
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 text-body text-primary font-medium hover:bg-surface-container-high rounded-2xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {t('scan.addMissing')}
                </button>
              </>
            )}

            <SearchMeta source={search.source} cached={search.cached} latencyMs={search.latencyMs} />
          </div>

          {/* Pinned action buttons */}
          {!composite && !editMode && (
            <div className="flex gap-3 glass p-4 sticky bottom-0 flex-shrink-0">
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

  // ─── Live Camera Viewfinder ──────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-black" style={{ zIndex: 50 }}>
      {/* Full-screen live video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Corner bracket overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative" style={{ width: '70vw', height: '70vw', maxWidth: '320px', maxHeight: '320px' }}>
          <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
        </div>
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 flex-shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <button
          onClick={() => { camera.reset(); search.reset(); navigate('/') }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm min-h-[44px] min-w-[44px]"
          aria-label={t('common.closeMenu')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Gallery thumbnail */}
        <button
          onClick={() => camera.uploadFromGallery()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm min-h-[44px] min-w-[44px]"
          aria-label={t('scan.fromGallery')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Bottom controls */}
      <div className="relative z-20 mt-auto pb-8 flex flex-col items-center gap-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
        {/* "Scan Food" chip */}
        <span className="rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white">
          {t('scan.scanFood')}
        </span>

        {/* Control row: flash | shutter | type */}
        <div className="flex items-center justify-center gap-10 w-full px-8">
          {/* Flash toggle */}
          <button
            onClick={() => camera.toggleTorch()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm min-h-[44px] min-w-[44px]"
            aria-label={t('scan.flash')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${camera.torchOn ? 'text-yellow-300' : 'text-white/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          {/* Shutter button */}
          <button
            onClick={handleCapture}
            disabled={camera.loading || camera.streamState !== 'active'}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white border-[4px] border-white/30 active:scale-90 transition-transform disabled:opacity-50"
            aria-label={t('scan.scanFood')}
          >
            <div className="h-[60px] w-[60px] rounded-full bg-white" />
          </button>

          {/* Type instead */}
          <button
            onClick={() => { camera.stopStream(); navigate('/text') }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm min-h-[44px] min-w-[44px]"
            aria-label={t('scan.typeInstead')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera loading overlay */}
      {camera.streamState === 'loading' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-sm text-white/70">{t('scan.cameraLoading')}</p>
          </div>
        </div>
      )}

      {/* Camera error overlay */}
      {camera.streamState === 'error' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black px-8">
          <div className="text-center">
            <span className="text-5xl">🌸</span>
            <p className="mt-4 text-body font-medium text-white">{t('scan.permissionNeeded')}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { camera.stopStream(); navigate('/text') }}
                className="flex-1 rounded-full border border-white/30 px-4 py-3 text-body font-medium text-white min-h-[48px]"
              >
                {t('scan.errorTypeInstead')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verdict flash overlay */}
      {verdictFlash && (
        <div className={`absolute inset-0 z-40 flex items-center justify-center animate-verdict-flash ${
          verdictFlash === 'green' ? 'bg-tl-green-fill/60' :
          verdictFlash === 'yellow' ? 'bg-tl-yellow-fill/60' :
          'bg-tl-red-fill/60'
        }`}>
          <div className="text-center">
            <div className="text-6xl font-bold text-white">
              {verdictFlash === 'green' ? '✓' : verdictFlash === 'yellow' ? '⚠' : '!'}
            </div>
            <p className="mt-3 text-xl font-bold text-white">
              {verdictFlash === 'green' ? t('scan.lowImpact') :
               verdictFlash === 'yellow' ? t('scan.moderateImpact') :
               t('scan.highImpact')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

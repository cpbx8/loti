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

/** Cycling identification text during scan */
const SCAN_PHASES = [
  'Procesando imagen…',
  'Identificando alimentos…',
  'Analizando nutrición…',
  'Calculando impacto glucémico…',
]

function useScanPhase(active: boolean) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!active) { setPhase(0); return }
    const timer = setInterval(() => setPhase(p => (p + 1) % SCAN_PHASES.length), 2000)
    return () => clearInterval(timer)
  }, [active])
  return SCAN_PHASES[phase]
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
  const scanPhase = useScanPhase(isAnalyzing)

  const handleCapture = async () => {
    await camera.capture()
  }

  // Auto-launch camera on mount
  const hasLaunched = useRef(false)
  useEffect(() => {
    if (!hasLaunched.current && !camera.base64 && !camera.loading) {
      hasLaunched.current = true
      camera.capture()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
  if (search.state === 'done' && search.results.length > 0) {
    const display = selected ?? search.topResult!
    const composite = isCompositeResult(search.results)
    const multiple = search.results.length > 1 && !composite

    return (
      <div className="flex flex-1 flex-col bg-surface">
        <header className="glass flex items-center px-5 py-3 sticky top-0 z-10">
          <button onClick={handleScanAnother} className="text-body text-on-surface-variant hover:text-on-surface min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-title text-on-surface">Análisis de Alimento</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
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
                <div className="mt-2 rounded-2xl bg-card p-4 shadow-sm">
                  <FoodResultCard result={selected} />
                </div>
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

  // ─── Error ────────────────────────────────────────────────
  if (search.state === 'error') {
    return (
      <div className="flex flex-1 flex-col bg-surface">
        <header className="flex items-center border-b border-border bg-card px-5 py-3">
          <button onClick={handleScanAnother} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Atrás
          </button>
          <h1 className="ml-3 text-lg font-bold text-text-primary">Escaneo</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-base font-medium text-text-primary">No pudimos analizar esta foto</p>
          <p className="text-sm text-text-secondary text-center">{search.error ?? 'Intenta con una foto más clara o escribe el nombre del alimento.'}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleScanAnother}
              className="rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-card min-h-[48px]"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate('/text')}
              className="rounded-3xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[48px]"
            >
              Escribir alimento
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Camera / Capture view (main scanner UI) ───────────────
  return (
    <div className="flex flex-1 flex-col bg-black relative overflow-hidden">
      {/* Photo preview or dark background */}
      {camera.previewUrl ? (
        <div className="absolute inset-0">
          <img src={camera.previewUrl} alt="Captured food" className="h-full w-full object-cover" />
          {/* Dark overlay during analysis */}
          {isAnalyzing && <div className="absolute inset-0 bg-black/40" />}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900" />
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => { camera.reset(); search.reset(); navigate('/') }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* "ESCANEO EN VIVO" badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm px-4 py-1.5">
          <div className={`h-2 w-2 rounded-full ${isAnalyzing ? 'bg-primary animate-pulse' : 'bg-white/60'}`} />
          <span className="text-xs font-semibold text-white tracking-wider uppercase">
            {isAnalyzing ? 'Escaneo en vivo' : 'Escanear'}
          </span>
        </div>

        <div className="w-10" /> {/* Spacer for symmetry */}
      </div>

      {/* Center: scan frame with corner brackets */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-12">
        <div className="relative w-full aspect-square max-w-[280px]">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary/70 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-primary/70 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-primary/70 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary/70 rounded-br-lg" />

          {/* Scan line animation */}
          {isAnalyzing && (
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
          )}

          {/* Center prompt when no photo */}
          {!camera.previewUrl && !isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/50 text-sm text-center px-4">
                Toma una foto de tu comida
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Identification banner (shows during analysis) */}
      {isAnalyzing && (
        <div className="relative z-10 mx-6 mb-4">
          <div className="rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {scanPhase}
                </p>
                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                Procesando imagen
              </p>
              <p className="text-[10px] font-semibold text-primary">
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {camera.error && (
        <div className="relative z-10 mx-6 mb-4">
          <div className="rounded-2xl bg-error/90 backdrop-blur-md px-4 py-3">
            <p className="text-sm text-white">{camera.error}</p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="relative z-10 pb-8 pt-4 px-6">
        <div className="flex items-center justify-center gap-8">
          {/* Flash / gallery placeholder left */}
          <button
            onClick={() => navigate('/text')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
            aria-label="Buscar texto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Main capture button */}
          <button
            onClick={handleCapture}
            disabled={camera.loading || isAnalyzing}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-white/90 bg-white/20 backdrop-blur-sm transition-transform active:scale-90 disabled:opacity-50"
            aria-label="Tomar foto"
          >
            <div className={`h-[56px] w-[56px] rounded-full ${isAnalyzing ? 'bg-primary animate-pulse' : 'bg-white'}`} />
          </button>

          {/* Barcode button right */}
          <button
            onClick={() => navigate('/barcode')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
            aria-label="Código de barras"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h3v16H3V4zm5 0h1v16H8V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h3v16h-3V4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

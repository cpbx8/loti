import { useNavigate } from 'react-router-dom'
import { useCamera } from '@/hooks/useCamera'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog } from '@/hooks/useDailyLog'
import { FoodResultCard, FoodResultList, SearchMeta } from '@/components/FoodResultCard'
import type { FoodSearchResult } from '@/types/shared'
import { useState } from 'react'
import LotiMascot from '@/components/LotiMascot'

export default function ScanScreen() {
  const navigate = useNavigate()
  const camera = useCamera()
  const search = useWaterfallSearch()
  const { addEntry } = useDailyLog()
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)

  const handleConfirm = async () => {
    if (!camera.base64) return
    setSelected(null)
    await search.searchPhoto(camera.base64)
  }

  const handleLog = () => {
    const item = selected ?? search.topResult
    if (!item) return
    addEntry({
      food_name: item.name_en || item.name_es,
      calories_kcal: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      fiber_g: item.fiber_g ?? null,
      glycemic_load: item.glycemic_load ?? null,
      serving_size_g: item.serving_size,
      input_method: 'photo_scan',
    })
    camera.reset()
    search.reset()
    setSelected(null)
    navigate('/')
  }

  const handleLogAll = () => {
    for (const item of search.results) {
      addEntry({
        food_name: item.name_en || item.name_es,
        calories_kcal: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        fiber_g: item.fiber_g ?? null,
        serving_size_g: item.serving_size,
        input_method: 'photo_scan',
      })
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

  // ─── Result view ──────────────────────────────────────────
  if (search.state === 'done' && search.results.length > 0) {
    const display = selected ?? search.topResult!
    const multiple = search.results.length > 1

    return (
      <div className="flex flex-1 flex-col bg-surface">
        <header className="flex items-center border-b border-border bg-card px-5 py-3">
          <button onClick={handleScanAnother} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-text-primary">
            {multiple ? `${search.results.length} Items Found` : (display.name_en || display.name_es)}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {/* Show captured photo thumbnail */}
          {camera.previewUrl && (
            <div className="w-24 h-24 overflow-hidden rounded-xl self-center shadow-sm">
              <img src={camera.previewUrl} alt="Scanned food" className="h-full w-full object-cover" />
            </div>
          )}

          {multiple ? (
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

        <div className="flex gap-3 border-t border-border bg-card p-4">
          <button
            onClick={handleScanAnother}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-surface min-h-[44px]"
          >
            Scan Another
          </button>
          {multiple ? (
            <button
              onClick={selected ? handleLog : handleLogAll}
              className="flex-1 rounded-3xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
            >
              {selected ? 'Log Selected' : 'Log All'}
            </button>
          ) : (
            <button
              onClick={handleLog}
              className="flex-1 rounded-3xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
            >
              Log This
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Scanning in progress ─────────────────────────────────
  if (search.state === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface p-6">
        <LotiMascot expression="scanning" size="lg" animated />
        <p className="text-lg text-text-secondary">Analyzing your food...</p>
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
            Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-text-primary">Photo Scan</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <LotiMascot expression="error" size="md" />
          <p className="text-base font-medium text-text-primary">Couldn't analyze this photo</p>
          <p className="text-sm text-text-secondary text-center">{search.error ?? 'Try a clearer photo or type the food name instead.'}</p>
          <div className="flex gap-3">
            <button
              onClick={handleScanAnother}
              className="rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-card min-h-[44px]"
            >
              Retake Photo
            </button>
            <button
              onClick={() => navigate('/text')}
              className="rounded-3xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
            >
              Type It In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── No photo yet — capture prompt ────────────────────────
  if (!camera.previewUrl) {
    return (
      <div className="flex flex-1 flex-col bg-surface">
        <header className="flex items-center border-b border-border bg-card px-5 py-3">
          <button onClick={() => navigate('/')} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-text-primary">Photo Scan</h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 overflow-y-auto">
          {camera.error && (
            <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
              {camera.error}
            </p>
          )}

          <button
            onClick={camera.capture}
            disabled={camera.loading}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label="Take photo"
          >
            {camera.loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>

          <p className="text-text-secondary">Take a photo of your food</p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-tertiary">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => navigate('/barcode')}
            className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-text-primary hover:bg-surface min-h-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h3v16H3V4zm5 0h1v16H8V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h3v16h-3V4z" />
            </svg>
            Scan a barcode instead
          </button>
        </div>
      </div>
    )
  }

  // ─── Photo captured — review ──────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button onClick={() => { camera.reset(); navigate('/') }} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-text-primary">Photo Scan</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm overflow-hidden rounded-xl shadow-md">
          <img src={camera.previewUrl} alt="Captured food" className="h-auto w-full object-cover" />
        </div>

        <div className="mt-6 flex w-full max-w-sm gap-3">
          <button
            onClick={camera.reset}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-card min-h-[44px]"
          >
            Retake
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-3xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog } from '@/hooks/useDailyLog'
import BarcodeScanner from '@/components/BarcodeScanner'
import { FoodResultCard, FoodResultList, SearchMeta } from '@/components/FoodResultCard'
import type { FoodSearchResult } from '@/types/shared'

export default function BarcodeScreen() {
  const navigate = useNavigate()
  const search = useWaterfallSearch()
  const { addEntry } = useDailyLog()
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)

  const handleDetected = useCallback((code: string) => {
    setScannedBarcode(code)
    setSelected(null)
    search.searchBarcode(code)
  }, [search.searchBarcode])

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
      input_method: 'barcode',
    })
    search.reset()
    setSelected(null)
    navigate('/')
  }

  const handleScanAnother = () => {
    search.reset()
    setSelected(null)
    setScannedBarcode(null)
  }

  // ─── Result view ─────────────────────────────────────────
  if (search.state === 'done' && search.results.length > 0) {
    const display = selected ?? search.topResult!

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
            {display.name_en || display.name_es}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <FoodResultCard result={display} />

          {search.results.length > 1 && (
            <>
              <p className="text-xs font-medium text-text-tertiary mt-2">Other matches</p>
              <FoodResultList
                results={search.results}
                onSelect={setSelected}
                selectedIndex={search.results.indexOf(selected ?? search.topResult!)}
              />
            </>
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
          <button
            onClick={handleLog}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
          >
            Log This
          </button>
        </div>
      </div>
    )
  }

  // ─── Loading ─────────────────────────────────────────────
  if (search.state === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-lg text-text-secondary">Looking up barcode...</p>
        {scannedBarcode && <p className="text-sm text-text-tertiary">{scannedBarcode}</p>}
      </div>
    )
  }

  // ─── Error ───────────────────────────────────────────────
  if (search.state === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface p-6">
        <div className="rounded-xl bg-error/10 px-4 py-3">
          <p className="text-sm text-error">{search.error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleScanAnother}
            className="rounded-xl border border-border px-4 py-3 text-base font-medium text-text-secondary hover:bg-card min-h-[44px]"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="rounded-xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
          >
            Photo Scan Instead
          </button>
        </div>
      </div>
    )
  }

  // ─── Scanner view (default) ──────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="flex items-center border-b border-border bg-card px-5 py-3">
        <button onClick={() => navigate('/')} className="text-sm text-text-secondary hover:text-text-primary min-h-[44px] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-text-primary">Scan Barcode</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-5">
        <BarcodeScanner
          onDetected={handleDetected}
          active={search.state === 'idle'}
        />

        <p className="text-center text-sm text-text-secondary">
          Point your camera at a barcode, or type it manually
        </p>

        <button
          onClick={() => navigate('/scan')}
          className="text-sm text-primary hover:text-primary-dark min-h-[44px] flex items-center"
        >
          Switch to Photo Scan
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

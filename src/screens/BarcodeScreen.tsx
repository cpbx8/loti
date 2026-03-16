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
      <div className="flex flex-1 flex-col bg-gray-950">
        <header className="flex items-center border-b border-gray-800 px-4 py-3">
          <button onClick={handleScanAnother} className="text-sm text-gray-400 hover:text-white">
            ← Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-white">
            {display.name_en || display.name_es}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <FoodResultCard result={display} />

          {search.results.length > 1 && (
            <>
              <p className="text-xs font-medium text-gray-500 mt-2">Other matches</p>
              <FoodResultList
                results={search.results}
                onSelect={setSelected}
                selectedIndex={search.results.indexOf(selected ?? search.topResult!)}
              />
            </>
          )}

          <SearchMeta source={search.source} cached={search.cached} latencyMs={search.latencyMs} />
        </div>

        <div className="flex gap-3 border-t border-gray-800 p-4">
          <button
            onClick={handleScanAnother}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Scan Another
          </button>
          <button
            onClick={handleLog}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-950 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-primary" />
        <p className="text-lg text-gray-400">Looking up barcode...</p>
        {scannedBarcode && <p className="text-sm text-gray-600">{scannedBarcode}</p>}
      </div>
    )
  }

  // ─── Error ───────────────────────────────────────────────
  if (search.state === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-950 p-6">
        <div className="rounded-xl bg-red-900/20 px-4 py-3">
          <p className="text-sm text-red-300">{search.error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleScanAnother}
            className="rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
          >
            Photo Scan Instead
          </button>
        </div>
      </div>
    )
  }

  // ─── Scanner view (default) ──────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-gray-950">
      <header className="flex items-center border-b border-gray-800 px-4 py-3">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white">
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">Scan Barcode</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <BarcodeScanner
          onDetected={handleDetected}
          active={search.state === 'idle'}
        />

        <p className="text-center text-sm text-gray-500">
          Point your camera at a barcode, or type it manually
        </p>

        <button
          onClick={() => navigate('/scan')}
          className="text-sm text-gray-400 hover:text-white"
        >
          Switch to Photo Scan →
        </button>
      </div>
    </div>
  )
}

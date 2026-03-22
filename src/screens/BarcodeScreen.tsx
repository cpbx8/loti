import { useState, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterfallSearch } from '@/hooks/useWaterfallSearch'
import { useDailyLog } from '@/hooks/useDailyLog'
import BarcodeScanner from '@/components/BarcodeScanner'
import { FoodResultCard, FoodResultList, SearchMeta } from '@/components/FoodResultCard'
import type { FoodSearchResult } from '@/types/shared'

function ManualBarcodeForm({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [value, setValue] = useState('')
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed.length >= 4) {
      onSubmit(trimmed)
      setValue('')
    }
  }
  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter barcode number"
        className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 shadow-sm min-h-[44px]"
      />
      <button
        type="submit"
        disabled={value.trim().length < 4}
        className="rounded-3xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 min-h-[44px]"
      >
        Look Up
      </button>
    </form>
  )
}

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
            Scan Again
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
            className="flex-1 rounded-3xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
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
      <div className="flex flex-1 flex-col bg-black">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-green-400" />
          <p className="text-lg text-gray-300">Looking up barcode...</p>
          {scannedBarcode && (
            <p className="rounded-full bg-gray-800 px-4 py-1.5 text-sm font-mono text-green-400">
              {scannedBarcode}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Error ───────────────────────────────────────────────
  if (search.state === 'error') {
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
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-xl bg-error/10 px-4 py-3 max-w-sm">
            <p className="text-sm text-error text-center">{search.error}</p>
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
              className="rounded-3xl bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-dark min-h-[44px]"
            >
              Photo Scan
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Scanner view (default) ──────────────────────────────
  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-black">
      {/* Camera fills the entire screen */}
      <div className="flex-1 min-h-0">
        <BarcodeScanner
          onDetected={handleDetected}
          active={search.state === 'idle'}
        />
      </div>

      {/* Header overlaid on camera */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center px-5 pt-[env(safe-area-inset-top,12px)] pb-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-black/50 backdrop-blur text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-3 text-lg font-bold text-white drop-shadow">Scan Barcode</h1>
      </header>

      {/* Manual input at bottom */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-surface/95 backdrop-blur px-5 pt-4 pb-[env(safe-area-inset-bottom,24px)] rounded-t-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-tertiary">or type the barcode number</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <ManualBarcodeForm onSubmit={handleDetected} />
      </div>
    </div>
  )
}

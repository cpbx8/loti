import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBarcodeScan } from '@/hooks/useBarcodeScan'
import BarcodeScanner from '@/components/BarcodeScanner'

export default function BarcodeScreen() {
  const navigate = useNavigate()
  const barcode = useBarcodeScan()

  const handleDetected = useCallback((code: string) => {
    barcode.lookup(code)
  }, [barcode.lookup])

  const handleLogAndReturn = () => {
    barcode.reset()
    navigate('/')
  }

  const handleScanAnother = () => {
    barcode.reset()
    barcode.startScanning()
  }

  // ─── Result view ─────────────────────────────────────────
  if (barcode.state === 'done' && barcode.result) {
    const r = barcode.result
    const tlColor = r.traffic_light === 'green' ? 'gl-green' :
                    r.traffic_light === 'yellow' ? 'gl-yellow' : 'gl-red'

    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <header className="flex items-center border-b border-gray-800 px-4 py-3">
          <button
            onClick={handleScanAnother}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="ml-3 text-lg font-bold text-white">{r.food_name}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Traffic light */}
          <div className={`rounded-xl p-4 bg-${tlColor}/10`}>
            <p className={`text-lg font-bold text-${tlColor}`}>
              {r.traffic_light === 'green' ? 'Low Impact' :
               r.traffic_light === 'yellow' ? 'Medium Impact' : 'High Impact'}
            </p>
            {r.glycemic_index != null && (
              <p className="mt-1 text-sm text-gray-400">
                GI: {r.glycemic_index} · GL: {r.glycemic_load ?? '—'}
              </p>
            )}
          </div>

          {/* Macros */}
          <div className="grid grid-cols-2 gap-3">
            <MacroCard label="Calories" value={r.calories_kcal} unit="kcal" />
            <MacroCard label="Protein" value={r.protein_g} unit="g" />
            <MacroCard label="Carbs" value={r.carbs_g} unit="g" />
            <MacroCard label="Fat" value={r.fat_g} unit="g" />
          </div>

          {/* Source badge */}
          <p className="text-sm text-gray-500">
            {r.serving_size_g}g per serving
            {r.gi_source === 'macro_estimated' && ' · Estimated from nutrition label'}
            {r.gi_source === 'published' && ` · ${r.match_method}`}
          </p>

          {r.swap_suggestion && (
            <div className="rounded-lg bg-blue-900/20 px-3 py-2">
              <p className="text-sm text-blue-300">{r.swap_suggestion}</p>
            </div>
          )}

          <p className="text-xs text-gray-600">{r.disclaimer}</p>
        </div>

        <div className="flex gap-3 border-t border-gray-800 p-4">
          <button
            onClick={handleScanAnother}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 text-base font-medium text-gray-300 hover:bg-gray-800"
          >
            Scan Another
          </button>
          <button
            onClick={handleLogAndReturn}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white hover:bg-primary-dark"
          >
            Log This
          </button>
        </div>
      </div>
    )
  }

  // ─── Looking up barcode ──────────────────────────────────
  if (barcode.state === 'looking_up') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-950 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-primary" />
        <p className="text-lg text-gray-400">Looking up barcode...</p>
        {barcode.scannedBarcode && (
          <p className="text-sm text-gray-600">{barcode.scannedBarcode}</p>
        )}
      </div>
    )
  }

  // ─── Error state ─────────────────────────────────────────
  if (barcode.state === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-950 p-6">
        <div className="rounded-xl bg-red-900/20 px-4 py-3">
          <p className="text-sm text-red-300">{barcode.error}</p>
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
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="ml-3 text-lg font-bold text-white">Scan Barcode</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <BarcodeScanner
          onDetected={handleDetected}
          active={barcode.state === 'idle' || barcode.state === 'scanning'}
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

function MacroCard({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-lg bg-gray-900 p-3">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold text-white">
        {value != null ? value : '—'}<span className="text-sm font-normal text-gray-400"> {unit}</span>
      </p>
    </div>
  )
}

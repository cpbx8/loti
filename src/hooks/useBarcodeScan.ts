import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ScanResult, MealType } from '@/types/shared'

type BarcodeScanState = 'idle' | 'scanning' | 'looking_up' | 'done' | 'error'

export function useBarcodeScan() {
  const [state, setState] = useState<BarcodeScanState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)

  const lookup = useCallback(async (barcode: string, mealType?: MealType) => {
    setState('looking_up')
    setError(null)
    setResult(null)
    setScannedBarcode(barcode)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scan-barcode', {
        body: { barcode, meal_type: mealType },
      })

      if (fnError) {
        const msg = (data as Record<string, unknown>)?.message as string ?? 'Failed to look up barcode'
        setError(msg)
        setState('error')
        return
      }

      if (data?.error) {
        setError(data.message ?? 'Product not found')
        setState('error')
        return
      }

      setResult(data as ScanResult)
      setState('done')
    } catch {
      setError('Network error. Check your connection.')
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setError(null)
    setScannedBarcode(null)
  }, [])

  const startScanning = useCallback(() => {
    setState('scanning')
    setError(null)
    setResult(null)
  }, [])

  return { state, result, error, scannedBarcode, lookup, reset, startScanning }
}

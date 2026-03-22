import { useState, useCallback } from 'react'
import { handleBarcodeScan } from '@/services/scanPipeline'
import type { ScanResult } from '@/types/shared'

type BarcodeScanState = 'idle' | 'scanning' | 'looking_up' | 'done' | 'error'

export function useBarcodeScan() {
  const [state, setState] = useState<BarcodeScanState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)

  const lookup = useCallback(async (barcode: string) => {
    setState('looking_up')
    setError(null)
    setResult(null)
    setScannedBarcode(barcode)

    try {
      const pipelineResult = await handleBarcodeScan(barcode)
      if (!pipelineResult) {
        setError('Product not found for this barcode')
        setState('error')
        return
      }

      setResult({
        food_name: pipelineResult.food_name,
        food_name_en: pipelineResult.food_name_en ?? undefined,
        glycemic_index: pipelineResult.glycemic_index,
        glycemic_load: pipelineResult.glycemic_load,
        traffic_light: pipelineResult.traffic_light,
        result_traffic_light: pipelineResult.traffic_light,
        swap_tip: pipelineResult.swap_tip ?? undefined,
        confidence_score: pipelineResult.confidence_score,
        data_source: pipelineResult.data_source,
        requires_attribution: pipelineResult.requires_attribution,
        calories_kcal: pipelineResult.calories_kcal,
        protein_g: pipelineResult.protein_g,
        carbs_g: pipelineResult.carbs_g,
        fat_g: pipelineResult.fat_g,
        fiber_g: pipelineResult.fiber_g,
        serving_size_g: pipelineResult.serving_size_g,
      } as unknown as ScanResult)
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

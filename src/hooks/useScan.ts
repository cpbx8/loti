import { useState, useCallback } from 'react'
import { handlePhotoScan } from '@/services/scanPipeline'
import type { ScanResult as PipelineResult } from '@/services/scanPipeline'
import i18n from '@/i18n/config'
import type { ScanResult, MealType } from '@/types/shared'

type ScanState = 'idle' | 'scanning' | 'done' | 'error'

interface UseScanReturn {
  state: ScanState
  result: ScanResult | null
  error: string | null
  scan: (base64: string, mealType?: MealType) => Promise<void>
  reset: () => void
}

function mapPipelineResult(r: PipelineResult): ScanResult {
  return {
    food_name: r.food_name,
    food_name_en: r.food_name_en ?? undefined,
    glycemic_index: r.glycemic_index,
    glycemic_load: r.glycemic_load,
    per_unit_gl: r.per_unit_gl,
    quantity: r.quantity,
    traffic_light: r.traffic_light,
    result_traffic_light: r.traffic_light,
    swap_tip: r.swap_tip ?? undefined,
    confidence_score: r.confidence_score,
    data_source: r.data_source,
    calories_kcal: r.calories_kcal,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    fiber_g: r.fiber_g,
    serving_size_g: r.serving_size_g,
    requires_attribution: r.requires_attribution,
  } as unknown as ScanResult
}

export function useScan(): UseScanReturn {
  const [state, setState] = useState<ScanState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (base64: string, _mealType?: MealType) => {
    setState('scanning')
    setError(null)
    setResult(null)

    try {
      if (!navigator.onLine) {
        setError(i18n.t('errors.offline'))
        setState('error')
        return
      }

      const pipelineResult = await handlePhotoScan(base64)
      setResult(mapPipelineResult(pipelineResult))
      setState('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : i18n.t('errors.unknown')
      setError(msg)
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setError(null)
  }, [])

  return { state, result, error, scan, reset }
}

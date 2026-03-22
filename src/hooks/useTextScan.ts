import { useState, useCallback } from 'react'
import { handleTextScan } from '@/services/scanPipeline'
import type { ScanResult, MealResult, MealType } from '@/types/shared'

type TextScanState = 'idle' | 'scanning' | 'done' | 'error'

export function useTextScan() {
  const [state, setState] = useState<TextScanState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [mealResult, setMealResult] = useState<MealResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (text: string, _mealType?: MealType) => {
    setState('scanning')
    setError(null)
    setResult(null)
    setMealResult(null)

    try {
      const pipelineResult = await handleTextScan(text)
      setResult({
        food_name: pipelineResult.food_name,
        food_name_en: pipelineResult.food_name_en ?? undefined,
        glycemic_index: pipelineResult.glycemic_index,
        glycemic_load: pipelineResult.glycemic_load,
        per_unit_gl: pipelineResult.per_unit_gl,
        quantity: pipelineResult.quantity,
        traffic_light: pipelineResult.traffic_light,
        result_traffic_light: pipelineResult.traffic_light,
        swap_tip: pipelineResult.swap_tip ?? undefined,
        confidence_score: pipelineResult.confidence_score,
        data_source: pipelineResult.data_source,
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
    setMealResult(null)
    setError(null)
  }, [])

  return { state, result, mealResult, error, scan, reset }
}

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ScanResult, MealResult, MealType } from '@/types/shared'

type TextScanState = 'idle' | 'scanning' | 'done' | 'error'

export function useTextScan() {
  const [state, setState] = useState<TextScanState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [mealResult, setMealResult] = useState<MealResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (text: string, mealType?: MealType) => {
    setState('scanning')
    setError(null)
    setResult(null)
    setMealResult(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scan-text', {
        body: { text, meal_type: mealType },
      })

      if (fnError) {
        const msg = (data as Record<string, unknown>)?.message as string ?? 'Failed to analyze food'
        setError(msg)
        setState('error')
        return
      }

      if (data?.error) {
        setError(data.message ?? 'Could not understand input')
        setState('error')
        return
      }

      // Discriminate: MealResult has items array, ScanResult does not
      if (Array.isArray(data?.items)) {
        setMealResult(data as MealResult)
      } else {
        setResult(data as ScanResult)
      }
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

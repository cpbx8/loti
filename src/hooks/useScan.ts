import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
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

function mapError(err: unknown, data?: Record<string, unknown> | null): string {
  // Offline check
  if (!navigator.onLine) {
    return i18n.t('errors.offline')
  }

  // Edge function error codes
  if (data?.error) {
    switch (data.error) {
      case 'RATE_LIMITED':
        return i18n.t('errors.rateLimited')
      case 'UNAUTHORIZED':
        return i18n.t('errors.unauthorized')
      case 'NO_FOOD_DETECTED':
        return i18n.t('noFoodDetected', { ns: 'scan' })
      default:
        return (data.message as string) ?? i18n.t('errors.unknown')
    }
  }

  // Network/timeout errors
  if (err instanceof Error) {
    if (err.message.includes('timeout') || err.message.includes('Timeout')) {
      return i18n.t('errors.timeout')
    }
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      return i18n.t('errors.offline')
    }
  }

  return i18n.t('errors.unknown')
}

export function useScan(): UseScanReturn {
  const [state, setState] = useState<ScanState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (base64: string, mealType?: MealType) => {
    setState('scanning')
    setError(null)
    setResult(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scan', {
        body: { image_base64: base64, meal_type: mealType },
      })

      if (fnError) {
        setError(mapError(fnError, data as Record<string, unknown> | null))
        setState('error')
        return
      }

      if (data?.error) {
        setError(mapError(null, data as Record<string, unknown>))
        setState('error')
        return
      }

      setResult(data as ScanResult)
      setState('done')
    } catch (err) {
      setError(mapError(err))
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

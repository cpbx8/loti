/**
 * Unified hook for all food lookups via the waterfall search-foods endpoint.
 * Replaces useBarcodeScan, useScan (photo), and useTextScan.
 */
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { FoodSearchResult, SearchResponse } from '@/types/shared'

export type LookupState = 'idle' | 'loading' | 'done' | 'error'
export type LookupType = 'text' | 'barcode' | 'photo'

export interface WaterfallResult {
  results: FoodSearchResult[]
  source: string
  cached: boolean
  latency_ms: number
}

export function useWaterfallSearch() {
  const [state, setState] = useState<LookupState>('idle')
  const [data, setData] = useState<WaterfallResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (opts: {
    type: LookupType
    query?: string
    image_base64?: string
  }) => {
    setState('loading')
    setError(null)
    setData(null)

    try {
      const { data: resp, error: fnError } = await supabase.functions.invoke('search-foods', {
        body: {
          type: opts.type,
          query: opts.query,
          image_base64: opts.image_base64,
        },
      })

      if (fnError) {
        const msg = (resp as Record<string, unknown>)?.error as string ?? 'Search failed'
        setError(msg)
        setState('error')
        return
      }

      const sr = resp as SearchResponse
      if (!sr.results || sr.results.length === 0) {
        setError('No results found')
        setState('error')
        return
      }

      setData({
        results: sr.results,
        source: sr.source,
        cached: sr.cached,
        latency_ms: sr.latency_ms,
      })
      setState('done')
    } catch {
      setError('Network error. Check your connection.')
      setState('error')
    }
  }, [])

  // Convenience wrappers
  const searchText = useCallback((text: string) =>
    search({ type: 'text', query: text }), [search])

  const searchBarcode = useCallback((barcode: string) =>
    search({ type: 'barcode', query: barcode }), [search])

  const searchPhoto = useCallback((base64: string) =>
    search({ type: 'photo', image_base64: base64 }), [search])

  const reset = useCallback(() => {
    setState('idle')
    setData(null)
    setError(null)
  }, [])

  // First result shortcut
  const topResult = data?.results?.[0] ?? null

  return {
    state, data, error, topResult,
    results: data?.results ?? [],
    source: data?.source ?? '',
    cached: data?.cached ?? false,
    latencyMs: data?.latency_ms ?? 0,
    search, searchText, searchBarcode, searchPhoto, reset,
  }
}

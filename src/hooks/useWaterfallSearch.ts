/**
 * Unified hook for all food lookups via the AI proxy search-foods endpoint.
 */
import { useState, useCallback } from 'react'
import { useLanguage } from '@/lib/i18n'
import * as aiProxy from '@/services/aiProxy'
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
  const { language } = useLanguage()

  const search = useCallback(async (opts: {
    type: LookupType
    query?: string
    image_base64?: string
  }) => {
    setState('loading')
    setError(null)
    setData(null)

    try {
      const resp = await aiProxy.searchFoods({
        type: opts.type,
        query: opts.query ?? '',
        image_base64: opts.image_base64,
        locale: language,
      }) as SearchResponse

      if (!resp.results || resp.results.length === 0) {
        setError('No results found')
        setState('error')
        return
      }

      setData({
        results: resp.results,
        source: resp.source,
        cached: resp.cached,
        latency_ms: resp.latency_ms,
      })
      setState('done')
    } catch {
      setError('Network error. Check your connection.')
      setState('error')
    }
  }, [])

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

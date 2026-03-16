import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ScanResult } from '@/types/shared'

type SearchState = 'idle' | 'searching' | 'done' | 'error'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const requestRef = useRef(0)

  // Auto-search on query change (debounced)
  const setQueryAndSearch = useCallback((value: string) => {
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Reset on new input
    setState('idle')
    setResult(null)
    setError(null)

    const term = value.trim()
    if (term.length < 2) return

    setState('searching')
    debounceRef.current = setTimeout(async () => {
      const id = ++requestRef.current

      try {
        const { data, error: fnError } = await supabase.functions.invoke('scan-text', {
          body: { text: term },
        })

        // Discard stale response
        if (requestRef.current !== id) return

        if (fnError || data?.error) {
          setError(data?.message ?? 'Search failed')
          setState('error')
          return
        }

        // scan-text returns ScanResult (single) or MealResult (multi)
        const scanResult: ScanResult = Array.isArray(data?.items)
          ? data.items[0]
          : data

        setResult(scanResult)
        setState('done')
      } catch {
        if (requestRef.current !== id) return
        setError('Network error')
        setState('error')
      }
    }, 600)
  }, [])

  // Manual retry
  const retry = useCallback(async () => {
    const term = query.trim()
    if (term.length < 2) return

    setState('searching')
    setError(null)
    setResult(null)

    const id = ++requestRef.current

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scan-text', {
        body: { text: term },
      })

      if (requestRef.current !== id) return

      if (fnError || data?.error) {
        setError(data?.message ?? 'Search failed')
        setState('error')
        return
      }

      const scanResult: ScanResult = Array.isArray(data?.items)
        ? data.items[0]
        : data

      setResult(scanResult)
      setState('done')
    } catch {
      if (requestRef.current !== id) return
      setError('Network error')
      setState('error')
    }
  }, [query])

  const clearResult = useCallback(() => {
    setState('idle')
    setResult(null)
    setError(null)
  }, [])

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    setState('idle')
    setResult(null)
    setError(null)
  }, [])

  return {
    query, setQuery: setQueryAndSearch,
    state, result, error,
    retry, clearResult, clear,
  }
}

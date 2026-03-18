import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { FoodSearchResult, SearchResponse } from '@/types/shared'

type SearchState = 'idle' | 'searching' | 'done' | 'error'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>('idle')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [source, setSource] = useState<string>('')
  const [cached, setCached] = useState(false)
  const [latencyMs, setLatencyMs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const requestRef = useRef(0)

  const doSearch = useCallback(async (term: string, id: number) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-foods', {
        body: { query: term, type: 'text' },
      })

      // Discard stale response
      if (requestRef.current !== id) return

      if (fnError || data?.error) {
        setError(data?.error ?? 'Search failed')
        setState('error')
        return
      }

      const response = data as SearchResponse
      setResults(response.results ?? [])
      setSource(response.source ?? '')
      setCached(response.cached ?? false)
      setLatencyMs(response.latency_ms ?? 0)
      setState(response.results?.length > 0 ? 'done' : 'error')
      if (response.results?.length === 0) {
        setError('No results found')
      }
    } catch {
      if (requestRef.current !== id) return
      setError('Network error')
      setState('error')
    }
  }, [])

  // Auto-search on query change (debounced)
  const setQueryAndSearch = useCallback((value: string) => {
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    setState('idle')
    setResults([])
    setError(null)

    const term = value.trim()
    if (term.length < 2) return

    setState('searching')
    debounceRef.current = setTimeout(() => {
      const id = ++requestRef.current
      doSearch(term, id)
    }, 600)
  }, [doSearch])

  // Manual retry
  const retry = useCallback(async () => {
    const term = query.trim()
    if (term.length < 2) return

    setState('searching')
    setError(null)
    setResults([])

    const id = ++requestRef.current
    doSearch(term, id)
  }, [query, doSearch])

  const clearResult = useCallback(() => {
    setState('idle')
    setResults([])
    setError(null)
  }, [])

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    setState('idle')
    setResults([])
    setError(null)
  }, [])

  // For backward compatibility: return the first result as "result"
  const result = results.length > 0 ? results[0] : null

  return {
    query, setQuery: setQueryAndSearch,
    state, results, result, source, cached, latencyMs, error,
    retry, clearResult, clear,
  }
}

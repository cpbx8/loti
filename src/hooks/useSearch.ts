import { useState, useRef, useCallback } from 'react'
import * as aiProxy from '@/services/aiProxy'
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
      const data = await aiProxy.searchFoods({ query: term, type: 'text' }) as SearchResponse

      if (requestRef.current !== id) return

      if (data?.error) {
        setError(data.error as string)
        setState('error')
        return
      }

      setResults(data.results ?? [])
      setSource(data.source ?? '')
      setCached(data.cached ?? false)
      setLatencyMs(data.latency_ms ?? 0)
      setState(data.results?.length > 0 ? 'done' : 'error')
      if (data.results?.length === 0) {
        setError('No results found')
      }
    } catch {
      if (requestRef.current !== id) return
      setError('Network error')
      setState('error')
    }
  }, [])

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

  const result = results.length > 0 ? results[0] : null

  return {
    query, setQuery: setQueryAndSearch,
    state, results, result, source, cached, latencyMs, error,
    retry, clearResult, clear,
  }
}

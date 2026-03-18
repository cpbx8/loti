import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoreProduct } from '@/types/storeGuide'
import { OXXO_SEED_PRODUCTS } from '@/data/oxxoProducts'

const SEED_DATA: Record<string, StoreProduct[]> = {
  oxxo: OXXO_SEED_PRODUCTS,
}

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Bump this version whenever seed data changes to invalidate stale caches
const SEED_VERSION = 2

function getCacheKey(chainId: string) {
  return `loti_store_${chainId}`
}

interface CachedData {
  products: StoreProduct[]
  fetched_at: number
  seed_version?: number
}

function readCache(chainId: string): StoreProduct[] | null {
  try {
    const raw = localStorage.getItem(getCacheKey(chainId))
    if (!raw) return null
    const cached: CachedData = JSON.parse(raw)
    // Invalidate if seed version changed (means we shipped new bundled data)
    if ((cached.seed_version ?? 0) < SEED_VERSION) return null
    if (Date.now() - cached.fetched_at < CACHE_TTL) {
      return cached.products
    }
    return null // stale
  } catch {
    return null
  }
}

function readStaleCache(chainId: string): StoreProduct[] | null {
  try {
    const raw = localStorage.getItem(getCacheKey(chainId))
    if (!raw) return null
    return (JSON.parse(raw) as CachedData).products
  } catch {
    return null
  }
}

function writeCache(chainId: string, products: StoreProduct[]) {
  try {
    const data: CachedData = { products, fetched_at: Date.now(), seed_version: SEED_VERSION }
    localStorage.setItem(getCacheKey(chainId), JSON.stringify(data))
  } catch {
    // localStorage full or unavailable
  }
}

// Client-safe columns only — excludes nutrition data
const SELECT_COLUMNS = [
  'id', 'store_chain', 'product_name', 'brand', 'category',
  'traffic_light', 'estimated_gl', 'is_best_choice', 'swap_suggestion',
  'why_tip', 'why_detail', 'price_mxn', 'barcode', 'serving_label', 'image_url',
].join(', ')

export function useStoreProducts(chainId: string) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    // Try fresh cache first
    const cached = readCache(chainId)
    if (cached) {
      setProducts(cached)
      setLoading(false)
      return
    }

    // Fetch from Supabase
    try {
      const { data, error: fetchError } = await supabase
        .from('store_products')
        .select(SELECT_COLUMNS)
        .eq('store_chain', chainId)

      if (fetchError) throw fetchError

      const result = (data ?? []) as unknown as StoreProduct[]

      // If DB returned empty (table not migrated yet), fall back to seed data
      if (result.length === 0 && SEED_DATA[chainId]) {
        const seed = SEED_DATA[chainId]
        writeCache(chainId, seed)
        setProducts(seed)
        setError(null)
      } else {
        writeCache(chainId, result)
        setProducts(result)
        setError(null)
      }
    } catch {
      // Network error — try stale cache, then bundled seed data
      const stale = readStaleCache(chainId)
      if (stale) {
        setProducts(stale)
        setError(null)
      } else if (SEED_DATA[chainId]) {
        setProducts(SEED_DATA[chainId])
        writeCache(chainId, SEED_DATA[chainId])
        setError(null)
      } else {
        setError('Could not load products. Check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }, [chainId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const counts = useMemo(() => {
    let green = 0, yellow = 0, red = 0
    for (const p of products) {
      if (p.traffic_light === 'green') green++
      else if (p.traffic_light === 'yellow') yellow++
      else red++
    }
    return { green, yellow, red, total: products.length }
  }, [products])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) set.add(p.category)
    return Array.from(set)
  }, [products])

  return { products, loading, error, counts, categories, refetch: fetchProducts }
}

/**
 * Store products hook — reads from SQLite (local-first).
 * Falls back to bundled TypeScript arrays when SQLite unavailable.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { StoreProduct } from '@/types/storeGuide'
import { getStoreProducts } from '@/db/queries'
import { OXXO_SEED_PRODUCTS } from '@/data/oxxoProducts'
import { SEVEN_ELEVEN_SEED_PRODUCTS } from '@/data/sevenElevenProducts'

const FALLBACK_DATA: Record<string, StoreProduct[]> = {
  oxxo: OXXO_SEED_PRODUCTS,
  seven_eleven: SEVEN_ELEVEN_SEED_PRODUCTS,
}

export function useStoreProducts(chainId: string) {
  const query = useQuery({
    queryKey: ['storeProducts', chainId],
    queryFn: async () => {
      const rows = await getStoreProducts(chainId)
      if (rows.length > 0) {
        // Map SQLite rows to StoreProduct type
        return rows.map(r => ({
          id: r.id,
          store_chain: r.store_chain,
          product_name: r.product_name,
          brand: r.brand,
          category: r.category,
          traffic_light: r.traffic_light as StoreProduct['traffic_light'],
          estimated_gl: r.estimated_gl,
          is_best_choice: r.is_best_choice,
          swap_suggestion: r.swap_suggestion,
          why_tip: r.why_tip,
          why_detail: r.why_detail,
          price_mxn: r.price_mxn,
          barcode: r.barcode,
          serving_label: r.serving_label,
          image_url: r.image_url,
        })) as StoreProduct[]
      }

      // Fallback to bundled data
      return FALLBACK_DATA[chainId] ?? []
    },
    staleTime: Infinity, // Seed data doesn't change at runtime
  })

  const products = query.data ?? FALLBACK_DATA[chainId] ?? []

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

  return {
    products,
    loading: query.isLoading,
    error: query.error ? 'Could not load products.' : null,
    counts,
    categories,
    refetch: () => query.refetch(),
  }
}

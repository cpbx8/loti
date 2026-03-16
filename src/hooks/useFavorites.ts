import { useState, useEffect, useCallback } from 'react'
import type { ScanResult } from '@/types/shared'

export interface Favorite {
  id: string
  food_name: string
  cached_result: ScanResult
  quantity: number
  created_at: string
  last_used_at: string
}

const STORAGE_KEY = 'loti_favorites'

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavorites(favs: Favorite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadFavorites())

  // Sync to localStorage on every change
  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  const add = useCallback((result: ScanResult, quantity = 1) => {
    setFavorites(prev => {
      // Don't duplicate by food_name
      if (prev.some(f => f.food_name.toLowerCase() === result.food_name.toLowerCase())) {
        return prev
      }
      const fav: Favorite = {
        id: crypto.randomUUID(),
        food_name: result.food_name,
        cached_result: result,
        quantity,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      }
      return [fav, ...prev]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
  }, [])

  const isFavorite = useCallback((foodName: string) => {
    return favorites.some(f => f.food_name.toLowerCase() === foodName.toLowerCase())
  }, [favorites])

  const touch = useCallback((id: string) => {
    setFavorites(prev =>
      prev.map(f => f.id === id ? { ...f, last_used_at: new Date().toISOString() } : f)
    )
  }, [])

  return { favorites, add, remove, isFavorite, touch }
}

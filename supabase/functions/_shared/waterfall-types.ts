/**
 * Normalized types for the waterfall food search system.
 */

export interface FoodSearchResult {
  id?: string              // foods_cache UUID if already cached
  name_es: string
  name_en?: string
  calories: number         // per serving
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number
  serving_size: number
  serving_unit: string
  serving_description?: string
  source: "cache" | "fatsecret" | "openfoodfacts" | "gpt4o" | "user" | "seed"
  source_id?: string
  confidence: number       // 0-1
  barcode?: string
  image_url?: string
}

export interface SearchResponse {
  results: FoodSearchResult[]
  source: string           // which tier resolved it
  cached: boolean          // whether it came from Tier 0
  latency_ms: number
}

export interface SearchRequest {
  query: string
  type: "text" | "barcode" | "photo"
  image_base64?: string
  locale?: "en" | "es"
}

/** Shared types between edge functions and frontend */

export type TrafficLight = 'green' | 'yellow' | 'red'
export type GiSource = 'published' | 'estimated' | 'macro_estimated' | 'unknown'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Confidence = 'high' | 'medium' | 'low'
export type InputMethod = 'photo_scan' | 'barcode' | 'text_input' | 'manual_search' | 'favorite'

export interface ScanRequest {
  image_base64: string
  locale?: 'en' | 'es'
  meal_type?: MealType
}

export interface TextScanRequest {
  text: string
  locale?: 'en' | 'es'
  meal_type?: MealType
}

export interface BarcodeScanRequest {
  barcode: string
  meal_type?: MealType
}

export interface ScanResult {
  food_name: string
  category: string
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  serving_size_g: number
  serving_label: string | null
  glycemic_index: number | null
  glycemic_load: number | null
  traffic_light: TrafficLight
  confidence: Confidence
  gi_source: GiSource
  swap_suggestion: string | null
  disclaimer: string
  input_method: InputMethod
  quantity: number
  per_unit_gl: number | null
  matched_food_id: string | null
  match_method: string
}

export interface MealResult {
  items: ScanResult[]
  meal_total: {
    total_gl: number
    traffic_light: TrafficLight
    total_calories: number
    total_protein_g: number
    total_carbs_g: number
    total_fat_g: number
  }
}

export interface ErrorResponse {
  error: string
  message: string
}

// ─── Waterfall Search Types ──────────────────────────────────

export type FoodSource = 'cache' | 'fatsecret' | 'openfoodfacts' | 'gpt4o' | 'user' | 'seed'

export interface FoodSearchResult {
  id?: string
  name_es: string
  name_en?: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number
  serving_size: number
  serving_unit: string
  serving_description?: string
  source: FoodSource
  source_id?: string
  confidence: number
  barcode?: string
  image_url?: string
}

export interface SearchResponse {
  results: FoodSearchResult[]
  source: string
  cached: boolean
  latency_ms: number
  error?: string
}

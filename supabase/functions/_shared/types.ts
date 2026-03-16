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

/** Unified input for the GI Resolution Engine — all input methods normalize to this */
export interface NormalizedFoodInput {
  food_name: string
  food_name_es?: string | null
  category?: string
  is_mixed_meal: boolean
  components: Array<{ name: string; estimated_g: number }>
  quantity: number
  serving_size_g: number
  total_g: number
  input_method: InputMethod
  identification_confidence: number
  barcode?: string
  nutrition_label?: {
    calories: number
    carbs_g: number
    fiber_g: number
    sugar_g: number
    protein_g: number
    fat_g: number
    serving_size_g: number
  }
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

/** GPT-4o Vision structured output */
export interface VisionResponse {
  food_name: string
  food_name_es: string | null
  confidence: number
  estimated_serving_g: number
  is_mixed_meal: boolean
  components: Array<{ name: string; estimated_g: number }>
  is_food: boolean
  error_reason: string | null
  category: string
}

/** GPT-4o text parse output */
export interface TextParseResponse {
  items: Array<{
    food_name: string
    quantity: number
    estimated_serving_g: number
    modifiers: string[]
    is_mixed_meal: boolean
    components: Array<{ name: string; estimated_g: number }>
  }>
  parse_confidence: number
}

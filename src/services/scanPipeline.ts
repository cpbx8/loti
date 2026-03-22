/**
 * On-device scan pipeline — local-first with AI proxy fallback.
 * Checks local DB before making network calls.
 */

import {
  searchFoodsByName, getFoodByBarcode, getStoreProductByBarcode,
  getCachedBarcode, cacheBarcode, getProfile,
  computeTrafficLight, computeThresholds,
} from '@/db/queries'
import type { FoodRow } from '@/db/queries'
import * as aiProxy from './aiProxy'

export interface ScanResult {
  food_name: string
  food_name_en?: string | null
  glycemic_index?: number
  glycemic_load: number
  per_unit_gl?: number
  quantity?: number
  traffic_light: 'green' | 'yellow' | 'red'
  swap_tip: string | null
  confidence_score: number
  data_source: string
  food_id: string | null
  calories_kcal?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  serving_size_g?: number
  requires_attribution?: boolean       // true when sourced from FatSecret
  nutrition?: {                        // raw nutrition from FatSecret
    calories: number
    carbs: number
    sugars: number
    fiber: number
    protein: number
    fat: number
    serving_size_g: number
    serving_description: string
  }
}

async function getUserThresholds(): Promise<{ greenMax: number; yellowMax: number }> {
  const profile = await getProfile()
  if (profile) {
    if (profile.gl_threshold_green && profile.gl_threshold_yellow) {
      return { greenMax: profile.gl_threshold_green, yellowMax: profile.gl_threshold_yellow }
    }
    return computeThresholds(profile.health_state, profile.a1c_value, profile.activity_level, profile.age)
  }
  return { greenMax: 10, yellowMax: 19 }
}

// ─── TEXT SCAN ───────────────────────────────────────────────────

export async function handleTextScan(text: string): Promise<ScanResult> {
  const thresholds = await getUserThresholds()

  // Step 1: GPT parses first — understands meals, quantities, mixed dishes
  const aiResult = await aiProxy.scanText({ text })
  const firstItem = aiResult.items?.[0] || aiResult
  const foodName = firstItem.food_name ?? text

  // Step 2: Cross-reference local DB for published GI data (more reliable than AI estimates)
  const localMatches = await searchFoodsByName(foodName)
  const exactMatch = localMatches.find(
    (f) => f.name.toLowerCase() === foodName.toLowerCase()
      || f.name_en?.toLowerCase() === foodName.toLowerCase()
  )

  const quantity = firstItem.quantity || 1

  if (exactMatch) {
    // Use published GI/GL from local DB, but keep GPT's macros if local DB lacks them
    const adjustedGL = exactMatch.glycemic_load * quantity
    const tl = computeTrafficLight(adjustedGL, thresholds.greenMax, thresholds.yellowMax)
    return {
      food_name: exactMatch.name,
      food_name_en: exactMatch.name_en,
      glycemic_index: exactMatch.glycemic_index,
      glycemic_load: adjustedGL,
      per_unit_gl: exactMatch.glycemic_load,
      quantity,
      traffic_light: tl,
      swap_tip: exactMatch.swap_tip,
      confidence_score: exactMatch.confidence_score,
      data_source: exactMatch.data_source,
      food_id: exactMatch.id,
      calories_kcal: firstItem.calories_kcal ?? undefined,
      protein_g: firstItem.protein_g ?? undefined,
      carbs_g: exactMatch.carbs_g ?? firstItem.carbs_g ?? undefined,
      fat_g: firstItem.fat_g ?? undefined,
      fiber_g: exactMatch.fiber_g ?? firstItem.fiber_g ?? undefined,
      serving_size_g: exactMatch.serving_size_g ?? firstItem.serving_size_g ?? undefined,
    }
  }

  // No exact local match — use GPT result directly
  const gl = (firstItem.glycemic_load ?? 0) * quantity
  const tl = computeTrafficLight(gl, thresholds.greenMax, thresholds.yellowMax)

  return {
    food_name: foodName,
    food_name_en: firstItem.food_name_en ?? null,
    glycemic_index: firstItem.glycemic_index,
    glycemic_load: gl,
    traffic_light: tl,
    swap_tip: firstItem.swap_tip ?? null,
    confidence_score: firstItem.confidence_score ?? 0.5,
    data_source: 'ai_estimated',
    food_id: null,
    calories_kcal: firstItem.calories_kcal,
    protein_g: firstItem.protein_g,
    carbs_g: firstItem.carbs_g,
    fat_g: firstItem.fat_g,
    fiber_g: firstItem.fiber_g,
    serving_size_g: firstItem.serving_size_g,
  }
}

// ─── BARCODE SCAN ───────────────────────────────────────────────

export async function handleBarcodeScan(rawBarcode: string): Promise<ScanResult | null> {
  const barcode = rawBarcode.padStart(13, '0')
  const thresholds = await getUserThresholds()

  // Step 1: Local foods table
  const localFood = await getFoodByBarcode(barcode)
  if (localFood) return buildFromFood(localFood, thresholds)

  // Step 2: Store products (OXXO, 7-Eleven)
  const storeProduct = await getStoreProductByBarcode(barcode)
  if (storeProduct) {
    const gl = storeProduct.estimated_gl ?? 0
    const tl = computeTrafficLight(gl, thresholds.greenMax, thresholds.yellowMax)
    return {
      food_name: storeProduct.product_name,
      glycemic_load: gl,
      traffic_light: tl,
      swap_tip: storeProduct.swap_suggestion,
      confidence_score: 0.7,
      data_source: 'store_product',
      food_id: null,
    }
  }

  // Step 3: Barcode cache
  const cached = await getCachedBarcode(barcode)
  if (cached) {
    const gl = cached.estimated_gl ?? 0
    const tl = computeTrafficLight(gl, thresholds.greenMax, thresholds.yellowMax)
    return {
      food_name: cached.product_name ?? 'Unknown',
      glycemic_load: gl,
      traffic_light: tl,
      swap_tip: null,
      confidence_score: cached.confidence_score ?? 0.4,
      data_source: cached.source,
      food_id: null,
    }
  }

  // Step 4: FatSecret (via edge function proxy — best barcode coverage)
  try {
    const fsResult = await aiProxy.scanBarcode({ barcode })
    if (fsResult && !fsResult.error && fsResult.food_name) {
      await cacheBarcode({
        barcode,
        product_name: fsResult.food_name ?? fsResult.product_name,
        brand: fsResult.brand ?? null,
        source: 'fatsecret',
        estimated_gi: fsResult.glycemic_index ?? null,
        estimated_gl: fsResult.glycemic_load ?? null,
        traffic_light: fsResult.traffic_light ?? null,
        confidence_score: fsResult.confidence_score ?? 0.5,
      })
      const gl = fsResult.glycemic_load ?? fsResult.estimated_gl ?? 0
      const tl = computeTrafficLight(gl, thresholds.greenMax, thresholds.yellowMax)
      return {
        food_name: fsResult.food_name ?? fsResult.product_name ?? 'Unknown',
        glycemic_load: gl,
        traffic_light: tl,
        swap_tip: fsResult.swap_tip ?? null,
        confidence_score: fsResult.confidence_score ?? 0.5,
        data_source: 'fatsecret',
        food_id: null,
        requires_attribution: true,
        nutrition: fsResult.nutrition,
        calories_kcal: fsResult.nutrition?.calories ?? fsResult.calories_kcal,
        protein_g: fsResult.nutrition?.protein ?? fsResult.protein_g,
        carbs_g: fsResult.nutrition?.carbs ?? fsResult.carbs_g,
        fat_g: fsResult.nutrition?.fat ?? fsResult.fat_g,
        fiber_g: fsResult.nutrition?.fiber ?? fsResult.fiber_g,
        serving_size_g: fsResult.nutrition?.serving_size_g ?? fsResult.serving_size_g,
      }
    }
  } catch (err) {
    console.warn('FatSecret lookup failed, falling through to OFF:', err)
  }

  // Step 5: Open Food Facts (direct from device — free fallback)
  try {
    const offResult = await lookupOpenFoodFacts(barcode)
    if (offResult) {
      await cacheBarcode({ barcode, ...offResult, source: 'open_food_facts' })
      const tl = computeTrafficLight(offResult.estimated_gl ?? 0, thresholds.greenMax, thresholds.yellowMax)
      return {
        food_name: offResult.product_name ?? 'Unknown',
        glycemic_load: offResult.estimated_gl ?? 0,
        traffic_light: tl,
        swap_tip: null,
        confidence_score: offResult.confidence_score ?? 0.4,
        data_source: 'open_food_facts',
        food_id: null,
      }
    }
  } catch { /* fall through */ }

  // Not found
  return null
}

// ─── PHOTO SCAN ─────────────────────────────────────────────────

export async function handlePhotoScan(imageBase64: string): Promise<ScanResult> {
  const thresholds = await getUserThresholds()

  // Photos always need GPT-4o Vision
  const aiResult = await aiProxy.scanPhoto({ image_base64: imageBase64 })

  // Check local DB for better published data
  const localMatch = aiResult.food_name
    ? (await searchFoodsByName(aiResult.food_name.split(' ').slice(0, 2).join(' ')))[0]
    : null

  const gl = localMatch ? localMatch.glycemic_load : (aiResult.glycemic_load ?? 0)
  const tl = computeTrafficLight(gl, thresholds.greenMax, thresholds.yellowMax)

  return {
    food_name: localMatch?.name ?? aiResult.food_name ?? 'Unknown food',
    food_name_en: localMatch?.name_en ?? aiResult.food_name_en ?? null,
    glycemic_index: localMatch?.glycemic_index ?? aiResult.glycemic_index,
    glycemic_load: gl,
    traffic_light: tl,
    swap_tip: localMatch?.swap_tip ?? aiResult.swap_tip ?? null,
    confidence_score: localMatch?.confidence_score ?? aiResult.confidence_score ?? 0.5,
    data_source: localMatch?.data_source ?? 'ai_estimated',
    food_id: localMatch?.id ?? null,
    calories_kcal: aiResult.calories_kcal,
    protein_g: aiResult.protein_g,
    carbs_g: aiResult.carbs_g,
    fat_g: aiResult.fat_g,
    fiber_g: aiResult.fiber_g,
    serving_size_g: aiResult.serving_size_g,
  }
}

// ─── HELPERS ────────────────────────────────────────────────────

function buildFromFood(food: FoodRow, thresholds: { greenMax: number; yellowMax: number }): ScanResult {
  const tl = computeTrafficLight(food.glycemic_load, thresholds.greenMax, thresholds.yellowMax)
  return {
    food_name: food.name,
    food_name_en: food.name_en,
    glycemic_index: food.glycemic_index,
    glycemic_load: food.glycemic_load,
    traffic_light: tl,
    swap_tip: food.swap_tip,
    confidence_score: food.confidence_score,
    data_source: food.data_source,
    food_id: food.id,
    carbs_g: food.carbs_g ?? undefined,
    fiber_g: food.fiber_g ?? undefined,
    serving_size_g: food.serving_size_g ?? undefined,
  }
}

async function lookupOpenFoodFacts(barcode: string): Promise<{
  product_name: string | null
  brand: string | null
  estimated_gi: number | null
  estimated_gl: number | null
  confidence_score: number | null
  traffic_light: string | null
} | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
  const data = await res.json()
  if (data.status !== 1) return null

  const p = data.product
  const carbs = p.nutriments?.carbohydrates_100g
  if (!carbs && carbs !== 0) return null

  const sugars = p.nutriments?.sugars_100g || 0
  const fiber = p.nutriments?.fiber_100g || 0
  const sugarRatio = sugars / Math.max(carbs, 1)

  let gi = 60
  if (carbs < 5) gi = 0
  else if (sugarRatio > 0.6 && fiber < 2) gi = 80
  else if (sugarRatio > 0.4) gi = 70
  else if (fiber / Math.max(carbs, 1) > 0.15) gi = 35
  else if (fiber / Math.max(carbs, 1) > 0.08) gi = 50

  const servingG = p.serving_quantity || 100
  const gl = Math.round((gi * (carbs * servingG / 100)) / 100)

  return {
    product_name: p.product_name || p.product_name_es || 'Unknown',
    brand: p.brands || null,
    estimated_gi: gi,
    estimated_gl: gl,
    confidence_score: 0.4,
    traffic_light: null, // Will be computed client-side
  }
}

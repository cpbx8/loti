/**
 * Unified GI Resolution Engine
 *
 * All input methods (photo, barcode, text, manual, favorite) normalize to
 * NormalizedFoodInput, then pass through this engine to get a ScanResult.
 *
 * Pipeline:
 *   1. DB exact/fuzzy/alias match → high confidence, real GI
 *   2. Barcode nutrition label → rule-based GI (macro_estimated)
 *   3. FatSecret/USDA → medium confidence, GPT-estimated GI
 *   4. Full GPT estimation → low confidence
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import type { NormalizedFoodInput, ScanResult, GiSource, Confidence } from "./types.ts"
import { resolveNutrition, estimateNutrition, estimateGI, estimateGIFromNutrition } from "./nutrition.ts"

// ─── Types ──────────────────────────────────────────────────

export interface FoodRow {
  id: string
  name: string
  name_display: string | null
  name_es: string | null
  category: string | null
  serving_size_g: number
  serving_description: string | null
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  available_carbs: number | null
  glycemic_index: number | null
  confidence_score: number | null
  data_source: string | null
  swap_tip: string | null
}

// ─── Main Resolution Function ───────────────────────────────

export async function resolveGI(
  supabase: ReturnType<typeof createClient>,
  input: NormalizedFoodInput,
  options?: { skipDbMatch?: boolean },
): Promise<ScanResult> {
  // Step 1: Try DB match (skip for text/search — go straight to FatSecret/GPT)
  if (!options?.skipDbMatch) {
    const matched = await matchFood(supabase, input.food_name, input.food_name_es ?? null)

    if (matched) {
      return buildDbResult(matched, input)
    }
  }

  // Step 2: If barcode with nutrition label, use rule-based GI
  if (input.nutrition_label && input.input_method === "barcode") {
    return buildBarcodeResult(input)
  }

  // Step 3: FatSecret API lookup
  const nutrition = await resolveNutrition(
    input.food_name,
    input.category ?? "other",
    input.serving_size_g,
  )

  if (!nutrition) {
    // FatSecret didn't find the food — return a not-found result
    return {
      food_name: input.food_name,
      category: input.category ?? "other",
      calories_kcal: null,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
      fiber_g: null,
      serving_size_g: input.total_g,
      serving_label: null,
      glycemic_index: null,
      glycemic_load: null,
      traffic_light: "green",
      confidence: "low",
      gi_source: "unknown",
      swap_suggestion: null,
      disclaimer: "Food not found in FatSecret database.",
      input_method: input.input_method,
      quantity: input.quantity,
      per_unit_gl: null,
      matched_food_id: null,
      match_method: "not_found",
    }
  }

  // Step 4: Estimate GI via GPT-mini (FatSecret doesn't provide GI)
  const giEstimate = await estimateGI(input.food_name, input.category ?? "other")
  const perUnitGL = computeGL(giEstimate, nutrition.carbs_g, input.serving_size_g, input.serving_size_g)
  const totalGL = perUnitGL != null ? Math.round(perUnitGL * input.quantity) : null

  return {
    food_name: nutrition.food_name,
    category: input.category ?? "other",
    calories_kcal: Math.round(nutrition.calories_kcal * input.quantity),
    protein_g: Math.round(nutrition.protein_g * input.quantity * 10) / 10,
    carbs_g: Math.round(nutrition.carbs_g * input.quantity * 10) / 10,
    fat_g: Math.round(nutrition.fat_g * input.quantity * 10) / 10,
    fiber_g: Math.round(nutrition.fiber_g * input.quantity * 10) / 10,
    serving_size_g: input.total_g,
    serving_label: nutrition.serving_label,
    glycemic_index: giEstimate,
    glycemic_load: totalGL,
    traffic_light: classifyGL(totalGL),
    confidence: "medium",
    gi_source: "estimated",
    swap_suggestion: null,
    disclaimer: "Nutrition from FatSecret. GI is AI-estimated. Consult a healthcare professional.",
    input_method: input.input_method,
    quantity: input.quantity,
    per_unit_gl: perUnitGL,
    matched_food_id: null,
    match_method: "fatsecret",
  }
}

// ─── Result Builders ────────────────────────────────────────

function buildDbResult(matched: FoodRow, input: NormalizedFoodInput): ScanResult {
  const servingScale = input.serving_size_g / matched.serving_size_g
  const perUnitGL = computeGL(matched.glycemic_index, matched.available_carbs, input.serving_size_g, matched.serving_size_g)
  const totalGL = perUnitGL != null ? Math.round(perUnitGL * input.quantity) : null

  return {
    food_name: matched.name_display ?? matched.name,
    category: matched.category ?? input.category ?? "other",
    calories_kcal: scaleAndMultiply(matched.calories_kcal, servingScale, input.quantity),
    protein_g: scaleAndMultiply(matched.protein_g, servingScale, input.quantity),
    carbs_g: scaleAndMultiply(matched.carbs_g, servingScale, input.quantity),
    fat_g: scaleAndMultiply(matched.fat_g, servingScale, input.quantity),
    fiber_g: scaleAndMultiply(matched.fiber_g, servingScale, input.quantity),
    serving_size_g: input.total_g,
    serving_label: matched.serving_description,
    glycemic_index: matched.glycemic_index,
    glycemic_load: totalGL,
    traffic_light: classifyGL(totalGL),
    confidence: mapConfidence(matched.confidence_score),
    gi_source: (matched.data_source === "published_study" || matched.data_source === "international_table")
      ? "published" as GiSource
      : "estimated" as GiSource,
    swap_suggestion: matched.swap_tip,
    disclaimer: "Values are estimates. Consult a healthcare professional for medical advice.",
    input_method: input.input_method,
    quantity: input.quantity,
    per_unit_gl: perUnitGL,
    matched_food_id: matched.id,
    match_method: "exact",
  }
}

function buildBarcodeResult(input: NormalizedFoodInput): ScanResult {
  const label = input.nutrition_label!
  const { gi, confidence: giConfidence } = estimateGIFromNutrition(label)
  const availableCarbs = label.carbs_g - label.fiber_g
  const perUnitGL = Math.round((gi * availableCarbs) / 100)
  const totalGL = Math.round(perUnitGL * input.quantity)

  return {
    food_name: input.food_name,
    category: input.category ?? "other",
    calories_kcal: Math.round(label.calories * input.quantity),
    protein_g: Math.round(label.protein_g * input.quantity * 10) / 10,
    carbs_g: Math.round(label.carbs_g * input.quantity * 10) / 10,
    fat_g: Math.round(label.fat_g * input.quantity * 10) / 10,
    fiber_g: Math.round(label.fiber_g * input.quantity * 10) / 10,
    serving_size_g: input.total_g,
    serving_label: null,
    glycemic_index: gi,
    glycemic_load: totalGL,
    traffic_light: classifyGL(totalGL),
    confidence: giConfidence >= 0.5 ? "medium" : "low",
    gi_source: "macro_estimated",
    swap_suggestion: null,
    disclaimer: "Estimated from nutrition label. Consult a healthcare professional for medical advice.",
    input_method: "barcode",
    quantity: input.quantity,
    per_unit_gl: perUnitGL,
    matched_food_id: null,
    match_method: "barcode",
  }
}

// ─── Food Matching ──────────────────────────────────────────

export async function matchFood(
  supabase: ReturnType<typeof createClient>,
  foodName: string,
  foodNameEs: string | null,
): Promise<FoodRow | null> {
  // Exact match (case-insensitive)
  const { data: exact } = await supabase
    .from("foods").select("*").ilike("name", foodName).limit(1).single()
  if (exact) return exact as FoodRow

  // Spanish name exact match
  if (foodNameEs) {
    const { data: exactEs } = await supabase
      .from("foods").select("*").ilike("name", foodNameEs).limit(1).single()
    if (exactEs) return exactEs as FoodRow
  }

  // Alias match
  const { data: alias } = await supabase
    .from("food_aliases").select("food_id").ilike("alias", foodName).limit(1).single()
  if (alias) {
    const { data: food } = await supabase
      .from("foods").select("*").eq("id", alias.food_id).single()
    if (food) return food as FoodRow
  }

  // Spanish alias match
  if (foodNameEs) {
    const { data: aliasEs } = await supabase
      .from("food_aliases").select("food_id").ilike("alias", foodNameEs).limit(1).single()
    if (aliasEs) {
      const { data: food } = await supabase
        .from("foods").select("*").eq("id", aliasEs.food_id).single()
      if (food) return food as FoodRow
    }
  }

  // Fuzzy match via pg_trgm
  const { data: fuzzy } = await supabase
    .rpc("match_food_fuzzy", { search_term: foodName, threshold: 0.3, result_limit: 1 })
  if (fuzzy && fuzzy.length > 0) return fuzzy[0] as FoodRow

  return null
}

// ─── Utilities ──────────────────────────────────────────────

function scaleAndMultiply(value: number | null, scale: number, quantity: number): number | null {
  if (value == null) return null
  return Math.round(value * scale * quantity)
}

export function computeGL(gi: number | null, availableCarbs: number | null, actualG: number, referenceG: number): number | null {
  if (gi == null || availableCarbs == null) return null
  const scaledCarbs = (availableCarbs * actualG) / referenceG
  return Math.round((gi * scaledCarbs) / 100)
}

export function classifyGL(gl: number | null): "green" | "yellow" | "red" {
  if (gl == null || gl < 10) return "green"
  if (gl < 20) return "yellow"
  return "red"
}

export function mapConfidence(score: number | null): Confidence {
  if (score == null) return "low"
  if (score >= 0.8) return "high"
  if (score >= 0.5) return "medium"
  return "low"
}

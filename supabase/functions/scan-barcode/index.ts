import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { corsHeaders } from "../_shared/cors.ts"
import { validateApiKey } from "../_shared/apikey.ts"
import type { BarcodeScanRequest, NormalizedFoodInput } from "../_shared/types.ts"
import { resolveGI } from "../_shared/resolve-gi.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// FatSecret OAuth token cache (lives for the function's cold start lifetime)
let cachedFsToken: { token: string; expiresAt: number } | null = null

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. API key validation (no user auth)
    const denied = validateApiKey(req)
    if (denied) return denied

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 2. Parse input
    const body: BarcodeScanRequest = await req.json()
    if (!body.barcode || typeof body.barcode !== "string") {
      return errorResponse(400, "INVALID_BARCODE", "Missing or invalid barcode")
    }

    const barcode = body.barcode.trim()
    const startTime = Date.now()

    // 3. Check foods table for barcode match (fastest path)
    const { data: dbFood } = await supabaseAdmin
      .from("foods")
      .select("*")
      .eq("barcode", barcode)
      .limit(1)
      .single()

    if (dbFood) {
      const input: NormalizedFoodInput = {
        food_name: dbFood.name,
        food_name_es: dbFood.name_es,
        category: dbFood.category,
        is_mixed_meal: false,
        components: [],
        quantity: 1,
        serving_size_g: dbFood.serving_size_g,
        total_g: dbFood.serving_size_g,
        input_method: "barcode",
        identification_confidence: 1.0,
        barcode,
      }
      const result = await resolveGI(supabaseAdmin, input)
      // Logging handled client-side in SQLite
      return jsonResponse(result)
    }

    // 4. Check packaged_products cache
    const { data: cached } = await supabaseAdmin
      .from("packaged_products")
      .select("*")
      .eq("barcode", barcode)
      .single()

    if (cached?.nutrition_label) {
      // Update scan count
      await supabaseAdmin
        .from("packaged_products")
        .update({ last_scanned_at: new Date().toISOString(), scan_count: (cached.scan_count ?? 0) + 1 })
        .eq("id", cached.id)

      const label = cached.nutrition_label as Record<string, number>
      const input: NormalizedFoodInput = {
        food_name: cached.product_name ?? `Barcode ${barcode}`,
        category: "other",
        is_mixed_meal: false,
        components: [],
        quantity: 1,
        serving_size_g: label.serving_size_g ?? 100,
        total_g: label.serving_size_g ?? 100,
        input_method: "barcode",
        identification_confidence: 0.7,
        barcode,
        nutrition_label: {
          calories: label.calories ?? 0,
          carbs_g: label.carbs_g ?? 0,
          fiber_g: label.fiber_g ?? 0,
          sugar_g: label.sugar_g ?? 0,
          protein_g: label.protein_g ?? 0,
          fat_g: label.fat_g ?? 0,
          serving_size_g: label.serving_size_g ?? 100,
        },
      }
      const result = await resolveGI(supabaseAdmin, input)
      // Logging handled client-side in SQLite
      return jsonResponse(result)
    }

    // 5. FatSecret API (OAuth 2.0 — best barcode coverage)
    try {
      const fsResult = await lookupFatSecret(barcode)
      if (fsResult) {
        // Cache in packaged_products for future lookups
        await supabaseAdmin.from("packaged_products").upsert({
          barcode,
          product_name: fsResult.product_name,
          brand: fsResult.brand,
          nutrition_label: fsResult.nutrition,
          data_source: "fatsecret",
          first_scanned_at: new Date().toISOString(),
          last_scanned_at: new Date().toISOString(),
          scan_count: 1,
        }, { onConflict: "barcode" }).catch(() => {})

        const input: NormalizedFoodInput = {
          food_name: fsResult.product_name,
          category: "other",
          is_mixed_meal: false,
          components: [],
          quantity: 1,
          serving_size_g: fsResult.nutrition.serving_size_g,
          total_g: fsResult.nutrition.serving_size_g,
          input_method: "barcode",
          identification_confidence: fsResult.confidence_score,
          barcode,
          nutrition_label: {
            calories: fsResult.nutrition.calories,
            carbs_g: fsResult.nutrition.carbs,
            fiber_g: fsResult.nutrition.fiber,
            sugar_g: fsResult.nutrition.sugars,
            protein_g: fsResult.nutrition.protein,
            fat_g: fsResult.nutrition.fat,
            serving_size_g: fsResult.nutrition.serving_size_g,
          },
        }
        const result = await resolveGI(supabaseAdmin, input)
        return jsonResponse({ ...result, requires_attribution: true, data_source: "fatsecret" })
      }
    } catch (err) {
      console.warn("FatSecret lookup failed, falling through to OFF:", err)
    }

    // 6. Call Open Food Facts API
    const offResponse = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}`,
      { headers: { "User-Agent": "Loti-App/1.0 (contact@loti.app)" } },
    )

    if (!offResponse.ok) {
      return errorResponse(404, "PRODUCT_NOT_FOUND", "Product not found. Try photo scan or text input.")
    }

    const offData = await offResponse.json()
    if (!offData.product || offData.status === 0) {
      return errorResponse(404, "PRODUCT_NOT_FOUND", "Product not found. Try photo scan or text input.")
    }

    const product = offData.product
    const nutriments = product.nutriments ?? {}

    // Extract nutrition label (per 100g or per serving)
    const servingG = parseFloat(product.serving_quantity) || 100
    const useServing = !!product.serving_quantity

    const getNutrient = (key: string): number => {
      if (useServing) {
        return parseFloat(nutriments[`${key}_serving`]) || parseFloat(nutriments[`${key}_100g`]) * servingG / 100 || 0
      }
      return parseFloat(nutriments[`${key}_100g`]) || 0
    }

    const nutritionLabel = {
      calories: getNutrient("energy-kcal"),
      carbs_g: getNutrient("carbohydrates"),
      fiber_g: getNutrient("fiber"),
      sugar_g: getNutrient("sugars"),
      protein_g: getNutrient("proteins"),
      fat_g: getNutrient("fat"),
      serving_size_g: useServing ? servingG : 100,
    }

    // If we got basically no nutrition data, report not found
    if (nutritionLabel.calories === 0 && nutritionLabel.carbs_g === 0 && nutritionLabel.protein_g === 0) {
      return errorResponse(404, "PRODUCT_NOT_FOUND", "No nutrition data available. Try photo scan or text input.")
    }

    const productName = product.product_name ?? product.product_name_en ?? `Barcode ${barcode}`
    const brand = product.brands ?? null

    // 6. Cache in packaged_products
    await supabaseAdmin.from("packaged_products").upsert({
      barcode,
      product_name: productName,
      brand,
      nutrition_label: nutritionLabel,
      open_food_facts_data: { categories: product.categories, ingredients_text: product.ingredients_text },
      first_scanned_at: new Date().toISOString(),
      last_scanned_at: new Date().toISOString(),
      scan_count: 1,
    }, { onConflict: "barcode" })

    // 7. Build NormalizedFoodInput and resolve
    const input: NormalizedFoodInput = {
      food_name: productName,
      category: "other",
      is_mixed_meal: false,
      components: [],
      quantity: 1,
      serving_size_g: nutritionLabel.serving_size_g,
      total_g: nutritionLabel.serving_size_g,
      input_method: "barcode",
      identification_confidence: 0.7,
      barcode,
      nutrition_label: nutritionLabel,
    }

    const result = await resolveGI(supabaseAdmin, input)
    return jsonResponse(result)
  } catch (err) {
    console.error("Barcode scan error:", err)
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred")
  }
})

// ─── Helpers ────────────────────────────────────────────────

function errorResponse(status: number, error: string, message: string) {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// ─── FatSecret OAuth 2.0 + Barcode Lookup ────────────────────

interface FatSecretResult {
  product_name: string
  brand: string | null
  nutrition: {
    calories: number
    carbs: number
    sugars: number
    fiber: number
    protein: number
    fat: number
    serving_size_g: number
    serving_description: string
  }
  estimated_gi: number
  estimated_gl: number
  confidence_score: number
}

async function lookupFatSecret(barcode: string): Promise<FatSecretResult | null> {
  const clientId = Deno.env.get("FATSECRET_CLIENT_ID")
  const clientSecret = Deno.env.get("FATSECRET_CLIENT_SECRET")
  if (!clientId || !clientSecret) return null

  const token = await getFatSecretToken(clientId, clientSecret)

  // Find food ID by barcode
  const findRes = await fetch(
    `https://platform.fatsecret.com/rest/food/barcode/findIdForBarcode/v1?barcode=${barcode}&format=json`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!findRes.ok) return null

  const findData = await findRes.json()
  const foodId = findData?.food_id?.value
  if (!foodId) return null

  // Get full food details
  const foodRes = await fetch(
    `https://platform.fatsecret.com/rest/food/v4?food_id=${foodId}&format=json&include_food_attributes=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!foodRes.ok) return null

  const foodData = await foodRes.json()
  const food = foodData?.food
  if (!food) return null

  // Extract nutrition
  const servings = Array.isArray(food.servings?.serving)
    ? food.servings.serving
    : food.servings?.serving ? [food.servings.serving] : []

  const serving = servings.find((s: any) =>
    s.metric_serving_unit === "g" && parseFloat(s.metric_serving_amount) === 100,
  ) || servings[0]

  if (!serving) return null

  const carbs = parseFloat(serving.carbohydrate || "0")
  const sugars = parseFloat(serving.sugar || "0")
  const fiber = parseFloat(serving.fiber || "0")
  const protein = parseFloat(serving.protein || "0")
  const fat = parseFloat(serving.fat || "0")
  const calories = parseFloat(serving.calories || "0")
  const servingSize = parseFloat(serving.metric_serving_amount || "100")

  const estimatedGI = estimateGIFromMacros(carbs, sugars, fiber, protein, fat, calories, food.food_type)
  const availableCarbs = Math.max(0, (carbs * servingSize / 100) - (fiber * servingSize / 100))
  const estimatedGL = Math.round((estimatedGI * availableCarbs) / 100)

  return {
    product_name: food.food_name,
    brand: food.brand_name || null,
    nutrition: {
      calories, carbs, sugars, fiber, protein, fat,
      serving_size_g: servingSize,
      serving_description: serving.serving_description ?? "",
    },
    estimated_gi: estimatedGI,
    estimated_gl: estimatedGL,
    confidence_score: estimateConfidence(carbs, sugars, fiber),
  }
}

async function getFatSecretToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedFsToken && cachedFsToken.expiresAt > Date.now() + 60000) {
    return cachedFsToken.token
  }

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials&scope=premier",
  })

  if (!res.ok) throw new Error(`FatSecret OAuth failed: ${res.status}`)
  const data = await res.json()

  cachedFsToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

function estimateGIFromMacros(
  carbs: number, sugars: number, fiber: number,
  protein: number, fat: number, calories: number,
  foodType?: string,
): number {
  if (carbs < 5) return 0
  const sugarRatio = sugars / Math.max(carbs, 1)
  const fiberRatio = fiber / Math.max(carbs, 1)
  const fatProteinRatio = (fat + protein) / Math.max(calories / 100, 1)

  if (foodType === "Brand" && sugarRatio > 0.8 && fiber < 1) return 85
  if (sugarRatio > 0.6 && fiber < 2) return 80
  if (sugarRatio > 0.4 && fiber < 3) return 70
  if (fiberRatio > 0.2) return 30
  if (fiberRatio > 0.15) return 35
  if (fiberRatio > 0.08) return 45
  if (fatProteinRatio > 0.5 && sugarRatio < 0.3) return 45
  if (sugarRatio > 0.2 && fiberRatio > 0.05) return 55
  return 60
}

function estimateConfidence(carbs: number, sugars: number, fiber: number): number {
  if (carbs < 5) return 0.9
  if (sugars > 30 && fiber < 1) return 0.75
  if (fiber > 5 && sugars < 5) return 0.7
  return 0.5
}

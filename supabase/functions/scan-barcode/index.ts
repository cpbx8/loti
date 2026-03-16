import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { corsHeaders } from "../_shared/cors.ts"
import type { BarcodeScanRequest, NormalizedFoodInput } from "../_shared/types.ts"
import { resolveGI } from "../_shared/resolve-gi.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Auth (optional — app works without login)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let userId: string | null = null
    const authHeader = req.headers.get("Authorization")
    if (authHeader) {
      try {
        const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data: { user } } = await anonClient.auth.getUser()
        userId = user?.id ?? null
      } catch { /* auth failed, continue anonymously */ }
    }

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
      if (userId) await logScan(supabaseAdmin, userId, result, barcode, startTime, body.meal_type ?? null)
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
      if (userId) await logScan(supabaseAdmin, userId, result, barcode, startTime, body.meal_type ?? null)
      return jsonResponse(result)
    }

    // 5. Call Open Food Facts API
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
    if (userId) await logScan(supabaseAdmin, userId, result, barcode, startTime, body.meal_type ?? null)
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

async function logScan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  result: import("../_shared/types.ts").ScanResult,
  barcode: string,
  startTime: number,
  mealType: string | null,
) {
  await supabase.from("scan_logs").insert({
    user_id: userId,
    food_name: result.food_name,
    matched_food_id: result.matched_food_id,
    match_method: result.match_method,
    input_method: "barcode",
    quantity: 1,
    calories_kcal: result.calories_kcal,
    protein_g: result.protein_g,
    carbs_g: result.carbs_g,
    fat_g: result.fat_g,
    fiber_g: result.fiber_g,
    result_gi: result.glycemic_index,
    result_gl: result.glycemic_load,
    result_traffic_light: result.traffic_light,
    confidence_score: result.confidence === "high" ? 0.9 : result.confidence === "medium" ? 0.7 : 0.4,
    serving_size_g: result.serving_size_g,
    meal_type: mealType,
    response_time_ms: Date.now() - startTime,
  })
}

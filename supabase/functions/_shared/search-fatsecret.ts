/**
 * Tier 1 — FatSecret API (Free tier, 5K calls/day)
 *
 * Text search via FatSecret foods.search endpoint.
 * Barcode lookup via food.find_id_for_barcode.
 * Returns normalized FoodSearchResult.
 */

import type { FoodSearchResult } from "./waterfall-types.ts"

const FATSECRET_CLIENT_ID = Deno.env.get("FATSECRET_CLIENT_ID") ?? ""
const FATSECRET_CLIENT_SECRET = Deno.env.get("FATSECRET_CLIENT_SECRET") ?? ""
const TIMEOUT_MS = 5000

let tokenCache: { token: string; expiry: number } | null = null

// ─── Auth ────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiry) return tokenCache.token

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: FATSECRET_CLIENT_ID,
      client_secret: FATSECRET_CLIENT_SECRET,
      scope: "basic",
    }),
  })

  if (!res.ok) throw new Error(`FatSecret token error: ${res.status}`)
  const data = await res.json()
  tokenCache = { token: data.access_token, expiry: Date.now() + (data.expires_in - 60) * 1000 }
  return tokenCache.token
}

// ─── Text Search ─────────────────────────────────────────────

export async function searchFatSecretText(query: string): Promise<FoodSearchResult[]> {
  if (!FATSECRET_CLIENT_ID) {
    console.log("[waterfall] fatsecret SKIP — no credentials")
    return []
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const token = await getToken()
    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/foods/search/v1?search_expression=${encodeURIComponent(query)}&format=json&max_results=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)

    if (!searchRes.ok) {
      console.log(`[waterfall] fatsecret text MISS for "${query}" (HTTP ${searchRes.status})`)
      return []
    }

    const searchData = await searchRes.json()
    const foods = searchData?.foods?.food
    if (!foods || (Array.isArray(foods) && foods.length === 0)) {
      console.log(`[waterfall] fatsecret text MISS for "${query}"`)
      return []
    }

    const foodList = Array.isArray(foods) ? foods : [foods]
    const results: FoodSearchResult[] = []

    // Get details for top results (max 3 to conserve API calls)
    for (const food of foodList.slice(0, 3)) {
      const result = await getFoodDetail(food.food_id, food.food_name, token)
      if (result) results.push(result)
    }

    console.log(`[waterfall] fatsecret text ${results.length > 0 ? "HIT" : "MISS"} for "${query}" — ${results.length} results`)
    return results
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[waterfall] fatsecret text TIMEOUT for "${query}"`)
    } else {
      console.error(`[waterfall] fatsecret text error for "${query}":`, err)
    }
    return []
  }
}

// ─── Barcode Lookup ──────────────────────────────────────────

export async function searchFatSecretBarcode(barcode: string): Promise<FoodSearchResult | null> {
  if (!FATSECRET_CLIENT_ID) {
    console.log("[waterfall] fatsecret barcode SKIP — no credentials")
    return null
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const token = await getToken()

    // Find food ID for barcode
    const res = await fetch(
      `https://platform.fatsecret.com/rest/food/v4?method=food.find_id_for_barcode&barcode=${encodeURIComponent(barcode)}&format=json`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)

    if (!res.ok) {
      console.log(`[waterfall] fatsecret barcode MISS for "${barcode}"`)
      return null
    }

    const data = await res.json()
    const foodId = data?.food_id?.value
    if (!foodId) {
      console.log(`[waterfall] fatsecret barcode MISS for "${barcode}"`)
      return null
    }

    const result = await getFoodDetail(foodId, undefined, token)
    if (result) {
      result.barcode = barcode
      console.log(`[waterfall] fatsecret barcode HIT for "${barcode}" → ${result.name_es}`)
    }
    return result
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[waterfall] fatsecret barcode TIMEOUT for "${barcode}"`)
    } else {
      console.error(`[waterfall] fatsecret barcode error for "${barcode}":`, err)
    }
    return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────

async function getFoodDetail(
  foodId: string,
  fallbackName: string | undefined,
  token: string,
): Promise<FoodSearchResult | null> {
  try {
    const res = await fetch(
      `https://platform.fatsecret.com/rest/food/v4?food_id=${foodId}&format=json`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) return null

    const data = await res.json()
    const food = data?.food
    if (!food) return null

    const servings = food.servings?.serving
    if (!servings) return null

    const servingList = Array.isArray(servings) ? servings : [servings]

    // Prefer per-100g serving, then fallback to first serving
    const per100 = servingList.find(
      (s: Record<string, string>) =>
        s.metric_serving_unit === "g" && s.metric_serving_amount === "100.000",
    )
    const serving = per100 ?? servingList[0]

    const metricAmount = parseFloat(serving.metric_serving_amount ?? "100")
    const servingUnit = serving.metric_serving_unit ?? "g"

    return {
      name_es: food.food_name ?? fallbackName ?? "Unknown",
      name_en: food.food_name ?? fallbackName,
      calories: Math.round(parseFloat(serving.calories ?? "0")),
      protein_g: Math.round(parseFloat(serving.protein ?? "0") * 10) / 10,
      carbs_g: Math.round(parseFloat(serving.carbohydrate ?? "0") * 10) / 10,
      fat_g: Math.round(parseFloat(serving.fat ?? "0") * 10) / 10,
      fiber_g: Math.round(parseFloat(serving.fiber ?? "0") * 10) / 10,
      serving_size: metricAmount,
      serving_unit: servingUnit,
      serving_description: serving.serving_description ?? undefined,
      source: "fatsecret",
      source_id: foodId,
      confidence: 0.95,
    }
  } catch {
    return null
  }
}

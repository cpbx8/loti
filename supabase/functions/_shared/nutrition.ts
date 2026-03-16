/** Shared nutrition resolution: FatSecret API only */

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const FATSECRET_CLIENT_ID = Deno.env.get("FATSECRET_CLIENT_ID") ?? ""
const FATSECRET_CLIENT_SECRET = Deno.env.get("FATSECRET_CLIENT_SECRET") ?? ""
const USDA_API_KEY = Deno.env.get("USDA_API_KEY") ?? ""

// ─── Public API ─────────────────────────────────────────────

export interface NutritionData {
  food_name: string
  serving_label: string | null
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  source: "fatsecret"
}

/**
 * Resolve nutrition data via FatSecret API only.
 * Returns null if food not found.
 */
export async function resolveNutrition(
  foodName: string,
  _category: string,
  servingG: number,
): Promise<NutritionData | null> {
  if (FATSECRET_CLIENT_ID) {
    const fs = await searchFatSecret(foodName, servingG)
    if (fs) return { ...fs, source: "fatsecret" }
  }
  return null
}

export interface NutritionEstimate {
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  glycemic_index: number
  swap_suggestion: string | null
}

export async function estimateNutrition(
  foodName: string,
  category: string,
  servingG: number,
): Promise<NutritionEstimate> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 200,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. Given a food name, category, and serving size, estimate macros and glycemic index. Use established nutrition databases as reference. For Mexican mixed meals, GI tends to be 10-15% higher than calculated from individual ingredients.

Return ONLY valid JSON with these fields:
- calories_kcal: number
- protein_g: number (1 decimal)
- carbs_g: number (1 decimal)
- fat_g: number (1 decimal)
- fiber_g: number (1 decimal)
- glycemic_index: number (integer, 0-100)
- swap_suggestion: string|null (a lower-GI alternative if GI > 55)`,
        },
        {
          role: "user",
          content: `Food: ${foodName}\nCategory: ${category}\nServing: ${servingG}g`,
        },
      ],
    }),
  })

  if (!response.ok) {
    return {
      calories_kcal: Math.round(servingG * 1.5),
      protein_g: Math.round(servingG * 0.08),
      carbs_g: Math.round(servingG * 0.2),
      fat_g: Math.round(servingG * 0.05),
      fiber_g: Math.round(servingG * 0.02),
      glycemic_index: 55,
      swap_suggestion: null,
    }
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
  return JSON.parse(jsonStr)
}

export async function estimateGI(foodName: string, category: string): Promise<number> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 50,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You are a glycemic index expert. Given a food name and category, return ONLY a single integer (0-100) representing the estimated glycemic index. No explanation, no JSON, just the number.",
          },
          { role: "user", content: `Food: ${foodName}, Category: ${category}` },
        ],
      }),
    })

    if (!response.ok) return 55

    const data = await response.json()
    const gi = parseInt(data.choices[0].message.content.trim(), 10)
    return isNaN(gi) ? 55 : Math.min(100, Math.max(0, gi))
  } catch {
    return 55
  }
}

/**
 * Rule-based GI estimation from nutrition label (for barcode scans).
 * Avoids a GPT call for packaged foods.
 */
export function estimateGIFromNutrition(label: {
  carbs_g: number; fiber_g: number; sugar_g: number; protein_g: number; fat_g: number
}): { gi: number; confidence: number } {
  const { carbs_g, fiber_g, sugar_g, protein_g, fat_g } = label
  const available_carbs = carbs_g - fiber_g

  if (available_carbs < 5) return { gi: 0, confidence: 0.8 }

  const sugar_ratio = sugar_g / carbs_g
  const fiber_ratio = fiber_g / carbs_g
  const protein_fat_ratio = (protein_g + fat_g) / carbs_g

  let gi = 65

  if (sugar_ratio > 0.5) gi += 15
  else if (sugar_ratio > 0.3) gi += 8

  if (fiber_ratio > 0.15) gi -= 15
  else if (fiber_ratio > 0.08) gi -= 8

  if (protein_fat_ratio > 1.0) gi -= 12
  else if (protein_fat_ratio > 0.5) gi -= 6

  gi = Math.max(10, Math.min(100, gi))

  const confidence = (sugar_ratio > 0.5 || fiber_ratio > 0.15) ? 0.55 : 0.4

  return { gi: Math.round(gi), confidence }
}

// ─── FatSecret ──────────────────────────────────────────────

let fatSecretToken: string | null = null
let fatSecretTokenExpiry = 0

async function getFatSecretToken(): Promise<string> {
  if (fatSecretToken && Date.now() < fatSecretTokenExpiry) return fatSecretToken

  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: FATSECRET_CLIENT_ID,
      client_secret: FATSECRET_CLIENT_SECRET,
      scope: "basic",
    }),
  })

  if (!response.ok) throw new Error(`FatSecret token error: ${response.status}`)

  const data = await response.json()
  fatSecretToken = data.access_token
  fatSecretTokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return fatSecretToken!
}

interface FatSecretResult {
  food_name: string
  serving_label: string | null
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

async function searchFatSecret(foodName: string, servingG: number): Promise<FatSecretResult | null> {
  try {
    const token = await getFatSecretToken()

    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/foods/search/v1?search_expression=${encodeURIComponent(foodName)}&format=json&max_results=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const foods = searchData?.foods?.food
    if (!foods || (Array.isArray(foods) && foods.length === 0)) return null

    const food = Array.isArray(foods) ? foods[0] : foods

    const detailRes = await fetch(
      `https://platform.fatsecret.com/rest/food/v4?food_id=${food.food_id}&format=json`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!detailRes.ok) return null

    const detailData = await detailRes.json()
    const servings = detailData?.food?.servings?.serving
    if (!servings) return null

    const servingList = Array.isArray(servings) ? servings : [servings]
    const per100 = servingList.find(
      (s: Record<string, string>) => s.metric_serving_unit === "g" && s.metric_serving_amount === "100.000",
    )
    const serving = per100 ?? servingList[0]

    const metricAmount = parseFloat(serving.metric_serving_amount ?? serving.serving_amount ?? "100")
    const scale = servingG / metricAmount

    return {
      food_name: food.food_name,
      serving_label: serving.serving_description ?? null,
      calories_kcal: Math.round(parseFloat(serving.calories ?? "0") * scale),
      protein_g: Math.round(parseFloat(serving.protein ?? "0") * scale * 10) / 10,
      carbs_g: Math.round(parseFloat(serving.carbohydrate ?? "0") * scale * 10) / 10,
      fat_g: Math.round(parseFloat(serving.fat ?? "0") * scale * 10) / 10,
      fiber_g: Math.round(parseFloat(serving.fiber ?? "0") * scale * 10) / 10,
    }
  } catch (err) {
    console.error("FatSecret search error:", err)
    return null
  }
}

// ─── USDA FoodData Central ──────────────────────────────────

interface UsdaResult {
  food_name: string
  calories_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

async function searchUSDA(foodName: string, servingG: number): Promise<UsdaResult | null> {
  try {
    const searchRes = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&dataType=Foundation,SR%20Legacy&api_key=${USDA_API_KEY}`,
    )
    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const foods = searchData?.foods
    if (!foods || foods.length === 0) return null

    const food = foods[0]
    const nutrients = food.foodNutrients ?? []

    const getNutrient = (id: number): number => {
      const n = nutrients.find((n: { nutrientId: number }) => n.nutrientId === id)
      return n?.value ?? 0
    }

    const scale = servingG / 100

    return {
      food_name: food.description ?? foodName,
      calories_kcal: Math.round(getNutrient(1008) * scale),
      protein_g: Math.round(getNutrient(1003) * scale * 10) / 10,
      carbs_g: Math.round(getNutrient(1005) * scale * 10) / 10,
      fat_g: Math.round(getNutrient(1004) * scale * 10) / 10,
      fiber_g: Math.round(getNutrient(1079) * scale * 10) / 10,
    }
  } catch (err) {
    console.error("USDA search error:", err)
    return null
  }
}

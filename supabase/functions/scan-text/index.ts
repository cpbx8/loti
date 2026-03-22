import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { corsHeaders } from "../_shared/cors.ts"
import { validateApiKey } from "../_shared/apikey.ts"
import type { TextScanRequest, TextParseResponse, NormalizedFoodInput, ScanResult, MealResult } from "../_shared/types.ts"
import { resolveGI, classifyGL } from "../_shared/resolve-gi.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ─── Word-to-number maps (EN + ES) ─────────────────────────

const WORD_TO_NUM: Record<string, number> = {
  // English
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  couple: 2, few: 3, half: 0.5,
  // Spanish
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  unos: 2, unas: 2, medio: 0.5, media: 0.5,
}

// Filler phrases to strip
const FILLER_RE = /^(i ate|i had|i just had|just had|i just ate|had|ate|me com[ií]|com[ií]|tom[eé]|me tom[eé]|desayun[eé]|cen[eé])\s+/i

// Delimiter split
const DELIMITER_RE = /\s*(?:,|;|\band\b|\by\b)\s*/i

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. API key validation (no user auth)
    const denied = validateApiKey(req)
    if (denied) return denied

    // 2. Parse input
    const body: TextScanRequest = await req.json()
    if (!body.text || typeof body.text !== "string" || body.text.trim().length === 0) {
      return errorResponse(400, "INVALID_INPUT", "Text input is required")
    }

    const startTime = Date.now()
    const rawText = body.text.trim()

    // 3. Parse food items — GPT parses first for accurate decomposition, rule-based as fallback
    let parsedItems: ParsedItem[] = []
    let parseMethod: "rule_based" | "gpt_mini" = "gpt_mini"

    // Always try GPT first — it handles complex inputs like "rice with shrimp" correctly
    const gptItems = await parseTextGPT(rawText, body.locale ?? "en")
    if (gptItems.length > 0) {
      parsedItems = gptItems
    } else {
      // Fallback to rule-based only if GPT fails
      parsedItems = parseTextRuleBased(rawText)
      parseMethod = "rule_based"
    }

    if (parsedItems.length === 0) {
      return errorResponse(422, "PARSE_FAILED", "Could not understand the food input. Try being more specific.")
    }

    // 4. Build results — use GPT nutrition when available, fall back to resolveGI
    const results: ScanResult[] = []
    for (const item of parsedItems) {
      // If GPT provided full nutrition + GI estimates, use them directly
      if (parseMethod === "gpt_mini" && item.glycemic_index != null && item.glycemic_load != null) {
        const totalGL = Math.round((item.glycemic_load ?? 0) * item.quantity)
        results.push({
          food_name: item.food_name,
          category: "other",
          calories_kcal: Math.round((item.calories_kcal ?? 0) * item.quantity),
          protein_g: Math.round((item.protein_g ?? 0) * item.quantity * 10) / 10,
          carbs_g: Math.round((item.carbs_g ?? 0) * item.quantity * 10) / 10,
          fat_g: Math.round((item.fat_g ?? 0) * item.quantity * 10) / 10,
          fiber_g: Math.round((item.fiber_g ?? 0) * item.quantity * 10) / 10,
          serving_size_g: item.estimated_serving_g * item.quantity,
          serving_label: `${item.quantity} serving${item.quantity > 1 ? "s" : ""}`,
          glycemic_index: item.glycemic_index,
          glycemic_load: totalGL,
          traffic_light: classifyGL(totalGL),
          confidence: "medium",
          gi_source: "estimated",
          swap_suggestion: item.swap_tip ?? null,
          disclaimer: "AI-estimated nutrition and GI. Consult a healthcare professional.",
          input_method: "text_input",
          quantity: item.quantity,
          per_unit_gl: item.glycemic_load,
          matched_food_id: null,
          match_method: "gpt_estimated",
        } as ScanResult)
        continue
      }

      // Fall back to FatSecret → GPT pipeline
      const input: NormalizedFoodInput = {
        food_name: item.food_name,
        food_name_es: null,
        category: "other",
        is_mixed_meal: item.is_mixed_meal ?? false,
        components: item.components ?? [],
        quantity: item.quantity,
        serving_size_g: item.estimated_serving_g,
        total_g: item.estimated_serving_g * item.quantity,
        input_method: "text_input",
        identification_confidence: 0.7,
      }
      const result = await resolveGI(supabaseAdmin, input, { skipDbMatch: true })
      results.push(result)
    }

    // 7. Return single or multi
    if (results.length === 1) {
      return jsonResponse(results[0])
    }

    const mealResult = buildMealResult(results)
    return jsonResponse(mealResult)

  } catch (err) {
    console.error("Text scan error:", err)
    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred")
  }
})

// ─── Rule-based Parser ──────────────────────────────────────

interface ParsedItem {
  food_name: string
  quantity: number
  estimated_serving_g: number
  is_mixed_meal?: boolean
  components?: Array<{ name: string; estimated_g: number }>
  modifiers?: string[]
  glycemic_index?: number
  glycemic_load?: number
  swap_tip?: string | null
  calories_kcal?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
}

function parseTextRuleBased(text: string): ParsedItem[] {
  // Normalize
  let cleaned = text.toLowerCase().trim()
  cleaned = cleaned.replace(FILLER_RE, "")

  // Split on delimiters
  const segments = cleaned.split(DELIMITER_RE).filter(Boolean).map((s) => s.trim()).filter(Boolean)

  if (segments.length === 0) return []

  const items: ParsedItem[] = []
  for (const seg of segments) {
    const parsed = extractQuantityAndFood(seg)
    if (parsed) {
      items.push(parsed)
    }
  }

  return items
}

function extractQuantityAndFood(segment: string): ParsedItem | null {
  // Try numeric prefix: "2 tacos", "3.5 cups of rice"
  const numMatch = segment.match(/^(\d+(?:\.\d+)?)\s+(.+)$/)
  if (numMatch) {
    const qty = parseFloat(numMatch[1])
    const food = numMatch[2].replace(/^(?:of|de)\s+/i, "").trim()
    if (food.length > 0) {
      return { food_name: food, quantity: qty, estimated_serving_g: 100 }
    }
  }

  // Try word prefix: "a taco", "two tacos", "un taco"
  const words = segment.split(/\s+/)
  if (words.length >= 2) {
    const firstWord = words[0]
    if (WORD_TO_NUM[firstWord] !== undefined) {
      const qty = WORD_TO_NUM[firstWord]
      const food = words.slice(1).join(" ").replace(/^(?:of|de)\s+/i, "").trim()
      if (food.length > 0) {
        return { food_name: food, quantity: qty, estimated_serving_g: 100 }
      }
    }
  }

  // No quantity prefix — default to 1
  if (segment.length > 0) {
    return { food_name: segment, quantity: 1, estimated_serving_g: 100 }
  }

  return null
}

// ─── GPT-4o-mini Parser ─────────────────────────────────────

async function parseTextGPT(text: string, locale: string): Promise<ParsedItem[]> {
  const systemPrompt = `You are a food input parser for a diabetes glycemic load tracker. Parse the user's natural language food description into structured data.

Return ONLY valid JSON matching this schema:
{
  "items": [
    {
      "food_name": "string (common name, lowercase)",
      "quantity": number (default 1),
      "estimated_serving_g": number (realistic serving weight in grams),
      "modifiers": ["string"],
      "is_mixed_meal": boolean,
      "components": [{"name": "string", "estimated_g": number}],
      "glycemic_index": number (estimated GI),
      "glycemic_load": number (estimated GL per serving),
      "swap_tip": "string or null (healthier alternative if GL > 15)",
      "calories_kcal": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number
    }
  ],
  "parse_confidence": number (0-1)
}

CRITICAL RULES (follow ALL strictly):
- Support both English and Spanish input
- "a taco" = quantity 1, "2 tacos" = quantity 2, "4 eggs" = quantity 4
- estimated_serving_g = weight of ONE UNIT (1 egg ≈ 50g, 1 taco ≈ 70g, 1 banana ≈ 120g, 1 cup rice ≈ 185g)
- ALL nutrition values (calories_kcal, protein_g, carbs_g, fat_g, fiber_g, glycemic_load) are PER SINGLE UNIT, NOT multiplied by quantity
  Example: "4 eggs" → quantity: 4, calories_kcal: 72 (per 1 egg), protein_g: 6 (per 1 egg)
  Example: "2 tacos" → quantity: 2, calories_kcal: 180 (per 1 taco), protein_g: 9 (per 1 taco)
- Each item should be a distinct dish or food. "1 cup white rice with shrimp" = 1 item. "2 tacos and a soda" = 2 items.
- food_name: the dish as the user said it (e.g. "white rice with shrimp", "tacos de bistec")
- For mixed meals, set is_mixed_meal: true and list components
- REQUIRED: Every item MUST include glycemic_index, glycemic_load, calories_kcal, protein_g, carbs_g, fat_g, fiber_g
- glycemic_index: estimated GI of the food as served
- glycemic_load: GL PER SINGLE SERVING = (GI × carbs_g) / 100
- swap_tip: suggest a healthier alternative only if GL > 15, otherwise null
- Always return at least one item if any food is mentioned`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this food input (locale: ${locale}): "${text}"` },
      ],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: "json_object" },
    }),
  })

  if (!response.ok) {
    console.error("GPT-4o-mini error:", response.status, await response.text())
    return []
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return []

  try {
    const parsed = JSON.parse(content)
    return (parsed.items ?? []).map((item: Record<string, unknown>) => ({
      food_name: item.food_name as string,
      quantity: (item.quantity as number) || 1,
      estimated_serving_g: (item.estimated_serving_g as number) || 100,
      modifiers: item.modifiers as string[] | undefined,
      is_mixed_meal: item.is_mixed_meal as boolean | undefined,
      components: item.components as Array<{ name: string; estimated_g: number }> | undefined,
      glycemic_index: item.glycemic_index as number | undefined,
      glycemic_load: item.glycemic_load as number | undefined,
      swap_tip: item.swap_tip as string | null | undefined,
      calories_kcal: item.calories_kcal as number | undefined,
      protein_g: item.protein_g as number | undefined,
      carbs_g: item.carbs_g as number | undefined,
      fat_g: item.fat_g as number | undefined,
      fiber_g: item.fiber_g as number | undefined,
    }))
  } catch {
    console.error("Failed to parse GPT response:", content)
    return []
  }
}

// ─── Meal Aggregation ───────────────────────────────────────

function buildMealResult(items: ScanResult[]): MealResult {
  const totalGL = items.reduce((sum, r) => sum + (r.glycemic_load ?? 0), 0)
  const totalCalories = items.reduce((sum, r) => sum + (r.calories_kcal ?? 0), 0)
  const totalProtein = items.reduce((sum, r) => sum + (r.protein_g ?? 0), 0)
  const totalCarbs = items.reduce((sum, r) => sum + (r.carbs_g ?? 0), 0)
  const totalFat = items.reduce((sum, r) => sum + (r.fat_g ?? 0), 0)

  return {
    items,
    meal_total: {
      total_gl: totalGL,
      traffic_light: classifyGL(totalGL),
      total_calories: Math.round(totalCalories),
      total_protein_g: Math.round(totalProtein * 10) / 10,
      total_carbs_g: Math.round(totalCarbs * 10) / 10,
      total_fat_g: Math.round(totalFat * 10) / 10,
    },
  }
}

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

// Server-side logging removed — scan logs are stored on-device (SQLite)

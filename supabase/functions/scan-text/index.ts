import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { corsHeaders } from "../_shared/cors.ts"
import { validateApiKey } from "../_shared/apikey.ts"
import type { TextScanRequest, TextParseResponse, NormalizedFoodInput, ScanResult, MealResult } from "../_shared/types.ts"
import { resolveGI, classifyGL } from "../_shared/resolve-gi.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!

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

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Legacy auth block removed — userId no longer needed
    const userId: string | null = null
    if (false) {
      } catch { /* auth failed, continue anonymously */ }
    }

    // 1b. Check scan permission (trial/premium gating)
    if (userId) {
      try {
        const { data: permission } = await supabaseAdmin.rpc("check_scan_permission", { p_user_id: userId })
        if (permission && !permission.allowed) {
          return new Response(
            JSON.stringify({ error: "SCAN_LIMIT_REACHED", reason: permission.reason, scans_remaining: 0 }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          )
        }
      } catch { /* fail open if RPC not available */ }
    }

    // 2. Parse input
    const body: TextScanRequest = await req.json()
    if (!body.text || typeof body.text !== "string" || body.text.trim().length === 0) {
      return errorResponse(400, "INVALID_INPUT", "Text input is required")
    }

    const startTime = Date.now()
    const rawText = body.text.trim()

    // 3. Parse food items — try rule-based for quantity extraction, then GPT for complex input
    let parsedItems = parseTextRuleBased(rawText)
    let parseMethod: "rule_based" | "gpt_mini" = "rule_based"

    // For multi-word or complex inputs, use GPT parser for better food names + serving estimates
    if (parsedItems.length === 0 || rawText.includes(" ") && parsedItems.length === 1) {
      const gptItems = await parseTextGPT(rawText, body.locale ?? "en")
      if (gptItems.length > 0) {
        parsedItems = gptItems
        parseMethod = "gpt_mini"
      }
    }

    if (parsedItems.length === 0) {
      return errorResponse(422, "PARSE_FAILED", "Could not understand the food input. Try being more specific.")
    }

    // 4. Resolve each item via FatSecret → USDA → GPT estimation (NO DB fuzzy matching)
    const results: ScanResult[] = []
    for (const item of parsedItems) {
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

    // 7. Log each item (only if authenticated)
    if (userId) {
      for (const result of results) {
        // logScan removed — logging handled client-side in SQLite
      }
    }

    // 8. Return single or multi
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
  const systemPrompt = `You are a food input parser. Parse the user's natural language food description into structured data.

Return ONLY valid JSON matching this schema:
{
  "items": [
    {
      "food_name": "string (common name, lowercase)",
      "quantity": number (default 1),
      "estimated_serving_g": number (realistic serving weight in grams),
      "modifiers": ["string"],
      "is_mixed_meal": boolean,
      "components": [{"name": "string", "estimated_g": number}]
    }
  ],
  "parse_confidence": number (0-1)
}

Rules:
- Support both English and Spanish input
- "a taco" = quantity 1, "2 tacos" = quantity 2
- Estimate realistic serving_g (a taco ≈ 60-80g, a banana ≈ 120g, a cup of rice ≈ 185g)
- For mixed meals (e.g., "burrito"), set is_mixed_meal: true and list components
- If input is unclear, use your best judgment and set parse_confidence lower
- food_name should be the simple, canonical name (e.g., "taco" not "corn taco with meat")
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
    const parsed: TextParseResponse = JSON.parse(content)
    return (parsed.items ?? []).map((item) => ({
      food_name: item.food_name,
      quantity: item.quantity || 1,
      estimated_serving_g: item.estimated_serving_g || 100,
      modifiers: item.modifiers,
      is_mixed_meal: item.is_mixed_meal,
      components: item.components,
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

async function logScan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  result: ScanResult,
  startTime: number,
  mealType: string | null,
  parseMethod: string,
) {
  await supabase.from("scan_logs").insert({
    user_id: userId,
    food_name: result.food_name,
    matched_food_id: result.matched_food_id,
    match_method: `text_${parseMethod}:${result.match_method}`,
    input_method: "text_input",
    quantity: result.quantity,
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

  // Increment daily scan counter
  await supabase.rpc("increment_scan_count", { p_user_id: userId }).catch(() => {})
}

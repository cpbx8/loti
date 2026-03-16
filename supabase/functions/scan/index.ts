import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { corsHeaders } from "../_shared/cors.ts"
import type { ScanRequest, ScanResult, NormalizedFoodInput, VisionResponse } from "../_shared/types.ts"
import { resolveGI } from "../_shared/resolve-gi.ts"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RATE_LIMIT_PER_HOUR = parseInt(Deno.env.get("RATE_LIMIT_PER_HOUR") ?? "20")

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

    // 2. Rate limit (only for authenticated users)
    if (userId) {
      const rateLimited = await checkRateLimit(supabaseAdmin, userId)
      if (rateLimited) {
        return errorResponse(429, "RATE_LIMITED", `Limit: ${RATE_LIMIT_PER_HOUR} scans/hour`)
      }
    }

    // 3. Parse & validate input
    const body: ScanRequest = await req.json()
    if (!body.image_base64) {
      return errorResponse(400, "INVALID_IMAGE", "Missing image_base64")
    }
    if (body.image_base64.length > 4 * 1024 * 1024) {
      return errorResponse(400, "INVALID_IMAGE", "Image exceeds 4MB")
    }

    const startTime = Date.now()

    // 4. GPT-4o Vision — identify the food
    const vision = await identifyFood(body.image_base64, body.locale ?? "en")
    if (!vision.is_food) {
      return errorResponse(422, "NO_FOOD_DETECTED", vision.error_reason ?? "No food detected")
    }

    // 5. Normalize to unified input
    const normalizedInput: NormalizedFoodInput = {
      food_name: vision.food_name,
      food_name_es: vision.food_name_es,
      category: vision.category,
      is_mixed_meal: vision.is_mixed_meal,
      components: vision.components,
      quantity: 1,
      serving_size_g: vision.estimated_serving_g,
      total_g: vision.estimated_serving_g,
      input_method: "photo_scan",
      identification_confidence: vision.confidence,
    }

    // 6. Resolve through unified GI engine
    const result = await resolveGI(supabaseAdmin, normalizedInput)

    const responseTimeMs = Date.now() - startTime

    // 7. Log to scan_logs (only if authenticated)
    if (userId) {
      await supabaseAdmin.from("scan_logs").insert({
        user_id: userId,
        food_name: result.food_name,
        gpt_raw_response: vision,
        matched_food_id: result.matched_food_id,
        match_method: result.match_method,
        input_method: result.input_method,
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
        meal_type: body.meal_type ?? null,
        response_time_ms: responseTimeMs,
      })

      // 8. Increment rate limit
      await incrementRateLimit(supabaseAdmin, userId)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Scan error:", err)
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

async function checkRateLimit(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from("rate_limits")
    .select("scan_count")
    .eq("user_id", userId)
    .gte("window_start", windowStart)
    .single()

  return (data?.scan_count ?? 0) >= RATE_LIMIT_PER_HOUR
}

async function incrementRateLimit(supabase: ReturnType<typeof createClient>, userId: string) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - (now.getMinutes() * 60 + now.getSeconds()) * 1000).toISOString()

  await supabase.rpc("increment_rate_limit", { p_user_id: userId }).catch(async () => {
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("id, scan_count")
      .eq("user_id", userId)
      .gte("window_start", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .single()

    if (existing) {
      await supabase.from("rate_limits").update({ scan_count: existing.scan_count + 1 }).eq("id", existing.id)
    } else {
      await supabase.from("rate_limits").insert({ user_id: userId, window_start: new Date().toISOString(), scan_count: 1 })
    }
  })
}

async function identifyFood(imageBase64: string, locale: string): Promise<VisionResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 400,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a food identification expert. Identify any food from any cuisine worldwide, with special expertise in Mexican dishes. Return a JSON object with these exact fields:
- food_name: string (English name)
- food_name_es: string|null (Spanish name if applicable)
- confidence: number (0-1)
- estimated_serving_g: number (estimated portion weight in grams visible in the image)
- is_mixed_meal: boolean
- components: array of {name: string, estimated_g: number} (for mixed meals)
- is_food: boolean (false if image is not food)
- error_reason: string|null (if is_food is false)
- category: string (one of: grains_bread, legumes, vegetables, fruits, dairy, meat_poultry, seafood, eggs, nuts_seeds, beverages, desserts_sweets, snacks, soups_stews, mixed_dishes, sauces_condiments, fast_food, other)

Be precise with portion estimation. For plated meals, estimate total visible food weight. Respond ONLY with valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Identify this food. Locale: ${locale}` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error("OpenAI Vision error:", err)
    throw new Error("Vision API failed")
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
  return JSON.parse(jsonStr)
}

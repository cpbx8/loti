/**
 * suggest — AI Food Suggestion Engine
 *
 * Single-turn: user context + meal type or freetext → GPT-4o-mini → 3-5 suggestions.
 * No conversation memory. Each request is independent.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { validateApiKey } from "../_shared/apikey.ts"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const TIMEOUT_MS = 8000

// ─── Types ────────────────────────────────────────────────────

interface SuggestRequest {
  context: {
    type: "meal" | "freetext"
    meal_type?: "breakfast" | "lunch" | "dinner" | "snack"
    freetext?: string
    exclude?: string[]
  }
  profile: {
    health_state: string
    goal: string
    a1c_value: number | null
    age: number | null
    sex: string
    activity_level: string
    dietary_restrictions: string[]
    meal_struggles: string[]
    medications: string[]
    gl_threshold_green: number
    gl_threshold_yellow: number
  }
  scan_summary: string
}

interface Suggestion {
  food_name: string
  estimated_gl: number
  traffic_light: "green" | "yellow"
  reasoning: string
}

// ─── System Prompt Builder ────────────────────────────────────

function buildSystemPrompt(profile: SuggestRequest["profile"], scanSummary: string): string {
  return `You are a food suggestion engine for a Mexican diabetes food app. Given a user's health profile and recent eating history, suggest 3-5 glucose-friendly Mexican foods.

USER PROFILE:
- Health: ${profile.health_state}
- Goal: ${profile.goal}
- A1C: ${profile.a1c_value ?? "unknown"}
- Age: ${profile.age ?? "unknown"}, Sex: ${profile.sex}
- Activity: ${profile.activity_level}
- Dietary restrictions: ${profile.dietary_restrictions.length > 0 ? profile.dietary_restrictions.join(", ") : "none"}
- Meals they struggle with: ${profile.meal_struggles.length > 0 ? profile.meal_struggles.join(", ") : "none specified"}
- Medications: ${profile.medications.length > 0 ? profile.medications.join(", ") : "none"}

THRESHOLDS (personalized):
- Green: GL < ${profile.gl_threshold_green}
- Yellow: GL ${profile.gl_threshold_green}-${profile.gl_threshold_yellow}
- Red: GL > ${profile.gl_threshold_yellow}

LAST 7 DAYS:
${scanSummary}

RULES:
- Suggest ONLY foods common in Mexico (Mexican cuisine, or commonly available in Mexican stores/restaurants)
- Prioritize green-rated foods. Include at most 1 yellow. Never suggest red.
- Each suggestion needs: food name, estimated GL per standard serving, traffic light color based on the user's thresholds, and a 1-sentence reason
- CRITICAL: The user has these dietary restrictions: ${profile.dietary_restrictions.length > 0 ? profile.dietary_restrictions.join(", ") : "none"}. NEVER suggest foods that violate these restrictions. For example, "Egg-free" means NO eggs, huevos, omelettes, or any dish containing eggs as an ingredient
- If the user's recent history is heavy on red foods, acknowledge this gently and steer toward green
- If the user mentions a craving, suggest a healthier version of that specific food, not a completely different food
- Keep reasoning concise: 1 sentence max, focused on WHY this food is good for glucose
- Respond ONLY with JSON, no preamble

RESPOND WITH THIS JSON ONLY:
{
  "suggestions": [
    {
      "food_name": "string",
      "estimated_gl": number,
      "traffic_light": "green|yellow",
      "reasoning": "string (1 sentence)"
    }
  ]
}`
}

function buildUserMessage(context: SuggestRequest["context"]): string {
  if (context.type === "freetext" && context.freetext) {
    return context.freetext
  }

  const mealLabel = context.meal_type ?? "meal"
  const base = `Suggest ${mealLabel} options`

  if (context.exclude && context.exclude.length > 0) {
    return `${base}, excluding: ${context.exclude.join(", ")}`
  }

  return base
}

// ─── Handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // API key validation (no user auth)
    const denied = validateApiKey(req)
    if (denied) return denied

    const body: SuggestRequest = await req.json()

    const systemPrompt = buildSystemPrompt(body.profile, body.scan_summary)
    const userMessage = buildUserMessage(body.context)

    // Call GPT-4o-mini
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[suggest] OpenAI error: HTTP ${res.status} — ${errText}`)
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const parsed = JSON.parse(content)
    const suggestions: Suggestion[] = (parsed.suggestions ?? []).map((s: Suggestion) => ({
      food_name: s.food_name,
      estimated_gl: Math.round(s.estimated_gl),
      traffic_light: s.traffic_light === "yellow" ? "yellow" : "green",
      reasoning: s.reasoning,
    }))

    const responseTimeMs = Date.now() - startTime
    const tokenCount = data.usage?.total_tokens ?? null

    console.log(`[suggest] ${suggestions.length} suggestions in ${responseTimeMs}ms (${tokenCount} tokens)`)

    return new Response(
      JSON.stringify({
        suggestions,
        response_time_ms: responseTimeMs,
        token_count: tokenCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[suggest] OpenAI timeout")
      return new Response(
        JSON.stringify({ error: "Request timed out" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }
    console.error("[suggest] Error:", err)
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

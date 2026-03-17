/**
 * GI Estimation — Uses GPT-4o-mini to estimate glycemic index for foods.
 *
 * Called AFTER the waterfall resolves nutrition data. If the food already has
 * GI in cache, this is skipped. Otherwise, GPT-4o-mini estimates GI based on
 * the food name and carb content. ~$0.00008 per call.
 *
 * GL = (GI x carbs_g per serving) / 100
 * Traffic light: GL <= 10 = green, 11-19 = yellow, >= 20 = red
 */

import type { FoodSearchResult } from "./waterfall-types.ts"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const TIMEOUT_MS = 5000

const GI_SYSTEM_PROMPT = `You are a glycemic index expert specializing in Mexican and Latin American foods.

Given a food name and its carbohydrate content, estimate the glycemic index (GI).

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "glycemic_index": 52,
  "gi_source": "published",
  "swap_suggestion": null
}

Rules:
- glycemic_index: integer 0-100
- gi_source: "published" if it's a well-known food with widely published GI data (white bread, banana, rice, etc.), "estimated" otherwise
- swap_suggestion: If the food would result in high glycemic load (GL >= 11), suggest a culturally appropriate lower-GI Mexican alternative. Examples:
  - "Prueba tortilla de maíz en vez de harina — 30% menos impacto glucémico"
  - "Agrega nopales para reducir el impacto en tu glucosa"
  - "El limón y vinagre reducen el impacto glucémico — exprímele limón"
  - "Prueba agua de jamaica sin azúcar en vez de refresco"
  - "Cambia arroz blanco por arroz integral o frijoles"
  Keep suggestions short (1 sentence), in Spanish, practical, and specific to Mexican cuisine.
  Set to null if the food is already low-GI (GL <= 10).
- For zero-carb foods (meat, cheese, oils), use GI = 0
- For mixed dishes, estimate the weighted average GI of the carb-containing components`

interface GPTGIResponse {
  glycemic_index: number
  gi_source: "published" | "estimated"
  swap_suggestion: string | null
}

/**
 * Compute GL and traffic light from GI and carbs.
 */
function computeGLAndTrafficLight(
  gi: number,
  carbs_g: number,
): { glycemic_load: number; traffic_light: "green" | "yellow" | "red" } {
  const gl = Math.round(((gi * carbs_g) / 100) * 10) / 10
  let traffic_light: "green" | "yellow" | "red"
  if (gl <= 10) {
    traffic_light = "green"
  } else if (gl <= 19) {
    traffic_light = "yellow"
  } else {
    traffic_light = "red"
  }
  return { glycemic_load: gl, traffic_light }
}

/**
 * Estimate GI for a single food result.
 * If glycemic_index is already set (from cache), just compute GL + traffic light.
 * Otherwise, call GPT-4o-mini to estimate.
 */
export async function estimateGI(
  result: FoodSearchResult,
): Promise<FoodSearchResult> {
  // If already has full GI data (from cache), just recompute GL/traffic light
  if (result.glycemic_index != null && result.glycemic_index >= 0) {
    const { glycemic_load, traffic_light } = computeGLAndTrafficLight(
      result.glycemic_index,
      result.carbs_g,
    )
    return {
      ...result,
      glycemic_load,
      traffic_light,
      gi_source: result.gi_source ?? "unknown",
    }
  }

  // Zero-carb shortcut — no glycemic impact
  if (result.carbs_g <= 0) {
    return {
      ...result,
      glycemic_index: 0,
      glycemic_load: 0,
      traffic_light: "green",
      gi_source: "estimated",
      swap_suggestion: undefined,
    }
  }

  // Call GPT-4o-mini
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const foodDesc = `${result.name_es}${result.name_en ? ` (${result.name_en})` : ""}, ${result.carbs_g}g carbs per serving`

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 200,
        temperature: 0.1,
        messages: [
          { role: "system", content: GI_SYSTEM_PROMPT },
          { role: "user", content: `Estimate GI for: ${foodDesc}` },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[estimate-gi] HTTP ${res.status}`)
      return fallbackEstimate(result)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return fallbackEstimate(result)

    const parsed: GPTGIResponse = JSON.parse(content)
    const gi = Math.max(0, Math.min(100, Math.round(parsed.glycemic_index)))
    const { glycemic_load, traffic_light } = computeGLAndTrafficLight(gi, result.carbs_g)

    console.log(
      `[estimate-gi] "${result.name_es}" → GI=${gi} GL=${glycemic_load} ${traffic_light} (${parsed.gi_source})`,
    )

    return {
      ...result,
      glycemic_index: gi,
      glycemic_load,
      traffic_light,
      gi_source: parsed.gi_source === "published" ? "published" : "estimated",
      swap_suggestion: parsed.swap_suggestion ?? undefined,
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[estimate-gi] TIMEOUT for "${result.name_es}"`)
    } else {
      console.error(`[estimate-gi] error for "${result.name_es}":`, err)
    }
    return fallbackEstimate(result)
  }
}

/**
 * Fallback: estimate GI from macros when GPT is unavailable.
 * Uses a rough heuristic: high-fiber foods tend to have lower GI.
 */
function fallbackEstimate(result: FoodSearchResult): FoodSearchResult {
  if (result.carbs_g <= 0) {
    return {
      ...result,
      glycemic_index: 0,
      glycemic_load: 0,
      traffic_light: "green",
      gi_source: "unknown",
    }
  }

  // Rough heuristic: base GI ~55, reduce by fiber ratio
  const fiberRatio = (result.fiber_g ?? 0) / Math.max(result.carbs_g, 1)
  const estimatedGI = Math.round(55 - fiberRatio * 30)
  const gi = Math.max(10, Math.min(90, estimatedGI))

  const { glycemic_load, traffic_light } = computeGLAndTrafficLight(gi, result.carbs_g)

  return {
    ...result,
    glycemic_index: gi,
    glycemic_load,
    traffic_light,
    gi_source: "unknown",
  }
}

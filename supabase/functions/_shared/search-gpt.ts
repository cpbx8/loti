/**
 * Tier 3 — GPT-4o (Expensive, last resort)
 *
 * Fires ONLY when Tiers 0-2 return no results for text search (likely a regional Mexican dish).
 * Also fires for all photo-based meal recognition (the core UX feature).
 */

import type { FoodSearchResult } from "./waterfall-types.ts"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const TIMEOUT_MS = 10000 // GPT can be slower

const SYSTEM_PROMPT = `You are a Mexican food nutrition expert. You help users in Mexico track calories.

Given a food description or photo, return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "items": [
    {
      "name_es": "Tacos al pastor",
      "name_en": "Pastor tacos",
      "estimated_grams": 180,
      "calories": 320,
      "protein_g": 18,
      "carbs_g": 28,
      "fat_g": 15,
      "fiber_g": 3,
      "serving_description": "3 tacos with corn tortilla, pineapple, onion, cilantro",
      "confidence": 0.8
    }
  ]
}

Rules:
- Estimate based on typical Mexican portions and preparation methods
- For photos with multiple items, return each as a separate item
- Be specific to Mexican cuisine — a "taco" means a small corn tortilla street taco, not a Taco Bell shell
- confidence should be 0.6-0.9 for common foods, 0.3-0.5 for unusual or hard-to-identify items
- If you cannot identify the food at all, return {"items": []} with no hallucinated data`

// ─── Text Search (last resort for regional Mexican dishes) ───

export async function searchGPTText(query: string): Promise<FoodSearchResult[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Estimate nutrition for: ${query}` },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[waterfall] gpt4o text error: HTTP ${res.status}`)
      return []
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return []

    const parsed = JSON.parse(content)
    const items = parsed.items ?? []

    console.log(`[waterfall] gpt4o text ${items.length > 0 ? "HIT" : "MISS"} for "${query}" — ${items.length} items`)

    return items.map(gptItemToResult)
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[waterfall] gpt4o text TIMEOUT for "${query}"`)
    } else {
      console.error(`[waterfall] gpt4o text error for "${query}":`, err)
    }
    return []
  }
}

// ─── Photo Recognition ───────────────────────────────────────

export async function searchGPTPhoto(imageBase64: string): Promise<FoodSearchResult[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    // Determine mime type from base64 prefix or default to jpeg
    let mimeType = "image/jpeg"
    if (imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,/)
      if (match) {
        mimeType = match[1]
        imageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "")
      }
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify all food items in this photo and estimate their nutrition." },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[waterfall] gpt4o photo error: HTTP ${res.status}`)
      return []
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return []

    const parsed = JSON.parse(content)
    const items = parsed.items ?? []

    console.log(`[waterfall] gpt4o photo — ${items.length} items identified`)

    return items.map(gptItemToResult)
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log("[waterfall] gpt4o photo TIMEOUT")
    } else {
      console.error("[waterfall] gpt4o photo error:", err)
    }
    return []
  }
}

// ─── Helpers ─────────────────────────────────────────────────

interface GPTItem {
  name_es: string
  name_en?: string
  estimated_grams?: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number
  serving_description?: string
  confidence?: number
}

function gptItemToResult(item: GPTItem): FoodSearchResult {
  return {
    name_es: item.name_es,
    name_en: item.name_en,
    calories: Math.round(item.calories),
    protein_g: Math.round(item.protein_g * 10) / 10,
    carbs_g: Math.round(item.carbs_g * 10) / 10,
    fat_g: Math.round(item.fat_g * 10) / 10,
    fiber_g: item.fiber_g != null ? Math.round(item.fiber_g * 10) / 10 : undefined,
    serving_size: item.estimated_grams ?? 100,
    serving_unit: "g",
    serving_description: item.serving_description,
    source: "gpt4o",
    confidence: item.confidence ?? 0.7,
  }
}

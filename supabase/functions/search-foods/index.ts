/**
 * search-foods — Unified Waterfall Food Search Orchestrator
 *
 * Accepts: { query: string, type: 'text' | 'barcode' | 'photo', image_base64?: string, locale?: 'en' | 'es' }
 *
 * Waterfall tiers (stop at first confident result):
 *   Tier 0 — Local Cache (foods_cache, $0)
 *   Tier 1 — FatSecret API (Free, 5K/day)
 *   Tier 2 — Open Food Facts API (Free, unlimited)
 *   Tier 3 — GPT-4o (Expensive, last resort)
 *
 * Every result from Tiers 1-3 is written back to Tier 0 so the cache gets smarter over time.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { corsHeaders } from "../_shared/cors.ts"
import { validateApiKey } from "../_shared/apikey.ts"
import type { SearchRequest, SearchResponse, FoodSearchResult } from "../_shared/waterfall-types.ts"
import { searchCache, searchCacheBarcode, cacheResult } from "../_shared/food-cache.ts"
import { searchFatSecretText, searchFatSecretBarcode } from "../_shared/search-fatsecret.ts"
import { searchOFFText, searchOFFBarcode } from "../_shared/search-off.ts"
import { searchGPTText, searchGPTPhoto } from "../_shared/search-gpt.ts"
import { decomposeFood } from "../_shared/decompose.ts"
import { estimateGI } from "../_shared/estimate-gi.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // API key validation (no user auth)
    const apiDenied = validateApiKey(req)
    if (apiDenied) return apiDenied

    const body: SearchRequest = await req.json()
    const { query, type, image_base64 } = body

    if (!query && type !== "photo") {
      return errorResponse(400, "Missing query parameter")
    }

    // Normalize query: lowercase, strip accents, trim
    const normalizedQuery = normalizeQuery(query ?? "")

    let response: SearchResponse

    if (type === "text") {
      response = await waterfallText(supabaseAdmin, normalizedQuery, startTime)
    } else if (type === "barcode") {
      response = await waterfallBarcode(supabaseAdmin, normalizedQuery, startTime)
    } else if (type === "photo") {
      if (!image_base64) {
        return errorResponse(400, "Missing image_base64 for photo search")
      }
      response = await waterfallPhoto(supabaseAdmin, image_base64, startTime)
    } else {
      return errorResponse(400, `Invalid type: ${type}. Must be 'text', 'barcode', or 'photo'.`)
    }

    return jsonResponse(response)
  } catch (err) {
    console.error("[waterfall] Unexpected error:", err)
    return errorResponse(500, "An unexpected error occurred")
  }
})

// ─── Single-item Waterfall Lookup ────────────────────────────
// Looks up ONE food through cache → FatSecret → OFF → GPT

async function lookupSingle(
  supabase: ReturnType<typeof createClient>,
  query: string,
  servingGrams?: number,
): Promise<{ result: FoodSearchResult | null; source: string; cached: boolean }> {
  // Tier 0: Cache — only accept good name matches
  const cacheResults = await searchCache(supabase, query)
  const goodCache = cacheResults.find(r => isGoodMatch(query, r))
  if (goodCache) {
    if (servingGrams && goodCache.serving_size !== servingGrams) {
      return { result: scaleResult(goodCache, servingGrams), source: "cache", cached: true }
    }
    return { result: goodCache, source: "cache", cached: true }
  }

  // Tier 1: FatSecret — pick the best name match, not just the first result
  const fsResults = await searchFatSecretText(query)
  if (fsResults.length > 0) {
    const best = pickBestMatch(query, fsResults)
    if (best) {
      cacheResult(supabase, best).catch(() => {})
      if (servingGrams && best.serving_size !== servingGrams) {
        return { result: scaleResult(best, servingGrams), source: "fatsecret", cached: false }
      }
      return { result: best, source: "fatsecret", cached: false }
    }
  }

  // Tier 2: Open Food Facts
  const offResults = await searchOFFText(query)
  if (offResults.length > 0) {
    const r = offResults[0]
    cacheResult(supabase, r).catch(() => {})
    if (servingGrams && r.serving_size !== servingGrams) {
      return { result: scaleResult(r, servingGrams), source: "openfoodfacts", cached: false }
    }
    return { result: r, source: "openfoodfacts", cached: false }
  }

  return { result: null, source: "none", cached: false }
}

// ─── Text Search Waterfall ───────────────────────────────────

async function waterfallText(
  supabase: ReturnType<typeof createClient>,
  query: string,
  startTime: number,
): Promise<SearchResponse> {
  // Step 0: Try cache first (fast path)
  const cacheResults = await searchCache(supabase, query)

  // Only use cache as fast-path if result is a confident direct match
  // (avoids "bistec taco" matching "bistec de res" and skipping decomposition)
  const isDirectMatch = cacheResults.length > 0 && isGoodMatch(query, cacheResults[0])

  if (isDirectMatch) {
    const withGI = await Promise.all(cacheResults.map(estimateGI))
    // Write back GI data to cache for results that didn't have it
    for (const r of withGI) {
      if (r.id && r.glycemic_index != null) {
        cacheResult(supabase, r).catch(() => {})
      }
    }
    return {
      results: withGI,
      source: "cache",
      cached: true,
      latency_ms: Date.now() - startTime,
    }
  }

  // Step 1: Decompose the food into components using GPT-4o-mini
  // "3 shrimp tacos" → qty=3, [corn tortilla 90g, shrimp 240g, ...]
  // "banana" → qty=1, [banana 120g]
  const decomp = await decomposeFood(query)
  const displayName = decomp.quantity > 1 ? `${decomp.quantity} ${decomp.baseName}` : decomp.baseName

  // Step 2: If NOT composite, try cache with quality check, then waterfall
  if (!decomp.composite) {
    const goodCacheResults = cacheResults.filter(r => isGoodMatch(query, r))
    if (goodCacheResults.length > 0) {
      const withGI = await Promise.all(goodCacheResults.map(estimateGI))
      for (const r of withGI) {
        if (r.id && r.glycemic_index != null) {
          cacheResult(supabase, r).catch(() => {})
        }
      }
      return {
        results: withGI,
        source: "cache",
        cached: true,
        latency_ms: Date.now() - startTime,
      }
    }
    return waterfallSingleItem(supabase, query, startTime)
  }

  // Step 3: Composite food — look up each component through the waterfall
  console.log(`[waterfall] Composite food "${query}" → ${decomp.components.length} components`)

  const componentResults: FoodSearchResult[] = []
  let primarySource = "cache"
  let anyCached = false

  for (const comp of decomp.components) {
    // Try English name first (better for FatSecret), fall back to Spanish
    let lookup = await lookupSingle(supabase, comp.name, comp.grams)
    if (!lookup.result) {
      lookup = await lookupSingle(supabase, comp.name_es, comp.grams)
    }

    if (lookup.result) {
      componentResults.push(lookup.result)
      if (lookup.cached) anyCached = true
      if (!lookup.cached) primarySource = lookup.source
    } else {
      // Last resort: estimate via GPT for this component
      console.log(`[waterfall] Component "${comp.name}" not found in tiers 0-2, using GPT`)
    }
  }

  // Step 4: If we got components, estimate GI for each, then build combined total
  if (componentResults.length > 0) {
    const componentsWithGI = await Promise.all(componentResults.map(estimateGI))
    const total = buildMealTotal(displayName, componentsWithGI)
    return {
      results: [total, ...componentsWithGI],
      source: primarySource,
      cached: anyCached,
      latency_ms: Date.now() - startTime,
    }
  }

  // Step 5: Fallback — GPT-4o estimates the whole dish
  return waterfallSingleItem(supabase, query, startTime)
}

// ─── Single Item Waterfall (non-composite path) ─────────────

async function waterfallSingleItem(
  supabase: ReturnType<typeof createClient>,
  query: string,
  startTime: number,
): Promise<SearchResponse> {
  // Tier 1: FatSecret — pick best match
  const fsResults = await searchFatSecretText(query)
  if (fsResults.length > 0) {
    const best = pickBestMatch(query, fsResults)
    if (best) {
      const withGI = await estimateGI(best)
      cacheResult(supabase, withGI).catch(() => {})
      return {
        results: [withGI],
        source: "fatsecret",
        cached: false,
        latency_ms: Date.now() - startTime,
      }
    }
  }

  // Tier 2: Open Food Facts
  const offResults = await searchOFFText(query)
  if (offResults.length > 0) {
    const withGI = await Promise.all(offResults.map(estimateGI))
    for (const r of withGI) cacheResult(supabase, r).catch(() => {})
    return {
      results: withGI,
      source: "openfoodfacts",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 3: GPT-4o (already includes GI from prompt)
  const gptResults = await searchGPTText(query)
  if (gptResults.length > 0) {
    // GPT results may already have GI from the prompt; estimateGI will just compute GL/traffic light
    const withGI = await Promise.all(gptResults.map(estimateGI))
    for (const r of withGI) cacheResult(supabase, r).catch(() => {})
    return {
      results: withGI,
      source: "gpt4o",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  return {
    results: [],
    source: "none",
    cached: false,
    latency_ms: Date.now() - startTime,
  }
}

// ─── Scale nutrition to a different serving size ─────────────

function scaleResult(r: FoodSearchResult, targetGrams: number): FoodSearchResult {
  if (r.serving_size <= 0) return r
  const ratio = targetGrams / r.serving_size
  return {
    ...r,
    calories: Math.round(r.calories * ratio),
    protein_g: Math.round(r.protein_g * ratio * 10) / 10,
    carbs_g: Math.round(r.carbs_g * ratio * 10) / 10,
    fat_g: Math.round(r.fat_g * ratio * 10) / 10,
    fiber_g: r.fiber_g != null ? Math.round(r.fiber_g * ratio * 10) / 10 : undefined,
    serving_size: targetGrams,
    serving_description: `${targetGrams}g (scaled)`,
  }
}

// ─── Build a combined meal total from components ─────────────

function buildMealTotal(name: string, components: FoodSearchResult[]): FoodSearchResult {
  const totalCal = components.reduce((s, c) => s + c.calories, 0)
  const totalP = components.reduce((s, c) => s + c.protein_g, 0)
  const totalC = components.reduce((s, c) => s + c.carbs_g, 0)
  const totalF = components.reduce((s, c) => s + c.fat_g, 0)
  const totalFiber = components.reduce((s, c) => s + (c.fiber_g ?? 0), 0)
  const totalGrams = components.reduce((s, c) => s + c.serving_size, 0)

  // Total GL = sum of component GLs
  const totalGL = Math.round(
    components.reduce((s, c) => s + (c.glycemic_load ?? 0), 0) * 10,
  ) / 10

  let traffic_light: "green" | "yellow" | "red"
  if (totalGL <= 10) {
    traffic_light = "green"
  } else if (totalGL <= 19) {
    traffic_light = "yellow"
  } else {
    traffic_light = "red"
  }

  // Find the worst swap suggestion from components (highest GL component)
  const worstComponent = components
    .filter(c => c.swap_suggestion)
    .sort((a, b) => (b.glycemic_load ?? 0) - (a.glycemic_load ?? 0))[0]

  const componentNames = components.map(c => c.name_en || c.name_es).join(" + ")

  return {
    name_es: name,
    name_en: name,
    calories: Math.round(totalCal),
    protein_g: Math.round(totalP * 10) / 10,
    carbs_g: Math.round(totalC * 10) / 10,
    fat_g: Math.round(totalF * 10) / 10,
    fiber_g: Math.round(totalFiber * 10) / 10,
    serving_size: totalGrams,
    serving_unit: "g",
    serving_description: `Total (${componentNames})`,
    source: "cache",
    confidence: Math.min(...components.map(c => c.confidence)),
    glycemic_load: totalGL,
    traffic_light,
    swap_suggestion: worstComponent?.swap_suggestion,
  }
}

// ─── Barcode Search Waterfall ────────────────────────────────

async function waterfallBarcode(
  supabase: ReturnType<typeof createClient>,
  barcode: string,
  startTime: number,
): Promise<SearchResponse> {
  // Tier 0: Cache
  const cached = await searchCacheBarcode(supabase, barcode)
  if (cached) {
    const withGI = await estimateGI(cached)
    if (withGI.id && withGI.glycemic_index != null) {
      cacheResult(supabase, withGI).catch(() => {})
    }
    return {
      results: [withGI],
      source: "cache",
      cached: true,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 1: FatSecret barcode
  const fsResult = await searchFatSecretBarcode(barcode)
  if (fsResult) {
    const withGI = await estimateGI(fsResult)
    cacheResult(supabase, withGI).catch(() => {})
    return {
      results: [withGI],
      source: "fatsecret",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 2: Open Food Facts barcode (inline fetch — more reliable than module with timeout)
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { headers: { "User-Agent": "Loti-App/1.0 (contact@loti.app)" } },
    )
    if (offRes.ok) {
      const offData = await offRes.json() as Record<string, unknown>
      const product = offData.product as Record<string, unknown> | undefined
      if (product && offData.status !== 0) {
        const nutriments = product.nutriments as Record<string, number> | undefined
        const name = (product.product_name as string) ?? (product.product_name_en as string) ?? (product.product_name_es as string) ?? null
        const cal = nutriments?.["energy-kcal_100g"] ?? 0
        const carbs = nutriments?.["carbohydrates_100g"] ?? 0
        const protein = nutriments?.["proteins_100g"] ?? 0
        const fat = nutriments?.["fat_100g"] ?? 0

        if (name && (cal > 0 || carbs > 0 || protein > 0)) {
          const servingQty = parseFloat(product.serving_quantity as string) || 100
          const useServing = !!product.serving_quantity
          const offResult: FoodSearchResult = {
            name_es: name,
            name_en: (product.product_name_en as string) ?? undefined,
            calories: Math.round(useServing ? (nutriments?.["energy-kcal_serving"] ?? cal * servingQty / 100) : cal),
            protein_g: Math.round((useServing ? (nutriments?.["proteins_serving"] ?? protein * servingQty / 100) : protein) * 10) / 10,
            carbs_g: Math.round((useServing ? (nutriments?.["carbohydrates_serving"] ?? carbs * servingQty / 100) : carbs) * 10) / 10,
            fat_g: Math.round((useServing ? (nutriments?.["fat_serving"] ?? fat * servingQty / 100) : fat) * 10) / 10,
            fiber_g: Math.round((nutriments?.["fiber_100g"] ?? 0) * 10) / 10,
            serving_size: useServing ? servingQty : 100,
            serving_unit: "g",
            serving_description: (product.serving_size as string) ?? undefined,
            source: "openfoodfacts",
            source_id: barcode,
            confidence: 0.85,
            barcode,
            image_url: (product.image_url as string) ?? undefined,
          }
          console.log(`[waterfall] barcode OFF HIT for "${barcode}" → ${name}`)
          const withGI = await estimateGI(offResult)
          cacheResult(supabase, withGI).catch(() => {})
          return {
            results: [withGI],
            source: "openfoodfacts",
            cached: false,
            latency_ms: Date.now() - startTime,
          }
        }
      }
    }
  } catch (e) {
    console.log(`[waterfall] barcode OFF error: ${e instanceof Error ? e.message : String(e)}`)
  }

  // Tier 3: GPT-4o text fallback with barcode
  const gptResults = await searchGPTText(`Product with barcode ${barcode}`)
  if (gptResults.length > 0) {
    gptResults[0].barcode = barcode
    const withGI = await estimateGI(gptResults[0])
    cacheResult(supabase, withGI).catch(() => {})
    return {
      results: [withGI, ...gptResults.slice(1)],
      source: "gpt4o",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  return {
    results: [],
    source: "none",
    cached: false,
    latency_ms: Date.now() - startTime,
  }
}

// ─── Photo Search Waterfall ──────────────────────────────────

async function waterfallPhoto(
  supabase: ReturnType<typeof createClient>,
  imageBase64: string,
  startTime: number,
): Promise<SearchResponse> {
  // Photo always goes through GPT-4o first for identification
  const gptResults = await searchGPTPhoto(imageBase64)

  if (gptResults.length === 0) {
    return {
      results: [],
      source: "gpt4o",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // For each identified item, check cache for higher-confidence versions
  const finalResults: FoodSearchResult[] = []

  for (const gptItem of gptResults) {
    const cacheHits = await searchCache(supabase, gptItem.name_es)
    const bestCached = cacheHits.find((c) => c.confidence > gptItem.confidence)

    if (bestCached) {
      console.log(`[waterfall] photo: using cached version of "${gptItem.name_es}" (conf ${bestCached.confidence} > ${gptItem.confidence})`)
      finalResults.push(bestCached)
    } else {
      // Cache the GPT result for future lookups
      cacheResult(supabase, gptItem).catch(() => {})
      finalResults.push(gptItem)
    }
  }

  // Post-process: estimate GI for all results
  const withGI = await Promise.all(finalResults.map(estimateGI))
  // Write back GI data to cache
  for (const r of withGI) {
    if (r.glycemic_index != null) {
      cacheResult(supabase, r).catch(() => {})
    }
  }

  return {
    results: withGI,
    source: "gpt4o",
    cached: false,
    latency_ms: Date.now() - startTime,
  }
}

// ─── Helpers ─────────────────────────────────────────────────

/** Check if a cache result is a good direct match for the query (not a partial/tangential match).
 *  "shrimp" should NOT match "shrimp broth". "arroz con leche" SHOULD match "arroz con leche". */
function isGoodMatch(query: string, result: FoodSearchResult): boolean {
  const q = query.toLowerCase()
  const nameEs = result.name_es.toLowerCase()
  const nameEn = (result.name_en ?? "").toLowerCase()

  // Exact match
  if (nameEs === q || nameEn === q) return true

  // Query IS the full name (query contains the result name AND they're similar length)
  if (q.includes(nameEs) && nameEs.length >= q.length * 0.7) return true
  if (nameEn && q.includes(nameEn) && nameEn.length >= q.length * 0.7) return true

  // Result name contains query — only if query is multi-word and makes up most of the name
  const qWords = q.split(/\s+/)
  const nameWords = `${nameEs} ${nameEn}`.split(/\s+/)

  if (qWords.length === 1) {
    // Single word query: name must be exactly the query (already checked above)
    return false
  }

  // Multi-word: all query words must appear in name, AND name shouldn't be much longer
  const matchedWords = qWords.filter(w => nameWords.some(n => n === w || n.includes(w) || w.includes(n)))
  const coverage = matchedWords.length / qWords.length
  const nameBloat = nameWords.length / Math.max(qWords.length, 1)

  return coverage >= 0.8 && nameBloat <= 2.0
}

/** Pick the FatSecret result whose name most closely matches the query.
 *  Avoids "shrimp" → "shrimp broth" by penalizing extra words. */
function pickBestMatch(query: string, results: FoodSearchResult[]): FoodSearchResult | null {
  const q = query.toLowerCase().split(/\s+/)

  let best: FoodSearchResult | null = null
  let bestScore = -1

  for (const r of results) {
    const name = ((r.name_en ?? r.name_es) ?? "").toLowerCase()
    const nameWords = name.split(/\s+/)

    // Score: matched query words / total name words (prefer shorter, more precise names)
    const matchedWords = q.filter(w => nameWords.some(n => n.includes(w) || w.includes(n))).length
    const score = matchedWords / Math.max(nameWords.length, 1)

    if (score > bestScore) {
      bestScore = score
      best = r
    }
  }

  // Require at least 50% word overlap to accept
  return bestScore >= 0.5 ? best : null
}

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .trim()
}

function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({ results: [], source: "error", error: message }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  )
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

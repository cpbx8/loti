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
import type { SearchRequest, SearchResponse, FoodSearchResult } from "../_shared/waterfall-types.ts"
import { searchCache, searchCacheBarcode, cacheResult } from "../_shared/food-cache.ts"
import { searchFatSecretText, searchFatSecretBarcode } from "../_shared/search-fatsecret.ts"
import { searchOFFText, searchOFFBarcode } from "../_shared/search-off.ts"
import { searchGPTText, searchGPTPhoto } from "../_shared/search-gpt.ts"

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

// ─── Text Search Waterfall ───────────────────────────────────

async function waterfallText(
  supabase: ReturnType<typeof createClient>,
  query: string,
  startTime: number,
): Promise<SearchResponse> {
  // Tier 0: Cache
  const cacheResults = await searchCache(supabase, query)
  if (cacheResults.length > 0) {
    return {
      results: cacheResults,
      source: "cache",
      cached: true,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 1: FatSecret
  const fsResults = await searchFatSecretText(query)
  if (fsResults.length > 0) {
    // Write back to cache (non-blocking)
    for (const r of fsResults) cacheResult(supabase, r).catch(() => {})
    return {
      results: fsResults,
      source: "fatsecret",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 2: Open Food Facts
  const offResults = await searchOFFText(query)
  if (offResults.length > 0) {
    for (const r of offResults) cacheResult(supabase, r).catch(() => {})
    return {
      results: offResults,
      source: "openfoodfacts",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 3: GPT-4o (last resort — likely a regional Mexican dish)
  const gptResults = await searchGPTText(query)
  if (gptResults.length > 0) {
    for (const r of gptResults) cacheResult(supabase, r).catch(() => {})
    return {
      results: gptResults,
      source: "gpt4o",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // Nothing found
  return {
    results: [],
    source: "none",
    cached: false,
    latency_ms: Date.now() - startTime,
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
    return {
      results: [cached],
      source: "cache",
      cached: true,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 1: FatSecret barcode
  const fsResult = await searchFatSecretBarcode(barcode)
  if (fsResult) {
    cacheResult(supabase, fsResult).catch(() => {})
    return {
      results: [fsResult],
      source: "fatsecret",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 2: Open Food Facts barcode
  const offResult = await searchOFFBarcode(barcode)
  if (offResult) {
    cacheResult(supabase, offResult).catch(() => {})
    return {
      results: [offResult],
      source: "openfoodfacts",
      cached: false,
      latency_ms: Date.now() - startTime,
    }
  }

  // Tier 3: GPT-4o text fallback with barcode
  const gptResults = await searchGPTText(`Product with barcode ${barcode}`)
  if (gptResults.length > 0) {
    gptResults[0].barcode = barcode
    cacheResult(supabase, gptResults[0]).catch(() => {})
    return {
      results: gptResults,
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

  return {
    results: finalResults,
    source: "gpt4o",
    cached: false,
    latency_ms: Date.now() - startTime,
  }
}

// ─── Helpers ─────────────────────────────────────────────────

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

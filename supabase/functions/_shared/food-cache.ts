/**
 * Tier 0 — Local Cache (foods_cache table)
 *
 * Query and write-back to the foods_cache table.
 * This tier gets smarter over time as results from all other tiers are cached here.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import type { FoodSearchResult } from "./waterfall-types.ts"

// ─── Query Cache ─────────────────────────────────────────────

export async function searchCache(
  supabase: ReturnType<typeof createClient>,
  query: string,
): Promise<FoodSearchResult[]> {
  const start = Date.now()

  // Use the RPC function for trigram similarity search + alias matching
  // Threshold 0.5 avoids false positives like "cheesecake" → "queso"
  const { data, error } = await supabase
    .rpc("search_foods_cache_with_aliases", {
      search_term: query,
      similarity_threshold: 0.5,
      result_limit: 10,
    })

  if (error || !data || data.length === 0) {
    console.log(`[waterfall] cache MISS for "${query}" (${Date.now() - start}ms)`)
    return []
  }

  // Deduplicate by id (UNION in RPC can return same food via name + alias)
  const seen = new Set<string>()
  const unique = data.filter((row: CacheRow) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })

  // Only return results with decent similarity
  const confident = unique.filter((row: CacheRow) =>
    row.similarity_score > 0.5
  ).slice(0, 5)

  if (confident.length === 0) {
    console.log(`[waterfall] cache MISS for "${query}" — ${unique.length} results but none similar enough (best: ${unique[0]?.similarity_score?.toFixed(2)}) (${Date.now() - start}ms)`)
    return []
  }

  console.log(`[waterfall] cache HIT for "${query}" — ${confident.length} results (${Date.now() - start}ms)`)

  // Increment lookup_count for the top result
  await supabase
    .from("foods_cache")
    .update({
      lookup_count: (confident[0].lookup_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", confident[0].id)

  return confident.map(rowToResult)
}

export async function searchCacheBarcode(
  supabase: ReturnType<typeof createClient>,
  barcode: string,
): Promise<FoodSearchResult | null> {
  const { data, error } = await supabase
    .from("foods_cache")
    .select("*")
    .eq("barcode", barcode)
    .limit(1)
    .single()

  if (error || !data) {
    console.log(`[waterfall] cache barcode MISS for "${barcode}"`)
    return null
  }

  console.log(`[waterfall] cache barcode HIT for "${barcode}"`)

  // Increment lookup_count
  await supabase
    .from("foods_cache")
    .update({
      lookup_count: (data.lookup_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)

  return rowToResult(data)
}

// ─── Write-Back (Upsert) ─────────────────────────────────────

export async function cacheResult(
  supabase: ReturnType<typeof createClient>,
  result: FoodSearchResult,
): Promise<void> {
  try {
    // Check if already exists (by name_es + source, or by barcode)
    let existing = null

    if (result.barcode) {
      const { data } = await supabase
        .from("foods_cache")
        .select("id, lookup_count")
        .eq("barcode", result.barcode)
        .limit(1)
        .single()
      existing = data
    }

    if (!existing) {
      const { data } = await supabase
        .from("foods_cache")
        .select("id, lookup_count")
        .eq("name_es", result.name_es)
        .eq("source", result.source)
        .limit(1)
        .single()
      existing = data
    }

    if (existing) {
      // Update: increment lookup_count + update GI if now available
      const updateData: Record<string, unknown> = {
        lookup_count: (existing.lookup_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      }
      if (result.glycemic_index != null) {
        updateData.glycemic_index = result.glycemic_index
        updateData.glycemic_load = result.glycemic_load ?? null
        updateData.traffic_light = result.traffic_light ?? null
        updateData.gi_source = result.gi_source ?? "unknown"
      }
      await supabase
        .from("foods_cache")
        .update(updateData)
        .eq("id", existing.id)
      console.log(`[waterfall] cache UPDATE for "${result.name_es}" (source: ${result.source})`)
    } else {
      // Insert new
      await supabase.from("foods_cache").insert({
        name_es: result.name_es,
        name_en: result.name_en ?? null,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        fiber_g: result.fiber_g ?? null,
        serving_size: result.serving_size,
        serving_unit: result.serving_unit,
        source: result.source,
        source_id: result.source_id ?? null,
        barcode: result.barcode ?? null,
        confidence: result.confidence,
        image_url: result.image_url ?? null,
        glycemic_index: result.glycemic_index ?? null,
        glycemic_load: result.glycemic_load ?? null,
        traffic_light: result.traffic_light ?? null,
        gi_source: result.gi_source ?? "unknown",
        metadata: {},
      })
      console.log(`[waterfall] cache INSERT for "${result.name_es}" (source: ${result.source})`)
    }
  } catch (err) {
    // Cache write failure is non-critical — log and continue
    console.error(`[waterfall] cache write error for "${result.name_es}":`, err)
  }
}

export async function cacheUserCorrection(
  supabase: ReturnType<typeof createClient>,
  result: FoodSearchResult,
): Promise<void> {
  // Check how many user corrections exist for this food
  const { count } = await supabase
    .from("foods_cache")
    .select("id", { count: "exact", head: true })
    .eq("name_es", result.name_es)
    .eq("source", "user")

  const verified = (count ?? 0) >= 2 // This will be the 3rd

  await supabase.from("foods_cache").insert({
    name_es: result.name_es,
    name_en: result.name_en ?? null,
    calories: result.calories,
    protein_g: result.protein_g,
    carbs_g: result.carbs_g,
    fat_g: result.fat_g,
    fiber_g: result.fiber_g ?? null,
    serving_size: result.serving_size,
    serving_unit: result.serving_unit,
    source: "user",
    confidence: 0.9,
    verified,
    metadata: {},
  })

  // If verified (3+ corrections), mark all entries for this food as verified
  if (verified) {
    await supabase
      .from("foods_cache")
      .update({ verified: true })
      .eq("name_es", result.name_es)
  }
}

// ─── Helpers ─────────────────────────────────────────────────

interface CacheRow {
  id: string
  name_es: string
  name_en: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  serving_size: number | null
  serving_unit: string | null
  source: string
  source_id: string | null
  barcode: string | null
  confidence: number
  image_url: string | null
  lookup_count: number
  verified: boolean
  metadata: Record<string, unknown>
  glycemic_index: number | null
  glycemic_load: number | null
  traffic_light: string | null
  gi_source: string | null
  similarity_score?: number
}

function rowToResult(row: CacheRow): FoodSearchResult {
  return {
    id: row.id,
    name_es: row.name_es,
    name_en: row.name_en ?? undefined,
    calories: row.calories ?? 0,
    protein_g: row.protein_g ?? 0,
    carbs_g: row.carbs_g ?? 0,
    fat_g: row.fat_g ?? 0,
    fiber_g: row.fiber_g ?? undefined,
    serving_size: row.serving_size ?? 100,
    serving_unit: row.serving_unit ?? "g",
    source: row.source as FoodSearchResult["source"],
    source_id: row.source_id ?? undefined,
    confidence: row.confidence,
    barcode: row.barcode ?? undefined,
    image_url: row.image_url ?? undefined,
    glycemic_index: row.glycemic_index ?? undefined,
    glycemic_load: row.glycemic_load ?? undefined,
    traffic_light: (row.traffic_light as FoodSearchResult["traffic_light"]) ?? undefined,
    gi_source: (row.gi_source as FoodSearchResult["gi_source"]) ?? undefined,
  }
}

/**
 * Tier 2 — Open Food Facts API (Free, unlimited)
 *
 * Fallback for Mexican packaged products FatSecret misses.
 * Supports both barcode lookup and text search.
 */

import type { FoodSearchResult } from "./waterfall-types.ts"

const USER_AGENT = "Loti-App/1.0 (contact@loti.app)"
const TIMEOUT_MS = 3000

// ─── Barcode Lookup ──────────────────────────────────────────

export async function searchOFFBarcode(barcode: string): Promise<FoodSearchResult | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)

    if (!res.ok) {
      console.log(`[waterfall] openfoodfacts barcode MISS for "${barcode}"`)
      return null
    }

    const data = await res.json()
    if (!data.product || data.status === 0) {
      console.log(`[waterfall] openfoodfacts barcode MISS for "${barcode}"`)
      return null
    }

    const result = parseOFFProduct(data.product, barcode)
    if (result) {
      console.log(`[waterfall] openfoodfacts barcode HIT for "${barcode}" → ${result.name_es}`)
    }
    return result
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[waterfall] openfoodfacts barcode TIMEOUT for "${barcode}"`)
    } else {
      console.error(`[waterfall] openfoodfacts barcode error for "${barcode}":`, err)
    }
    return null
  }
}

// ─── Text Search ─────────────────────────────────────────────

export async function searchOFFText(query: string): Promise<FoodSearchResult[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl")
    url.searchParams.set("search_terms", query)
    url.searchParams.set("search_simple", "1")
    url.searchParams.set("action", "process")
    url.searchParams.set("json", "1")
    url.searchParams.set("page_size", "5")
    url.searchParams.set("countries_tags_en", "mexico")

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.log(`[waterfall] openfoodfacts text MISS for "${query}"`)
      return []
    }

    const data = await res.json()
    const products = data.products
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log(`[waterfall] openfoodfacts text MISS for "${query}"`)
      return []
    }

    const results: FoodSearchResult[] = []
    for (const product of products) {
      const result = parseOFFProduct(product)
      if (result) results.push(result)
    }

    console.log(`[waterfall] openfoodfacts text ${results.length > 0 ? "HIT" : "MISS"} for "${query}" — ${results.length} results`)
    return results
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[waterfall] openfoodfacts text TIMEOUT for "${query}"`)
    } else {
      console.error(`[waterfall] openfoodfacts text error for "${query}":`, err)
    }
    return []
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function parseOFFProduct(
  product: Record<string, unknown>,
  barcode?: string,
): FoodSearchResult | null {
  const nutriments = product.nutriments as Record<string, number> | undefined
  if (!nutriments) return null

  const servingQty = parseFloat(product.serving_quantity as string) || 100
  const useServing = !!product.serving_quantity

  const getNutrient = (key: string): number => {
    if (useServing) {
      return (
        parseFloat(String(nutriments[`${key}_serving`])) ||
        (parseFloat(String(nutriments[`${key}_100g`])) * servingQty) / 100 ||
        0
      )
    }
    return parseFloat(String(nutriments[`${key}_100g`])) || 0
  }

  const calories = getNutrient("energy-kcal")
  const protein_g = getNutrient("proteins")
  const carbs_g = getNutrient("carbohydrates")
  const fat_g = getNutrient("fat")
  const fiber_g = getNutrient("fiber")

  // Skip if basically no nutrition data
  if (calories === 0 && carbs_g === 0 && protein_g === 0) return null

  const name =
    (product.product_name as string) ??
    (product.product_name_en as string) ??
    (product.product_name_es as string) ??
    null
  if (!name) return null

  return {
    name_es: name,
    name_en: (product.product_name_en as string) ?? undefined,
    calories: Math.round(calories),
    protein_g: Math.round(protein_g * 10) / 10,
    carbs_g: Math.round(carbs_g * 10) / 10,
    fat_g: Math.round(fat_g * 10) / 10,
    fiber_g: Math.round(fiber_g * 10) / 10,
    serving_size: useServing ? servingQty : 100,
    serving_unit: "g",
    serving_description: (product.serving_size as string) ?? undefined,
    source: "openfoodfacts",
    source_id: (product.code as string) ?? barcode ?? undefined,
    confidence: 0.85,
    barcode: (product.code as string) ?? barcode ?? undefined,
    image_url: (product.image_url as string) ?? undefined,
  }
}

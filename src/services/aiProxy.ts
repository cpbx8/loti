/**
 * AI Proxy — thin fetch wrapper for Supabase Edge Functions.
 * No auth tokens, just an API key in the header.
 * Edge functions are stateless AI proxies (GPT-4o, FatSecret, OFF).
 */

const SUPABASE_FUNCTIONS_URL = (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1'
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const API_KEY = import.meta.env.VITE_LOTI_API_KEY || ''

async function callEdgeFunction(functionName: string, body: unknown) {
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'unknown' }))
    throw new Error(error.error || `Edge function failed: ${res.status}`)
  }

  return res.json()
}

/** Photo scan — GPT-4o Vision */
export async function scanPhoto(body: {
  image_base64: string
  locale?: string
  meal_type?: string
}) {
  return callEdgeFunction('scan', body)
}

/** Barcode scan — FatSecret OAuth + OFF */
export async function scanBarcode(body: {
  barcode: string
  meal_type?: string
}) {
  return callEdgeFunction('scan-barcode', body)
}

/** Text scan — GPT-4o-mini text parsing */
export async function scanText(body: {
  text: string
  locale?: string
  meal_type?: string
}) {
  return callEdgeFunction('scan-text', body)
}

/** Unified food search — waterfall: cache → FatSecret → OFF → GPT */
export async function searchFoods(body: {
  query: string
  type?: 'text' | 'barcode' | 'photo'
  image_base64?: string
  locale?: string
}) {
  return callEdgeFunction('search-foods', body)
}

/** AI meal suggestions — GPT-4o-mini */
export async function suggest(body: {
  meal_type?: string
  free_text?: string
  health_state?: string
  recent_scans?: unknown[]
  dietary_restrictions?: string[]
  locale?: string
  scan_summary?: string
  today_summary?: string
  green_max?: number
  yellow_max?: number
}) {
  // Reshape to match edge function's expected format
  return callEdgeFunction('suggest', {
    context: {
      type: body.free_text ? 'freetext' : 'meal',
      meal_type: body.meal_type,
      freetext: body.free_text,
    },
    profile: {
      health_state: body.health_state ?? 'healthy',
      goal: 'learn',
      a1c_value: null,
      age: null,
      sex: 'not_specified',
      activity_level: 'moderate',
      dietary_restrictions: body.dietary_restrictions ?? [],
      meal_struggles: [],
      medications: [],
      gl_threshold_green: body.green_max ?? 10,
      gl_threshold_yellow: body.yellow_max ?? 19,
    },
    scan_summary: body.scan_summary ?? '',
  })
}

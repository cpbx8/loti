/**
 * Shared auth + scan permission utilities for edge functions.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { corsHeaders } from "./cors.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

interface AuthResult {
  userId: string | null
  error?: Response
}

/** Extract user ID from Authorization header. Returns null if no auth or auth fails. */
export async function extractUserId(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return { userId: null }

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user } } = await client.auth.getUser()
    return { userId: user?.id ?? null }
  } catch {
    return { userId: null }
  }
}

interface PermissionResult {
  allowed: boolean
  reason: string
  scans_remaining?: number
  trial_days_remaining?: number
}

/** Check scan permission via server-side RPC. Returns null if check fails (allow by default). */
export async function checkPermission(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<PermissionResult | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc("check_scan_permission", { p_user_id: userId })
    if (error) {
      console.warn("[permission] RPC error:", error.message)
      return null // fail open
    }
    return data as PermissionResult
  } catch (err) {
    console.warn("[permission] Error:", err)
    return null // fail open
  }
}

/** Increment the user's daily scan counter. Fire-and-forget. */
export async function incrementScanCount(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  try {
    await supabaseAdmin.rpc("increment_scan_count", { p_user_id: userId })
  } catch (err) {
    console.warn("[permission] increment_scan_count error:", err)
  }
}

/** Build a 403 permission denied response */
export function permissionDeniedResponse(permission: PermissionResult): Response {
  return new Response(
    JSON.stringify({
      error: "SCAN_LIMIT_REACHED",
      reason: permission.reason,
      scans_remaining: permission.scans_remaining ?? 0,
      trial_days_remaining: permission.trial_days_remaining ?? 0,
    }),
    {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  )
}

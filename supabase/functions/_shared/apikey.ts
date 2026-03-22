/**
 * Simple API key validation for edge functions.
 * No user auth — just a shared secret to prevent unauthorized access.
 */

import { corsHeaders } from './cors.ts'

export function validateApiKey(req: Request): Response | null {
  const key = req.headers.get('x-api-key')
  const expected = Deno.env.get('LOTI_API_KEY')

  if (!expected || key !== expected) {
    return new Response(
      JSON.stringify({ error: 'UNAUTHORIZED', message: 'Invalid or missing API key' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  return null // Valid — proceed
}

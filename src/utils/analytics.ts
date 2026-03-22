import { supabase } from '@/lib/supabase'

/**
 * Lightweight analytics — tracks events in localStorage + Supabase conversion_events.
 * Supabase writes are fire-and-forget (don't await, don't block UI).
 */

const ANALYTICS_KEY = 'loti_analytics'

interface AnalyticsData {
  events: Record<string, number>
  first_open: string
  last_open: string
}

function getAnalytics(): AnalyticsData {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { events: {}, first_open: new Date().toISOString(), last_open: new Date().toISOString() }
}

function saveAnalytics(data: AnalyticsData) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

/** Track an event locally and to Supabase (fire-and-forget) */
export function trackEvent(event: string, eventData?: Record<string, unknown>) {
  // Local tracking
  const data = getAnalytics()
  data.events[event] = (data.events[event] ?? 0) + 1
  data.last_open = new Date().toISOString()
  saveAnalytics(data)

  // Supabase tracking (fire-and-forget, don't block UI)
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return
    supabase.from('conversion_events').insert({
      user_id: user.id,
      event_type: event,
      event_data: eventData ?? null,
    }).then(() => { /* ignore result */ })
  })
}

// Common events
export const Events = {
  PHOTO_SCAN: 'photo_scan',
  BARCODE_SCAN: 'barcode_scan',
  TEXT_SEARCH: 'text_search',
  AI_SUGGESTION: 'ai_suggestion',
  FOOD_LOGGED: 'food_logged',
  OXXO_GUIDE_OPENED: 'oxxo_guide_opened',
  OXXO_PRODUCT_VIEWED: 'oxxo_product_viewed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  SETTINGS_OPENED: 'settings_opened',
  TRIAL_STARTED: 'trial.started',
  PAYWALL_SHOWN: 'paywall.shown',
  PAYWALL_DISMISSED: 'paywall.dismissed',
  PAYWALL_CTA_TAPPED: 'paywall.cta_tapped',
  SCAN_BLOCKED: 'blocked.scan_attempted',
} as const

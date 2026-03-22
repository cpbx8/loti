/**
 * Lightweight analytics — tracks events in localStorage.
 * No server-side tracking (local-first architecture).
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

/** Track an event locally */
export function trackEvent(event: string, _eventData?: Record<string, unknown>) {
  const data = getAnalytics()
  data.events[event] = (data.events[event] ?? 0) + 1
  data.last_open = new Date().toISOString()
  saveAnalytics(data)
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

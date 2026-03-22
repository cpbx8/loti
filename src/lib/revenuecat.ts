/**
 * RevenueCat integration for Loti subscription management.
 * Handles trial, premium subscriptions, and purchase flows.
 * No user auth needed — RevenueCat generates an anonymous user ID.
 */

import { Capacitor } from '@capacitor/core'

// RevenueCat types — imported dynamically to avoid web build issues
type PurchasesOffering = import('@revenuecat/purchases-capacitor').PurchasesOffering
type PurchasesPackage = import('@revenuecat/purchases-capacitor').PurchasesPackage

const REVENUECAT_APPLE_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'appl_PLACEHOLDER'
const ENTITLEMENT_ID = 'premium'

let initialized = false

export async function initRevenueCat(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Skipping init on web')
    return
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.configure({ apiKey: REVENUECAT_APPLE_API_KEY })
    initialized = true
    console.log('[RevenueCat] Initialized successfully')
  } catch (err) {
    console.warn('[RevenueCat] Init failed:', err)
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !initialized) {
    // On web, treat as premium for development
    return true
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch (err) {
    console.warn('[RevenueCat] Failed to check premium:', err)
    return false
  }
}

export async function getTrialInfo(): Promise<{
  isTrialActive: boolean
  trialExpiresAt: string | null
  daysRemaining: number
}> {
  if (!Capacitor.isNativePlatform() || !initialized) {
    return { isTrialActive: true, trialExpiresAt: null, daysRemaining: 99 }
  }

  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: 'trial_started_at' })

    if (!value) {
      return { isTrialActive: false, trialExpiresAt: null, daysRemaining: 5 }
    }

    const startDate = new Date(value)
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / 86400000)
    const daysRemaining = Math.max(0, 5 - daysSinceStart)
    const trialExpiresAt = new Date(startDate.getTime() + 5 * 86400000).toISOString()

    return {
      isTrialActive: daysRemaining > 0,
      trialExpiresAt,
      daysRemaining,
    }
  } catch {
    return { isTrialActive: true, trialExpiresAt: null, daysRemaining: 5 }
  }
}

export async function startTrial(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: 'trial_started_at' })
    if (!value) {
      await Preferences.set({ key: 'trial_started_at', value: new Date().toISOString() })
    }
  } catch (err) {
    console.warn('[RevenueCat] Failed to start trial:', err)
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!Capacitor.isNativePlatform() || !initialized) return null

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { offerings } = await Purchases.getOfferings()
    return offerings.current || null
  } catch (err) {
    console.warn('[RevenueCat] Failed to get offerings:', err)
    return null
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !initialized) return false

  try {
    const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch (error: any) {
    // User cancelled is not an error
    if (error?.code === 'PURCHASE_CANCELLED_ERROR' || error?.code === 1) {
      return false
    }
    throw error
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !initialized) return false

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.restorePurchases()
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch (err) {
    console.warn('[RevenueCat] Restore failed:', err)
    return false
  }
}

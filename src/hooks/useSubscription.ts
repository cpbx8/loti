/**
 * Subscription hook — local-first with RevenueCat for premium.
 * Trial tracking via Capacitor Preferences, scan count from SQLite.
 * On web: mocks premium = true for development.
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { checkPremiumStatus, getTrialInfo, startTrial, getOfferings, purchasePackage, restorePurchases } from '@/lib/revenuecat'
import { getTotalScanCount } from '@/db/queries'

export interface ScanPermission {
  allowed: boolean
  reason: 'trial_active' | 'premium' | 'trial_scan_limit' | 'trial_expired'
  scans_remaining?: number
  trial_days_remaining?: number
  show_paywall: boolean
}

export type PaywallVariant = 'scan_limit' | 'mid_trial' | 'expired' | 'blocked_feature'
export type BlockedFeature = 'scan' | 'barcode' | 'text' | 'ai_assistant' | 'favorite'

const TRIAL_SCAN_LIMIT = 3

export function useSubscription() {
  const queryClient = useQueryClient()
  const [paywallImpressions, setPaywallImpressions] = useState(0)

  // RevenueCat premium status
  const premiumQuery = useQuery({
    queryKey: ['premiumStatus'],
    queryFn: checkPremiumStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Trial info from Capacitor Preferences
  const trialQuery = useQuery({
    queryKey: ['trialState'],
    queryFn: getTrialInfo,
    staleTime: 1000 * 60, // 1 minute
  })

  // Total lifetime scan count from SQLite
  const scanCountQuery = useQuery({
    queryKey: ['totalScanCount'],
    queryFn: getTotalScanCount,
    staleTime: 0, // Always fresh
  })

  const isPremium = premiumQuery.data ?? false
  const trial = trialQuery.data ?? { isTrialActive: true, trialExpiresAt: null, daysRemaining: 5 }
  const scansToday = scanCountQuery.data ?? 0

  const isTrialActive = !isPremium && trial.isTrialActive
  const isTrialExpired = !isPremium && !trial.isTrialActive && trial.daysRemaining <= 0
  const trialDaysRemaining = trial.daysRemaining
  const scansRemaining = isPremium ? Infinity : Math.max(0, TRIAL_SCAN_LIMIT - scansToday)

  const trialDay = useMemo(() => {
    return Math.min(5, Math.max(1, 5 - trialDaysRemaining + 1))
  }, [trialDaysRemaining])

  const checkScanPermission = useCallback((): ScanPermission => {
    if (isPremium) {
      return { allowed: true, reason: 'premium', show_paywall: false }
    }

    if (isTrialExpired) {
      return { allowed: false, reason: 'trial_expired', show_paywall: true }
    }

    if (scansRemaining <= 0) {
      return {
        allowed: false,
        reason: 'trial_scan_limit',
        scans_remaining: 0,
        trial_days_remaining: trialDaysRemaining,
        show_paywall: true,
      }
    }

    return {
      allowed: true,
      reason: 'trial_active',
      scans_remaining: scansRemaining,
      trial_days_remaining: trialDaysRemaining,
      show_paywall: false,
    }
  }, [isPremium, isTrialExpired, scansRemaining, trialDaysRemaining])

  const incrementScanCount = useCallback(() => {
    // Invalidate the scan count query — SQLite scan_logs is the source of truth
    queryClient.invalidateQueries({ queryKey: ['totalScanCount'] })
  }, [queryClient])

  const recordPaywallImpression = useCallback(() => {
    setPaywallImpressions(prev => prev + 1)
  }, [])

  const recordTouchpoint = useCallback((_touchpoint: string) => {
    // Could track locally if needed; no-op for now
  }, [])

  const activatePremium = useCallback(async (plan: 'monthly' | 'annual') => {
    const offering = await getOfferings()
    if (!offering) return false

    const packageId = plan === 'annual' ? '$rc_annual' : '$rc_monthly'
    const pkg = offering.availablePackages.find(p => p.identifier === packageId)
    if (!pkg) return false

    const success = await purchasePackage(pkg)
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['premiumStatus'] })
    }
    return success
  }, [queryClient])

  const restore = useCallback(async () => {
    const success = await restorePurchases()
    queryClient.invalidateQueries({ queryKey: ['premiumStatus'] })
    return success
  }, [queryClient])

  const beginTrial = useCallback(async () => {
    await startTrial()
    queryClient.invalidateQueries({ queryKey: ['trialState'] })
  }, [queryClient])

  const getPaywallVariant = useCallback((trigger?: BlockedFeature): PaywallVariant => {
    if (isTrialExpired) return 'expired'
    if (trigger) return 'blocked_feature'
    if (scansRemaining <= 0) return 'scan_limit'
    return 'mid_trial'
  }, [isTrialExpired, scansRemaining])

  return {
    // State
    is_premium: isPremium,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    trialDay,
    scans_today: scansToday,
    scansRemaining,
    dailyScanLimit: TRIAL_SCAN_LIMIT,
    paywall_impressions: paywallImpressions,
    subscription_type: null as 'monthly' | 'annual' | null,

    // Actions
    checkScanPermission,
    incrementScanCount,
    recordPaywallImpression,
    recordTouchpoint,
    activatePremium,
    getPaywallVariant,
    beginTrial,
    restore,
  }
}

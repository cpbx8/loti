import { useState, useEffect, useSyncExternalStore } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { initDatabase } from '@/db/database'
import { initRevenueCat } from '@/lib/revenuecat'
import TabBar from '@/components/TabBar'
import DashboardScreen from '@/screens/DashboardScreen'
import ScanScreen from '@/screens/ScanScreen'
import SearchScreen from '@/screens/SearchScreen'
import BarcodeScreen from '@/screens/BarcodeScreen'
import TextInputScreen from '@/screens/TextInputScreen'
import FavoritesScreen from '@/screens/FavoritesScreen'
import HistoryScreen from '@/screens/HistoryScreen'
import StoreGuideScreen from '@/screens/StoreGuideScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import PrivacyScreen from '@/screens/PrivacyScreen'
import TermsScreen from '@/screens/TermsScreen'
import WeeklyReportScreen from '@/screens/WeeklyReportScreen'
import PaywallScreen from '@/screens/PaywallScreen'
import OnboardingScreen from '@/screens/OnboardingScreen'

// Reactive onboarding check — re-renders when localStorage changes
// (works for both SQLite + localStorage, since SummaryScreen sets both)
const onboardingListeners = new Set<() => void>()
function subscribeOnboarding(cb: () => void) {
  onboardingListeners.add(cb)
  return () => onboardingListeners.delete(cb)
}
function getOnboardingSnapshot() {
  return localStorage.getItem('loti_onboarding_complete') === 'true'
}
const _origSet = localStorage.setItem.bind(localStorage)
localStorage.setItem = (key: string, value: string) => {
  _origSet(key, value)
  if (key === 'loti_onboarding_complete') onboardingListeners.forEach(cb => cb())
}
const _origRemove = localStorage.removeItem.bind(localStorage)
localStorage.removeItem = (key: string) => {
  _origRemove(key)
  if (key === 'loti_onboarding_complete') onboardingListeners.forEach(cb => cb())
}

function useOnboardingComplete() {
  return useSyncExternalStore(subscribeOnboarding, getOnboardingSnapshot)
}

export default function App() {
  const [ready, setReady] = useState(false)
  const onboarded = useOnboardingComplete()

  useEffect(() => {
    async function init() {
      try {
        await initDatabase()
        await initRevenueCat()
      } catch (err) {
        console.warn('[Loti] Init error (non-fatal):', err)
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <div className="text-4xl mb-3">🌊</div>
          <p className="text-sm text-text-secondary">Loading Loti...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter basename="/loti">
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 pb-[58px]">
          <Routes>
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/" element={onboarded ? <DashboardScreen /> : <Navigate to="/onboarding" replace />} />
            <Route path="/scan" element={<ScanScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/barcode" element={<BarcodeScreen />} />
            <Route path="/text" element={<TextInputScreen />} />
            <Route path="/favorites" element={<FavoritesScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/store-guide/:chainId" element={<StoreGuideScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/weekly-report" element={<WeeklyReportScreen />} />
            <Route path="/paywall" element={<PaywallScreen />} />
            <Route path="/privacy" element={<PrivacyScreen />} />
            <Route path="/terms" element={<TermsScreen />} />
          </Routes>
        </div>
        <TabBar />
      </div>
    </BrowserRouter>
  )
}

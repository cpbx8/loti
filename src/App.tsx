import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSyncExternalStore } from 'react'
import DashboardScreen from '@/screens/DashboardScreen'
import ScanScreen from '@/screens/ScanScreen'
import SearchScreen from '@/screens/SearchScreen'
import BarcodeScreen from '@/screens/BarcodeScreen'
import TextInputScreen from '@/screens/TextInputScreen'
import FavoritesScreen from '@/screens/FavoritesScreen'
import HistoryScreen from '@/screens/HistoryScreen'
import StoreGuideScreen from '@/screens/StoreGuideScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import OnboardingScreen from '@/screens/OnboardingScreen'

// Reactive onboarding check — re-renders when localStorage changes
const onboardingListeners = new Set<() => void>()
function subscribeOnboarding(cb: () => void) {
  onboardingListeners.add(cb)
  return () => onboardingListeners.delete(cb)
}
function getOnboardingSnapshot() {
  return localStorage.getItem('loti_onboarding_complete') === 'true'
}
// Patch localStorage.setItem to notify subscribers
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
  const onboarded = useOnboardingComplete()

  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  )
}

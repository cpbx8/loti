import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function hasCompletedOnboarding(): boolean {
  return localStorage.getItem('loti_onboarding_complete') === 'true'
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/" element={hasCompletedOnboarding() ? <DashboardScreen /> : <Navigate to="/onboarding" replace />} />
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

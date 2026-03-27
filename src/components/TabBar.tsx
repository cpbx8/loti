import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import { useLanguage } from '@/lib/i18n'

/** Routes where the tab bar should be hidden */
const HIDDEN_ROUTES = ['/onboarding', '/settings', '/paywall', '/scan', '/barcode', '/text', '/search', '/weekly-report', '/privacy', '/terms', '/meal-ideas', '/food', '/my-meals', '/create-meal', '/log-meal']

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const sub = useSubscription()
  const { t } = useLanguage()

  const isHidden = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r)) ||
    location.pathname.startsWith('/store-guide')
  if (isHidden) return null

  const isHistory = location.pathname.startsWith('/history')
  const isHome = location.pathname === '/'

  const gatedNavigate = (path: string) => {
    setMenuOpen(false)
    const perm = sub.checkScanPermission()
    if (!perm.allowed) {
      navigate('/paywall')
      return
    }
    navigate(path)
  }

  return (
    <>
      {/* Scan menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Scan menu — pops above the + button on the right */}
      {menuOpen && (
        <div
          className="fixed z-50 right-4"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 78px)' }}
        >
          <div className="flex flex-col items-end gap-2">
            {[
              { path: '/scan', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ), label: t('scan.photo') },
              { path: '/barcode', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M3 4v16M7 4v16M11 4v16M15 4v16M19 4v16M5 4v16M9 4v16M13 4v16M17 4v16M21 4v16" />
                </svg>
              ), label: t('scan.barcode') },
              { path: '/text', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ), label: t('scan.text') },
              { path: '/meal-ideas', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                </svg>
              ), label: t('scan.mealIdeas') },
              { path: '/my-meals', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              ), label: t('scan.myMeals') },
            ].map(({ path, icon, label }) => (
              <button
                key={path}
                onClick={() => gatedNavigate(path)}
                className="flex items-center gap-3 rounded-2xl bg-on-surface/90 backdrop-blur-md px-4 py-2.5 text-white/90 shadow-lg min-h-[44px]"
              >
                <span className="text-[12px] font-medium">{label}</span>
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-stretch glass z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* History tab — left */}
        <button
          onClick={() => navigate('/history')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] transition-colors ${
            isHistory ? 'text-primary' : 'text-text-tertiary'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-medium">{t('tab.history')}</span>
        </button>

        {/* Home — center, elevated */}
        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={() => navigate('/')}
            className={`flex h-14 w-14 items-center justify-center rounded-full -mt-5 transition-all active:scale-90 shadow-lg ${
              isHome ? 'bg-primary' : 'bg-surface-container-high'
            }`}
            style={isHome ? { boxShadow: '0px 8px 24px rgba(166, 47, 74, 0.30)' } : { boxShadow: '0px 4px 12px rgba(0,0,0,0.10)' }}
            aria-label="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isHome ? 'text-white' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>

        {/* + button — far right, elevated */}
        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex h-14 w-14 items-center justify-center rounded-full -mt-5 transition-all active:scale-90 ${
              menuOpen ? 'bg-on-surface rotate-45' : 'btn-gradient !p-0'
            }`}
            style={!menuOpen ? { boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' } : { boxShadow: '0px 12px 32px rgba(26, 28, 27, 0.15)' }}
            aria-label={menuOpen ? t('common.closeMenu') : t('common.addFood')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </nav>
    </>
  )
}

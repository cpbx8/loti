import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import { useLanguage } from '@/lib/i18n'

/** Routes where the tab bar should be hidden */
const HIDDEN_ROUTES = ['/onboarding', '/settings', '/paywall', '/scan', '/barcode', '/text', '/search', '/weekly-report', '/privacy', '/terms']

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
  const isFavorites = location.pathname.startsWith('/favorites')

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

      {/* Scan menu — 3 icon buttons in a compact dark bar */}
      {menuOpen && (
        <div
          className="fixed z-50 left-0 right-0 flex justify-center px-6"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 78px)' }}
        >
          <div className="flex items-center gap-0 rounded-2xl bg-on-surface/90 backdrop-blur-md p-1.5 shadow-lg">
            <button
              onClick={() => gatedNavigate('/scan')}
              className="flex flex-col items-center gap-1 rounded-xl px-5 py-2.5 text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px] min-w-[72px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[10px] font-medium">{t('scan.photo')}</span>
            </button>

            <div className="w-px h-8 bg-white/15" />

            <button
              onClick={() => gatedNavigate('/barcode')}
              className="flex flex-col items-center gap-1 rounded-xl px-5 py-2.5 text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px] min-w-[72px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M3 4v16M7 4v16M11 4v16M15 4v16M19 4v16M5 4v16M9 4v16M13 4v16M17 4v16M21 4v16" />
              </svg>
              <span className="text-[10px] font-medium">{t('scan.barcode')}</span>
            </button>

            <div className="w-px h-8 bg-white/15" />

            <button
              onClick={() => gatedNavigate('/text')}
              className="flex flex-col items-center gap-1 rounded-xl px-5 py-2.5 text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px] min-w-[72px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-[10px] font-medium">{t('scan.text')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab bar — glass, no border */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-stretch glass z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* History tab */}
        <button
          onClick={() => navigate('/history')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] transition-colors ${
            isHistory ? 'text-primary' : 'text-text-tertiary'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={isHistory ? 'currentColor' : '#9CA3AF'} strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-[10px] font-medium ${isHistory ? 'text-primary' : 'text-text-tertiary'}`}>
            {t('tab.history')}
          </span>
        </button>

        {/* Center + button */}
        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex h-14 w-14 items-center justify-center rounded-full -mt-5 transition-all active:scale-90 ${
              menuOpen
                ? 'bg-on-surface rotate-45'
                : 'btn-gradient !p-0'
            }`}
            style={!menuOpen ? { boxShadow: '0px 12px 32px rgba(166, 47, 74, 0.25)' } : { boxShadow: '0px 12px 32px rgba(26, 28, 27, 0.15)' }}
            aria-label={menuOpen ? 'Cerrar menú' : 'Agregar alimento'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Favorites tab */}
        <button
          onClick={() => navigate('/favorites')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] transition-colors ${
            isFavorites ? 'text-primary' : 'text-text-tertiary'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFavorites ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke={isFavorites ? 'currentColor' : '#9CA3AF'} strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className={`text-[10px] font-medium ${isFavorites ? 'text-primary' : 'text-text-tertiary'}`}>
            {t('tab.favorites')}
          </span>
        </button>
      </nav>
    </>
  )
}

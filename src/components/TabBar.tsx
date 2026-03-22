import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  {
    key: 'history',
    path: '/history',
    label: 'Historial',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : '#9CA3AF'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'scan',
    path: '/',
    label: 'Escanear',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : '#9CA3AF'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3H5a2 2 0 00-2 2v2m0 10v2a2 2 0 002 2h2m10-18h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    key: 'favorites',
    path: '/favorites',
    label: 'Favoritos',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke={active ? 'currentColor' : '#9CA3AF'} strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
]

/** Routes where the tab bar should be hidden */
const HIDDEN_ROUTES = ['/onboarding', '/settings', '/paywall', '/scan', '/barcode', '/text', '/search', '/weekly-report', '/privacy', '/terms']

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  // Hide on non-tab routes
  const isHidden = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r)) ||
    location.pathname.startsWith('/store-guide')
  if (isHidden) return null

  return (
    <nav className="flex items-stretch border-t border-border bg-card" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(tab => {
        const active = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path)

        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] transition-colors ${
              active ? 'text-primary' : 'text-text-tertiary'
            }`}
          >
            {tab.icon(active)}
            <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-text-tertiary'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

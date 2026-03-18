import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStoreProducts } from '@/hooks/useStoreProducts'
import TrafficLightBadge from '@/components/TrafficLightBadge'
import StoreProductDetail from '@/components/StoreProductDetail'
import type { StoreProduct, TrafficFilter } from '@/types/storeGuide'
import { getCategoryMeta, OXXO_HACKS } from '@/types/storeGuide'

const TRAFFIC_TABS: { key: TrafficFilter; label: string; color: string; activeColor: string }[] = [
  { key: 'all',    label: 'All',    color: 'text-text-secondary', activeColor: 'text-text-primary border-text-primary' },
  { key: 'green',  label: 'Green',  color: 'text-tl-green-fill',  activeColor: 'text-tl-green-fill border-tl-green-fill' },
  { key: 'yellow', label: 'Yellow', color: 'text-tl-yellow-fill', activeColor: 'text-tl-yellow-fill border-tl-yellow-fill' },
  { key: 'red',    label: 'Red',    color: 'text-tl-red-fill',    activeColor: 'text-tl-red-fill border-tl-red-fill' },
]

const RATING_HEADERS: Record<string, { label: string; color: string }> = {
  green:  { label: '🟢 GREEN — SAFE CHOICES',      color: 'text-tl-green-fill' },
  yellow: { label: '🟡 YELLOW — MODERATE IMPACT',   color: 'text-tl-yellow-fill' },
  red:    { label: '🔴 RED — HIGH IMPACT',          color: 'text-tl-red-fill' },
}

function OxxoHackCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const interacting = useRef(false)
  const interactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild?.clientWidth ?? 1
    const index = Math.round(el.scrollLeft / cardWidth)
    setActiveIndex(Math.min(index, OXXO_HACKS.length - 1))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (interacting.current) return
      const el = scrollRef.current
      if (!el) return
      const next = (activeIndex + 1) % OXXO_HACKS.length
      const cardWidth = el.firstElementChild?.clientWidth ?? 0
      el.scrollTo({ left: next * cardWidth, behavior: 'smooth' })
    }, 5000)
    return () => clearInterval(interval)
  }, [activeIndex])

  const handleTouchStart = () => {
    interacting.current = true
    if (interactionTimer.current) clearTimeout(interactionTimer.current)
  }

  const handleTouchEnd = () => {
    interactionTimer.current = setTimeout(() => { interacting.current = false }, 3000)
  }

  return (
    <div className="bg-[#8B0000] pb-3">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 gap-3 no-scrollbar"
      >
        {OXXO_HACKS.map((hack, i) => (
          <div
            key={i}
            className="flex-shrink-0 snap-start rounded-xl bg-white/10 border border-white/10 p-3"
            style={{ width: 'calc(100% - 32px)' }}
          >
            <p className="text-[10px] font-bold text-[#F2CD00] uppercase tracking-wider mb-1">
              💡 OXXO Hack
            </p>
            <p className="text-xs text-white/90 leading-relaxed">{hack}</p>
          </div>
        ))}
      </div>
      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {OXXO_HACKS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === activeIndex ? 'w-3 bg-[#F2CD00]' : 'w-1 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function StoreGuideScreen() {
  const navigate = useNavigate()
  const { chainId = 'oxxo' } = useParams()
  const { products, loading, error, counts } = useStoreProducts(chainId)

  const [trafficFilter, setTrafficFilter] = useState<TrafficFilter>('all')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedQuery(value), 200)
  }, [])

  // Filter products based on traffic light tab, category chips, and search
  const filtered = useMemo(() => {
    let result = products

    if (trafficFilter !== 'all') {
      result = result.filter(p => p.traffic_light === trafficFilter)
    }

    if (activeCategories.size > 0) {
      result = result.filter(p => activeCategories.has(p.category))
    }

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim()
      result = result.filter(p =>
        p.product_name.toLowerCase().includes(q) ||
        (p.brand?.toLowerCase().includes(q) ?? false)
      )
    }

    return result
  }, [products, trafficFilter, activeCategories, debouncedQuery])

  // Available categories for current traffic filter
  const availableCategories = useMemo(() => {
    let base = products
    if (trafficFilter !== 'all') {
      base = base.filter(p => p.traffic_light === trafficFilter)
    }
    const catCounts = new Map<string, number>()
    for (const p of base) {
      catCounts.set(p.category, (catCounts.get(p.category) ?? 0) + 1)
    }
    return Array.from(catCounts.entries())
      .map(([key, count]) => ({ key, count, meta: getCategoryMeta(key) }))
      .sort((a, b) => a.meta.sortOrder - b.meta.sortOrder)
  }, [products, trafficFilter])

  // Group filtered products: rating → category → products
  const grouped = useMemo(() => {
    const ratings = trafficFilter === 'all'
      ? (['green', 'yellow', 'red'] as const)
      : [trafficFilter as 'green' | 'yellow' | 'red']

    return ratings.map(rating => {
      const ratingProducts = filtered.filter(p => p.traffic_light === rating)
      const catMap = new Map<string, StoreProduct[]>()
      for (const p of ratingProducts) {
        const list = catMap.get(p.category) ?? []
        list.push(p)
        catMap.set(p.category, list)
      }
      const categories = Array.from(catMap.entries())
        .map(([key, prods]) => ({
          key,
          meta: getCategoryMeta(key),
          products: prods.sort((a, b) => (a.estimated_gl ?? 0) - (b.estimated_gl ?? 0)),
        }))
        .sort((a, b) => a.meta.sortOrder - b.meta.sortOrder)

      return { rating, categories, count: ratingProducts.length }
    }).filter(g => g.count > 0)
  }, [filtered, trafficFilter])

  const toggleCategory = (key: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSwapTap = (product: StoreProduct) => {
    setSelectedProduct(product)
  }

  return (
    <div className="flex flex-1 flex-col bg-surface">
      {/* Header — OXXO branded */}
      <header className="flex items-center border-b border-[#A00000] bg-[#8B0000] px-5 py-3">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-white/70 hover:text-white min-h-[44px] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="ml-3 flex-1 text-lg font-bold">
          <span className="text-[#F2CD00] font-extrabold">OXXO</span>
          <span className="text-white ml-1.5">Guide</span>
        </h1>
        <span className="text-xs text-white/50">{counts.total} products</span>
      </header>

      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 bg-[#8B0000]">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 min-h-[44px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none py-2"
          />
          {searchQuery && (
            <button
              onClick={() => { handleSearchChange(''); searchRef.current?.focus() }}
              className="text-white/50 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* OXXO Hack carousel */}
      <OxxoHackCarousel />

      {/* Traffic light tabs */}
      <div className="flex border-b border-border bg-card">
        {TRAFFIC_TABS.map(tab => {
          const count = tab.key === 'all' ? counts.total : counts[tab.key as 'green' | 'yellow' | 'red']
          const isActive = trafficFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setTrafficFilter(tab.key); setActiveCategories(new Set()) }}
              className={`flex-1 py-2.5 text-center text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                isActive ? tab.activeColor : `${tab.color} border-transparent opacity-70`
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Category filter chips */}
      {availableCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-card border-b border-border no-scrollbar">
          {availableCategories.map(({ key, count, meta }) => {
            const isActive = activeCategories.has(key)
            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                {meta.emoji} {meta.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="text-text-secondary">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm text-text-secondary">No products match your filters</p>
          <button
            onClick={() => { setTrafficFilter('all'); setActiveCategories(new Set()); handleSearchChange('') }}
            className="mt-3 text-sm font-medium text-primary"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-24">
          {grouped.map(group => (
            <div key={group.rating}>
              {/* Rating group header */}
              {trafficFilter === 'all' && (
                <div className={`sticky top-0 z-10 bg-surface px-5 py-2 ${RATING_HEADERS[group.rating].color}`}>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {RATING_HEADERS[group.rating].label}
                  </p>
                </div>
              )}

              {group.categories.map(cat => (
                <div key={cat.key} className="mb-2">
                  {/* Category subheader */}
                  <div className="px-5 py-2">
                    <p className="text-xs font-semibold text-text-secondary">
                      {cat.meta.emoji} {cat.meta.label}
                    </p>
                  </div>

                  {/* Product rows */}
                  <div className="mx-4 rounded-xl bg-card overflow-hidden divide-y divide-border">
                    {cat.products.map(product => (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface active:bg-surface transition-colors min-h-[44px]"
                      >
                        <div className="mt-0.5">
                          <TrafficLightBadge rating={product.traffic_light} size="sm" showIcon={false} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {product.brand && `${product.brand} · `}
                            GL: {product.estimated_gl ?? 0}
                            {product.is_best_choice && ' · ⭐ Best Choice'}
                          </p>
                          {product.traffic_light !== 'green' && product.swap_suggestion && (
                            <p className="text-xs text-text-tertiary mt-0.5 truncate">
                              → Swap: {product.swap_suggestion}
                            </p>
                          )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-text-tertiary mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

        </div>
      )}

      {/* Product detail sheet */}
      {selectedProduct && (
        <StoreProductDetail
          product={selectedProduct}
          allProducts={products}
          onClose={() => setSelectedProduct(null)}
          onSwapTap={handleSwapTap}
        />
      )}
    </div>
  )
}

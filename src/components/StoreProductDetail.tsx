import { useState, useEffect } from 'react'
import TrafficLightBadge from './TrafficLightBadge'
import { useDailyLog } from '@/hooks/useDailyLog'
import type { StoreProduct } from '@/types/storeGuide'

interface StoreProductDetailProps {
  product: StoreProduct | null
  allProducts: StoreProduct[]
  onClose: () => void
  onSwapTap: (product: StoreProduct) => void
}

const IMPACT_LABEL: Record<string, string> = {
  green: 'Low Impact',
  yellow: 'Moderate Impact',
  red: 'High Impact',
}

const GL_COLOR: Record<string, string> = {
  green: 'text-tl-green-fill',
  yellow: 'text-tl-yellow-fill',
  red: 'text-tl-red-fill',
}

const WHY_BG: Record<string, string> = {
  green: 'bg-tl-green-bg/60',
  yellow: 'bg-tl-yellow-bg/60',
  red: 'bg-tl-red-bg/60',
}

function findSwapProduct(swapText: string, allProducts: StoreProduct[]): StoreProduct | null {
  const lower = swapText.toLowerCase()
  return allProducts.find(p => p.product_name.toLowerCase() === lower) ?? null
}

export default function StoreProductDetail({ product, allProducts, onClose, onSwapTap }: StoreProductDetailProps) {
  const { addEntry } = useDailyLog()
  const [logged, setLogged] = useState(false)

  // Reset logged state when product changes
  useEffect(() => { setLogged(false) }, [product?.id])

  if (!product) return null

  const tl = product.traffic_light
  const gl = product.estimated_gl ?? 0
  const swapProduct = product.swap_suggestion ? findSwapProduct(product.swap_suggestion, allProducts) : null

  const handleLog = () => {
    addEntry({
      food_name: product.product_name,
      calories_kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: null,
      glycemic_load: gl,
      result_traffic_light: tl,
      serving_size_g: 0,
      input_method: 'oxxo_guide',
    })
    setLogged(true)
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-w-[430px] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-8">
          {/* Hero */}
          <div className="flex items-start gap-4 mb-4">
            <TrafficLightBadge rating={tl} size="lg" />
            <div className="flex-1 pt-1">
              <h2 className="text-lg font-bold text-text-primary leading-tight">
                {product.product_name}
              </h2>
              {product.brand && (
                <p className="text-sm text-text-secondary mt-0.5">{product.brand}</p>
              )}
              {product.serving_label && (
                <p className="text-xs text-text-tertiary mt-0.5">{product.serving_label}</p>
              )}
            </div>
          </div>

          {/* GL Display + Log button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${GL_COLOR[tl]}`}>
                GL: {gl}
              </span>
              <span className="text-sm text-text-secondary">
                {IMPACT_LABEL[tl]}
              </span>
            </div>
            <button
              onClick={handleLog}
              disabled={logged}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all min-h-[40px] ${
                logged
                  ? 'bg-tl-green-bg text-tl-green-fill'
                  : 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80'
              }`}
            >
              {logged ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Logged
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Log Food
                </>
              )}
            </button>
          </div>

          {/* WHY card */}
          {(product.why_tip || product.why_detail) && (
            <div className={`rounded-xl p-4 mb-4 ${WHY_BG[tl]}`}>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Why</p>
              {product.why_tip && (
                <p className="text-sm font-semibold text-text-primary">{product.why_tip}</p>
              )}
              {product.why_detail && (
                <p className="text-sm text-text-secondary mt-1">{product.why_detail}</p>
              )}
            </div>
          )}

          {/* SWAP card (yellow/red) or GREAT CHOICE (green) */}
          {tl === 'green' ? (
            <div className="rounded-xl bg-tl-green-bg/60 p-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <p className="text-sm font-semibold text-tl-green-fill">Great choice</p>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                This is one of the best options at OXXO for your glucose. Grab it!
              </p>
            </div>
          ) : product.swap_suggestion ? (
            <div className="rounded-xl border border-border bg-surface p-4 mb-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                💡 Try instead
              </p>
              {swapProduct ? (
                <button
                  className="flex w-full items-center gap-3 rounded-lg p-2 -m-2 text-left hover:bg-card active:bg-card transition-colors"
                  onClick={() => onSwapTap(swapProduct)}
                >
                  <TrafficLightBadge rating={swapProduct.traffic_light} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {swapProduct.product_name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {swapProduct.brand && `${swapProduct.brand} · `}
                      GL: {swapProduct.estimated_gl ?? 0} · {IMPACT_LABEL[swapProduct.traffic_light]}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <p className="text-sm text-text-primary">{product.swap_suggestion}</p>
              )}
            </div>
          ) : null}

          {/* Price */}
          {product.price_mxn != null && (
            <p className="text-xs text-text-tertiary mb-2">
              ~${product.price_mxn} MXN
            </p>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-text-tertiary leading-relaxed mt-4 pt-4 border-t border-border">
            This information is educational. Values are estimates based on nutrition labels.
            Individual responses may vary. Consult your doctor for treatment decisions.
          </p>
        </div>
      </div>
    </div>
  )
}

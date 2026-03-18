import { useNavigate } from 'react-router-dom'
import { useStoreProducts } from '@/hooks/useStoreProducts'

export default function StoreGuideCard() {
  const navigate = useNavigate()
  const { counts, loading } = useStoreProducts('oxxo')

  return (
    <button
      onClick={() => navigate('/store-guide/oxxo')}
      className="mx-5 mt-3 w-auto rounded-xl bg-[#8B0000] p-4 shadow-sm text-left transition-colors hover:bg-[#A00000] active:bg-[#700000]"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-extrabold text-[#F2CD00] tracking-tight">OXXO</span>
        <h3 className="text-base font-bold text-white">Guide</h3>
      </div>

      <p className="text-sm text-white/70 mb-3">
        Every product rated by glucose impact
      </p>

      {!loading && counts.total > 0 && (
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-tl-green-fill" />
            <span className="text-xs font-medium text-white/80">{counts.green}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F2CD00]" />
            <span className="text-xs font-medium text-white/80">{counts.yellow}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-tl-red-fill" />
            <span className="text-xs font-medium text-white/80">{counts.red}</span>
          </div>
          <span className="text-xs text-white/50">{counts.total} products</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-sm font-semibold text-[#F2CD00]">
        Open Guide
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

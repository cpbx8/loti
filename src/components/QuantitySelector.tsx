interface QuantitySelectorProps {
  quantity: number
  onChange: (q: number) => void
  min?: number
  max?: number
}

export default function QuantitySelector({ quantity, onChange, min = 1, max = 20 }: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-600 text-lg font-bold text-gray-300 transition-colors hover:border-gray-400 hover:text-white disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-xl font-bold text-white">{quantity}</span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-600 text-lg font-bold text-gray-300 transition-colors hover:border-gray-400 hover:text-white disabled:opacity-30"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

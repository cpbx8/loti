import { useEffect, useRef, useState, Component, type ReactNode, type FormEvent } from 'react'

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void
  onError?: (message: string) => void
  active: boolean
}

// ─── Manual barcode entry form ─────────────────────────────
function ManualBarcodeInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed.length >= 4) {
      onSubmit(trimmed)
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter barcode number"
        className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 shadow-sm"
      />
      <button
        type="submit"
        disabled={value.trim().length < 4}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 min-h-[44px]"
      >
        Look Up
      </button>
    </form>
  )
}

// ─── Error boundary to prevent crashes from bubbling up ────
class ScannerErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}

function BarcodeReaderInner({ onDetected, onError, active }: BarcodeScannerProps) {
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const detectedRef = useRef(false)
  const [cameraState, setCameraState] = useState<'loading' | 'active' | 'error'>('loading')
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    detectedRef.current = false
    setCameraState('loading')
    setCameraError(null)

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const scanner = new Html5Qrcode('barcode-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (detectedRef.current) return
            detectedRef.current = true
            scanner.stop().catch(() => {})
            onDetected(decodedText)
          },
          () => {},
        )
        if (!cancelled) setCameraState('active')
      } catch (err) {
        if (cancelled) return
        const msg = String(err)
        const userMsg = msg.includes('NotFound') || msg.includes('not found')
          ? 'No camera found on this device.'
          : 'Could not access camera.'
        setCameraError(userMsg)
        setCameraState('error')
        onError?.(userMsg)
      }
    }

    startScanner()

    return () => {
      cancelled = true
      scannerRef.current?.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [active, onDetected, onError])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera area — stays dark since it's a camera viewfinder */}
      {cameraState !== 'error' && (
        <div className="relative w-full overflow-hidden rounded-xl bg-gray-900">
          {cameraState === 'loading' && (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-primary" />
              <p className="ml-3 text-sm text-gray-400">Starting camera...</p>
            </div>
          )}
          <div id="barcode-reader" className={`w-full ${cameraState === 'loading' ? 'hidden' : ''}`} />
          {cameraState === 'active' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-[150px] w-[280px] rounded border-2 border-primary/60">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 animate-pulse bg-primary/80" />
              </div>
            </div>
          )}
        </div>
      )}

      {cameraState === 'error' && (
        <div className="rounded-xl bg-card px-4 py-3 shadow-sm">
          <p className="text-sm text-text-secondary">{cameraError}</p>
        </div>
      )}

      {/* Manual entry — always visible */}
      <p className="text-xs text-text-tertiary">
        {cameraState === 'error' ? 'Enter barcode manually:' : 'Or enter barcode manually:'}
      </p>
      <ManualBarcodeInput onSubmit={onDetected} />
    </div>
  )
}

export default function BarcodeScanner(props: BarcodeScannerProps) {
  const fallback = (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-card p-8 shadow-sm">
      <p className="text-sm text-text-secondary">Could not initialize barcode scanner.</p>
      <p className="text-xs text-text-tertiary">Enter a barcode number manually instead:</p>
      <ManualBarcodeInput onSubmit={props.onDetected} />
    </div>
  )

  return (
    <ScannerErrorBoundary fallback={fallback}>
      <BarcodeReaderInner {...props} />
    </ScannerErrorBoundary>
  )
}

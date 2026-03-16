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
        className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={value.trim().length < 4}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
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
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    detectedRef.current = false
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
      } catch (err) {
        if (cancelled) return
        const msg = String(err)
        const userMsg = msg.includes('NotFound') || msg.includes('not found')
          ? 'No camera found on this device.'
          : 'Could not access camera.'
        setCameraError(userMsg)
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

  if (cameraError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-gray-900 p-8">
        <p className="text-sm text-gray-400">{cameraError}</p>
        <p className="text-xs text-gray-600">Enter a barcode number manually instead:</p>
        <ManualBarcodeInput onSubmit={onDetected} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-xl bg-black">
        <div id="barcode-reader" className="w-full" />
        {active && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[150px] w-[280px] rounded border-2 border-primary/60">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 animate-pulse bg-primary/80" />
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600">Or enter barcode manually:</p>
      <ManualBarcodeInput onSubmit={onDetected} />
    </div>
  )
}

export default function BarcodeScanner(props: BarcodeScannerProps) {
  const fallback = (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-gray-900 p-8">
      <p className="text-sm text-gray-400">Could not initialize barcode scanner.</p>
      <p className="text-xs text-gray-600">Enter a barcode number manually instead:</p>
      <ManualBarcodeInput onSubmit={props.onDetected} />
    </div>
  )

  return (
    <ScannerErrorBoundary fallback={fallback}>
      <BarcodeReaderInner {...props} />
    </ScannerErrorBoundary>
  )
}

import { useEffect, useRef, useState, useCallback } from 'react'

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void
  onError?: (message: string) => void
  active: boolean
}

function normalizeBarcode(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 8 && digits.length <= 14) {
    return digits.padStart(13, '0')
  }
  return null
}

/**
 * Full-screen barcode scanner using getUserMedia + ZXing continuous decoding.
 */
export default function BarcodeScanner({ onDetected, onError, active }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectedRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  const onErrorRef = useRef(onError)

  const [cameraState, setCameraState] = useState<'loading' | 'active' | 'error'>('loading')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  onDetectedRef.current = onDetected
  onErrorRef.current = onError

  const handleDetection = useCallback((code: string) => {
    if (detectedRef.current) return
    const normalized = normalizeBarcode(code)
    if (!normalized) return
    detectedRef.current = true
    setLastScanned(normalized)
    if ('vibrate' in navigator) navigator.vibrate(100)
    setTimeout(() => onDetectedRef.current(normalized), 300)
  }, [])

  useEffect(() => {
    if (!active) return

    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let readerControls: any = null
    detectedRef.current = false
    setCameraState('loading')
    setCameraError(null)
    setLastScanned(null)

    const start = async () => {
      try {
        // Step 1: Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => video.play().then(resolve).catch(reject)
          setTimeout(() => reject(new Error('Video timeout')), 8000)
        })
        if (cancelled) return
        setCameraState('active')

        // Step 2: Use ZXing continuous decoding from the video element
        try {
          const zxingBrowser = await import('@zxing/browser')
          const zxingLib = await import('@zxing/library')

          const hints = new Map()
          hints.set(zxingLib.DecodeHintType.POSSIBLE_FORMATS, [
            zxingLib.BarcodeFormat.EAN_13,
            zxingLib.BarcodeFormat.EAN_8,
            zxingLib.BarcodeFormat.UPC_A,
            zxingLib.BarcodeFormat.UPC_E,
            zxingLib.BarcodeFormat.CODE_128,
          ])
          hints.set(zxingLib.DecodeHintType.TRY_HARDER, true)

          const reader = new zxingBrowser.BrowserMultiFormatReader(hints, {
            delayBetweenScanAttempts: 150,
            delayBetweenScanSuccess: 3000,
          })

          // Use decodeFromStream to piggyback on our existing getUserMedia stream
          // This avoids ZXing trying to open a second camera stream
          readerControls = await reader.decodeFromStream(stream, video, (result, error) => {
            if (cancelled || detectedRef.current) return
            if (result) {
              handleDetection(result.getText())
            }
            // error is normal (no barcode in frame) — just ignore
            void error
          })
        } catch (zxingErr) {
          console.warn('ZXing failed, trying native BarcodeDetector:', zxingErr)
          // Fallback: native BarcodeDetector (Chrome Android, macOS Safari 17.2+)
          const BD = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
          if (BD) {
            const detector = new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
            const scanLoop = setInterval(async () => {
              if (cancelled || detectedRef.current || !video || video.readyState < 2) return
              try {
                const results = await detector.detect(video)
                if (results.length > 0) handleDetection(results[0].rawValue)
              } catch { /* ignore */ }
            }, 200)
            readerControls = { stop: () => clearInterval(scanLoop) }
          }
        }
      } catch (err) {
        if (cancelled) return
        const msg = String(err)
        const userMsg = msg.includes('NotFound') || msg.includes('not found')
          ? 'No camera found on this device.'
          : msg.includes('NotAllowed') || msg.includes('Permission')
            ? 'Camera permission denied. Please allow camera access.'
            : msg.includes('timeout')
              ? 'Camera took too long to start. Try again.'
              : 'Could not access camera.'
        setCameraError(userMsg)
        setCameraState('error')
        onErrorRef.current?.(userMsg)
      }
    }

    start()

    return () => {
      cancelled = true
      try { readerControls?.stop?.() } catch { /* ignore */ }
      readerControls = null
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [active, handleDetection])

  if (cameraState === 'error') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-900 p-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
        <p className="text-sm text-gray-300 text-center">{cameraError ?? 'Camera unavailable.'}</p>
        <p className="text-xs text-gray-500 text-center">You can enter the barcode number manually below.</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Loading */}
      {cameraState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-green-400" />
          <p className="text-sm text-gray-400">Starting camera...</p>
        </div>
      )}

      {/* Camera feed — video must be visible for ZXing to decode from it */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Green scan overlay */}
      {cameraState === 'active' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />

          <div className="relative z-10" style={{ width: '80%', maxWidth: 320, aspectRatio: '2/1' }}>
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-[3px] border-r-[3px] border-green-400 rounded-br-lg" />

            {/* Animated scan line */}
            <div
              className="absolute left-2 right-2 h-0.5 bg-green-400"
              style={{
                boxShadow: '0 0 12px rgba(74,222,128,0.7), 0 0 4px rgba(74,222,128,0.5)',
                animation: 'scanline 2s ease-in-out infinite',
              }}
            />

            {/* Flash green on detection */}
            {lastScanned && (
              <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-pulse bg-green-400/10" />
            )}
          </div>

          <div className="absolute bottom-24 left-0 right-0 text-center z-10">
            {lastScanned ? (
              <p className="text-sm font-medium text-green-400 bg-black/60 inline-block px-4 py-1.5 rounded-full">
                Barcode found: {lastScanned}
              </p>
            ) : (
              <p className="text-sm text-gray-300 bg-black/60 inline-block px-4 py-1.5 rounded-full">
                Point at a barcode
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  )
}

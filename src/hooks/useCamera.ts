import { useState, useCallback, useRef } from 'react'
import { compressImage } from '@/lib/compress'

// Try Capacitor camera, but don't hard-fail if unavailable
let CapCamera: typeof import('@capacitor/camera').Camera | null = null
let CameraResultType: typeof import('@capacitor/camera').CameraResultType | null = null
let CameraSource: typeof import('@capacitor/camera').CameraSource | null = null

try {
  const mod = await import('@capacitor/camera')
  CapCamera = mod.Camera
  CameraResultType = mod.CameraResultType
  CameraSource = mod.CameraSource
} catch {
  // Capacitor not available — web fallback will be used
}

interface CameraState {
  previewUrl: string | null
  base64: string | null
  loading: boolean
  error: string | null
}

/**
 * Detect if we're running in a native Capacitor shell.
 * On web (GitHub Pages, localhost), we use file input fallback.
 */
function isNativeCapacitor(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Capacitor?.isNativePlatform?.()
  } catch { return false }
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    previewUrl: null,
    base64: null,
    loading: false,
    error: null,
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /** Process a file/blob from either native camera or file input */
  const processPhoto = useCallback(async (blob: Blob, previewUrl: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const base64 = await compressImage(blob)
      setState({ previewUrl, base64, loading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process photo'
      setState(s => ({ ...s, loading: false, error: message }))
    }
  }, [])

  /** Native Capacitor camera capture */
  const captureNative = useCallback(async () => {
    if (!CapCamera || !CameraResultType || !CameraSource) return false

    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const photo = await CapCamera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
      })

      if (!photo.webPath) throw new Error('No photo captured')

      const response = await fetch(photo.webPath)
      const blob = await response.blob()
      const base64 = await compressImage(blob)

      setState({ previewUrl: photo.webPath, base64, loading: false, error: null })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera failed'
      if (message.includes('cancelled') || message.includes('canceled')) {
        setState(s => ({ ...s, loading: false }))
        return true // User cancelled — still "handled"
      }
      // Native camera failed — fall through to web
      setState(s => ({ ...s, loading: false }))
      return false
    }
  }, [])

  /** Web fallback: trigger file input with camera capture */
  const captureWeb = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.style.display = 'none'
      input.addEventListener('change', () => {
        const file = input.files?.[0]
        if (file) {
          const url = URL.createObjectURL(file)
          processPhoto(file, url)
        }
        // Reset so the same file can be selected again
        input.value = ''
      })
      document.body.appendChild(input)
      fileInputRef.current = input
    }
    fileInputRef.current.click()
  }, [processPhoto])

  /** Upload from gallery / file picker (no camera capture attribute) */
  const uploadFromGallery = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    // No capture attribute — opens gallery/file picker instead of camera
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        processPhoto(file, url)
      }
      document.body.removeChild(input)
    })
    document.body.appendChild(input)
    input.click()
  }, [processPhoto])

  /** Main capture — tries native first, falls back to web */
  const capture = useCallback(async () => {
    if (isNativeCapacitor()) {
      const handled = await captureNative()
      if (handled) return
    }
    // Web fallback
    captureWeb()
  }, [captureNative, captureWeb])

  const reset = useCallback(() => {
    setState({ previewUrl: null, base64: null, loading: false, error: null })
  }, [])

  return { ...state, capture, uploadFromGallery, reset }
}

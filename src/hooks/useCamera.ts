import { useState, useCallback } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { compressImage } from '@/lib/compress'

interface CameraState {
  /** Preview URL for displaying the captured photo */
  previewUrl: string | null
  /** Compressed base64 ready to send to the scan API */
  base64: string | null
  loading: boolean
  error: string | null
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    previewUrl: null,
    base64: null,
    loading: false,
    error: null,
  })

  const capture = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))

    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
      })

      if (!photo.webPath) throw new Error('No photo captured')

      const previewUrl = photo.webPath

      // Fetch the photo blob and compress it
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const base64 = await compressImage(blob)

      setState({ previewUrl, base64, loading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera failed'
      // User cancelled — don't show error
      if (message.includes('cancelled') || message.includes('canceled')) {
        setState((s) => ({ ...s, loading: false }))
        return
      }
      setState((s) => ({ ...s, loading: false, error: message }))
    }
  }, [])

  const reset = useCallback(() => {
    setState({ previewUrl: null, base64: null, loading: false, error: null })
  }, [])

  return { ...state, capture, reset }
}

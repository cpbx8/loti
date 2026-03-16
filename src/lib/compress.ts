import { IMAGE_CONFIG } from './constants'

/**
 * Compress an image file/blob to a JPEG base64 string sized for the scan API.
 * Resizes to fit within MAX_DIMENSION while preserving aspect ratio.
 */
export async function compressImage(source: Blob | string): Promise<string> {
  const img = await loadImage(source)

  const { width, height } = fitDimensions(
    img.naturalWidth,
    img.naturalHeight,
    IMAGE_CONFIG.MAX_DIMENSION,
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_CONFIG.JPEG_QUALITY)
  // Strip the data:image/jpeg;base64, prefix
  const base64 = dataUrl.split(',')[1]

  if (base64.length > IMAGE_CONFIG.MAX_BASE64_SIZE_BYTES) {
    throw new Error('Compressed image exceeds 4MB limit')
  }

  return base64
}

function loadImage(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))

    if (typeof source === 'string') {
      img.src = source
    } else {
      img.src = URL.createObjectURL(source)
    }
  })
}

function fitDimensions(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h }
  const ratio = Math.min(max / w, max / h)
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

/** Glycemic Load thresholds for traffic light classification */
export const GL_THRESHOLDS = {
  GREEN_MAX: 10,  // GL < 10 = green (low impact)
  YELLOW_MAX: 20, // GL 10-19 = yellow (medium impact)
  // GL >= 20 = red (high impact)
} as const

/** Default daily macro targets (before onboarding personalization) */
export const DEFAULT_GOALS = {
  calories: 2000,
  protein_g: 50,
  carbs_g: 250,
  fat_g: 65,
} as const

/** Rate limiting */
export const RATE_LIMIT = {
  SCANS_PER_HOUR: 20,
} as const

/** Image compression settings */
export const IMAGE_CONFIG = {
  MAX_DIMENSION: 1024,
  JPEG_QUALITY: 0.7,
  MAX_BASE64_SIZE_BYTES: 4 * 1024 * 1024, // 4MB
} as const

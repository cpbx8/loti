import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.loti.scanner',
  appName: 'Loti',
  webDir: 'dist',
  server: {
    // Enable cleartext for local dev; remove for production
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      // iOS will use Info.plist for camera permission string
    },
  },
}

export default config

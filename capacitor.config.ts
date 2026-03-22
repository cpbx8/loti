import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.loti.scanner',
  appName: 'Loti',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.loti.scanner',
    allowNavigation: ['*.supabase.co', '*.openfoodfacts.org'],
  },
  plugins: {
    Camera: {
      // iOS will use Info.plist for camera permission string
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
    },
  },
}

export default config

import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
  )
}

// Use Capacitor Preferences on native platforms for reliable token persistence.
// Falls back to localStorage on web.
const isNative = Capacitor.isNativePlatform()

const CapacitorStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isNative) return localStorage.getItem(key)
    const { value } = await Preferences.get({ key })
    return value
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isNative) {
      localStorage.setItem(key, value)
      return
    }
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string): Promise<void> => {
    if (!isNative) {
      localStorage.removeItem(key)
      return
    }
    await Preferences.remove({ key })
  },
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: CapacitorStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Capacitor doesn't use URL-based auth
  },
})

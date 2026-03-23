import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(() => ({
  // GitHub Pages needs /loti/ base path; Capacitor needs /
  base: process.env.CAPACITOR_BUILD === 'true' ? '/' : '/loti/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
}))

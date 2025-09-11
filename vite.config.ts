import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://xtpfssiraytzvdvgrsol.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cGZzc2lyYXl0enZkdmdyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNjM1NzcsImV4cCI6MjA3MTgzOTU3N30.sr3C3c9vEC2yuM4k503_EcXjKp7kfX5TZx9uBM53UOw'),
    'import.meta.env.VITE_ADMIN_UUIDS': JSON.stringify(process.env.VITE_ADMIN_UUIDS || '470c82f5-3997-4d93-a433-4dfee4a199c2')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/scenes': path.resolve(__dirname, './src/scenes'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/i18n': path.resolve(__dirname, './src/i18n'),
      '@/net': path.resolve(__dirname, './src/net')
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^\/]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300 // 5 minutes
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Etimuè Bottle Dropper',
        short_name: 'Bottle Dropper',
        description: 'Professional arcade game - Catch craft bottles, avoid industrial ones, and climb the leaderboard!',
        theme_color: '#0ea5a3',
        background_color: '#b7e3f0',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['games', 'arcade', 'entertainment'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
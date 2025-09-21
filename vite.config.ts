import { defineConfig } from 'vite'
// import { VitePWA } from 'vite-plugin-pwa'  // DISABLED due to cache corruption
import path from 'path'

export default defineConfig({
  plugins: [
    // TEMPORARILY DISABLED PWA/Service Worker due to catastrophic cache corruption
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     skipWaiting: true,
    //     clientsClaim: true,
    //     cleanupOutdatedCaches: true
    //   },
    //   manifest: {
    //     name: 'Etimuè Bottle Dropper',
    //     short_name: 'Bottle Dropper',
    //     description: 'Fun bottle dropping game by Etimuè',
    //     theme_color: '#1a1a1a',
    //     background_color: '#ffffff',
    //     display: 'standalone'
    //   }
    // })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/scenes': path.resolve(__dirname, './src/scenes'),
      '@/systems': path.resolve(__dirname, './src/systems'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  },
  // Removed define block - let Vite load from .env file automatically
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Force new hashes by adding timestamp
        entryFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        chunkFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        assetFileNames: `assets/[name]-${Date.now()}-[hash].[ext]`,
        manualChunks: {
          phaser: ['phaser'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
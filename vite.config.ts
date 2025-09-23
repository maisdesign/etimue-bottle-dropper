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
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/main.js`,
        chunkFileNames: `assets/main.js`, // Force everything to main.js
        assetFileNames: `assets/[name].[ext]`,
        // Force EVERYTHING into a single file
        manualChunks: () => 'main'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' silently updates the service worker in the background.
      // The next time the user opens the app after a deploy, they get the
      // latest version automatically without any prompt.
      registerType: 'autoUpdate',

      // Include all built assets in the precache so the app works offline
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // No runtime caching: GOV.UK and MoJ Frontend are compiled into the bundle,
        // so every asset the app needs is precached and nothing is fetched at runtime.
      },

      // Web app manifest — controls how the app appears when installed
      manifest: {
        name: 'Impact Evaluation Feasibility Tool',
        short_name: 'Eval Feasibility',
        description: 'Decision-support tool for assessing impact evaluation design feasibility.',
        theme_color: '#54319f',
        background_color: '#54319f',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        categories: ['productivity', 'government', 'research'],
      },
    }),
  ],
  base: '/',
})

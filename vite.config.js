import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Update 'base' to match your GitHub repository name exactly.
// This must match the repo name in your GitHub Pages URL.
const REPO_NAME = 'policy-evaluation-feasibility-tool'

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
        // Cache GOV.UK and MoJ CDN assets for offline use
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },

      // Web app manifest — controls how the app appears when installed
      manifest: {
        name: 'Impact Evaluation Feasibility Tool',
        short_name: 'Eval Feasibility',
        description: 'Decision-support tool for assessing impact evaluation design feasibility. Ministry of Justice | Government Social Research.',
        theme_color: '#9C1B6D',
        background_color: '#0B0C0C',
        display: 'standalone',
        orientation: 'any',
        scope: `/${REPO_NAME}/`,
        start_url: `/${REPO_NAME}/`,
        icons: [
          {
            src: `/${REPO_NAME}/icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `/${REPO_NAME}/icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/${REPO_NAME}/icons/apple-touch-icon.png`,
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        categories: ['productivity', 'government', 'research'],
      },
    }),
  ],
  base: `/${REPO_NAME}/`,
})

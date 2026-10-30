import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The app version had been copied into seven places and had already drifted once. It is
// injected from package.json instead, so there is one source of it.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
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
        //
        // Since the switch from hash URLs to real paths, an installed app opening at
        // /assessment asks the service worker for a document that was never built. Without
        // this the app works online, where public/_redirects serves the fallback, and
        // fails offline on every route but the root — which is the hardest version of the
        // bug to notice.
        navigateFallback: 'index.html',
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

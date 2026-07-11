import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'assets/apple-touch-icon.png'],
      manifest: {
        name: 'HPB National Launch 2026 – Registration',
        short_name: 'Launch Register',
        description: 'Advance participant registration for the HPB National Launch 2026.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#010A2B',
        background_color: '#F6F5F5',
        icons: [
          { src: '/assets/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/assets/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/assets/pwa-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache only the public shell and static assets — never registration/confirmation data.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/\.netlify\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Never cache the registration API.
            urlPattern: /\/\.netlify\/functions\//,
            handler: 'NetworkOnly',
            method: 'POST',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: { target: 'es2019', sourcemap: false, cssCodeSplit: false },
});

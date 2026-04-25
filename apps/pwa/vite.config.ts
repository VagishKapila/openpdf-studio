import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },

      workbox: {
        // Precache all static assets (content-hashed filenames = safe to cache forever)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // 5 MB limit covers pdf.worker.min.mjs (~2-3 MB) — eliminates workbox size warning
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        runtimeCaching: [
          // Google Fonts stylesheets — CacheFirst, 1-year TTL
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts assets — CacheFirst, 1-year TTL
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-assets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // App shell navigation — NetworkFirst with 3s timeout, falls back to cache
          {
            urlPattern: /^https:\/\/app\.snaphw\.com\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // New SW activates immediately — no need for users to close all tabs
        skipWaiting: true,
        clientsClaim: true,

        // Remove stale caches from previous deploys on activation
        cleanupOutdatedCaches: true,
      },

      manifest: {
        name: 'OpenPDF Studio',
        short_name: 'OpenPDF',
        description: 'Free, private, local-first PDF editor',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          vendor: ['react', 'react-dom', 'zustand', 'dexie'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});

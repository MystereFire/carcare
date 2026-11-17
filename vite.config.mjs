import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CarCare — votre garage, simplement',
        short_name: 'CarCare',
        description: 'Véhicules, dépenses et entretien au même endroit.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f1518',
        theme_color: '#65d6b1',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Browser navigation may use the app shell offline; personal API data
        // and uploaded vehicle photos always go to the authenticated server.
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/api-docs(?:\/|$)/, /^\/uploads(?:\/|$)/, /^\/health(?:\/|$)/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  server: {
    fs: {
      strict: true,
      deny: [
        // Extending this list replaces Vite's defaults, so retain all of them.
        '.env',
        '.env.*',
        '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc',
        '.yarnrc.yml',
        '**/.git/**',
        '**/data/**',
        '**/server/**',
        '**/.qa/**',
        '**/.npm-cache/**',
        '**/.npmrc',
      ],
    },
  },
  build: { outDir: 'dist' },
});

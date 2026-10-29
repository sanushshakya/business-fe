// vite.config.mjs

import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { generateSW } from 'workbox-build';

const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000';
const API_PREFIXES = ['auth', 'tenants', 'inventory', 'sales', 'demand', 'calendar', 'logistics', 'pricing', 'sync', 'common'];

/**
 * Generates the service worker once the bundle has been written to dist/.
 */
const serviceWorkerPlugin = () => ({
  name: 'generate-service-worker',
  apply: 'build',
  async closeBundle() {
    await generateSW({
      globDirectory: 'dist',
      globPatterns: ['**/*.{js,css,html}'],
      swDest: 'dist/sw.js',
    });
  },
});

export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    // The backend has no CORS configuration, so the dev server proxies API calls to it.
    proxy: {
      ...Object.fromEntries(API_PREFIXES.map((prefix) => [`/${prefix}/`, { target: API_TARGET, changeOrigin: true }])),
      '/ws/': { target: API_TARGET, changeOrigin: true, ws: true }, // live sync status (useStorefrontSync)
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/setupTests.js'],
  },
});

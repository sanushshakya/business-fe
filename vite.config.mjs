// vite.config.mjs

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { generateSW } from 'workbox-build';

/**
 * Generate the service worker precache manifest.
 * @returns {Promise<void>}
 */
async function generateServiceWorkerManifest() {
  try {
    const swBuildConfig = {
      globDirectory: 'dist',
      globPatterns: ['**/*.{js,css,html}'],
      swDest: 'dist/sw.js',
    };

    await generateSW(swBuildConfig);
    console.log('Service worker precache manifest generated successfully.');
  } catch (error) {
    console.error('Failed to generate service worker precache manifest:', error);
  }
}

// Run the manifest generation during build
if (process.env.NODE_ENV === 'production') {
  generateServiceWorkerManifest();
}

export default defineConfig({
  plugins: [
    react(),
  ],
});
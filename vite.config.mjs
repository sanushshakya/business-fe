// vite.config.mjs

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import workboxPlugin from 'vite-plugin-pwa';

// Import Workbox configuration file
import workbox from './workbox-config.js';

export default defineConfig({
  plugins: [
    react(),
    workboxPlugin(workbox),
  ],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: ({ name }) => (name.endsWith('.css') ? 'assets/[name].[hash][extname]' : 'assets/[name].[hash][extname]'),
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
});
```

```javascript
// workbox-config.js

export default {
  // Define the directory for the service worker registration script
  globDirectory: './dist',

  // Define the patterns to precache, include all JS/CSS/HTML build assets
  globPatterns: [
    '**/*.{js,css,html}',
  ],

  // Set the prefix for cached URLs
  skipWaiting: true,
  clientsClaim: true,
};
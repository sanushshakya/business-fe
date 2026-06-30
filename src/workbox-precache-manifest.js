// src/workbox-precache-manifest.js

/**
 * This script is used to generate a precache manifest for Workbox that includes all build assets.
 * The manifest is then used by the service worker to precache these assets during installation.
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(__dirname, '../dist');
const MANIFEST_PATH = path.resolve(SRC_DIR, 'workbox-precache-manifest.js');

/**
 * Generates a precache manifest file that includes all build assets.
 * @returns {void}
 */
function generateManifest() {
  const filesToPrecache = [];

  // Read the contents of the dist directory and add all files to the precache list
  fs.readdirSync(SRC_DIR).forEach(file => {
    if (file === 'workbox-precache-manifest.js') return; // Skip this file itself

    const filePath = path.join(SRC_DIR, file);
    const fileStat = fs.statSync(filePath);

    if (!fileStat.isDirectory()) {
      filesToPrecache.push({
        url: `/${file}`,
        revision: null,
        size: fileStat.size
      });
    }
  });

  // Generate the manifest content
  const manifestContent = `
const precacheManifest = ${JSON.stringify(filesToPrecache, null, 2)};
export default precacheManifest;
`;

  // Write the manifest to a file
  fs.writeFileSync(MANIFEST_PATH, manifestContent);

  console.log(`Generated precache manifest with ${filesToPrecache.length} files.`);
}

// Run the manifest generation function when this script is executed
generateManifest();
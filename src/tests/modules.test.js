import { describe, expect, it } from 'vitest';

// Every source module must at least parse and resolve its imports.
const modules = import.meta.glob([
  '../**/*.{js,jsx}',
  '!../**/*.test.{js,jsx}',
  '!../tests/**',
  '!../main.jsx',
  '!../workbox-precache-manifest.js',
]);

describe('module smoke test', () => {
  for (const [path, load] of Object.entries(modules)) {
    it(`imports ${path}`, async () => {
      await expect(load()).resolves.toBeDefined();
    });
  }
});

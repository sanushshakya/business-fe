import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The barcode fixtures are shared with the backend (business-iq `inventory/barcode_fixtures.json`); both repos pin the
// same SHA-256, so changing one copy fails here until the other is updated too.
const FIXTURES_SHA256 = 'e7d60e39394af71927a36d9987579d091481cbee7a0e2eb223f241fa3b095f98';
// Vitest runs from the fe root (jsdom gives no file: URL for import.meta.url).
const FIXTURES = resolve('src/utils/barcodes/barcode_fixtures.json');
const BACKEND_COPY = resolve('../config/inventory/barcode_fixtures.json');

describe('shared barcode fixtures', () => {
  it('match the pinned checksum', () => {
    const digest = createHash('sha256').update(readFileSync(FIXTURES)).digest('hex');
    expect(
      digest,
      'barcode_fixtures.json changed: copy it from config/inventory/ and update both pinned hashes ' +
        `(this test and config inventory/test_barcode_fixtures_checksum.py) to ${digest}.`
    ).toBe(FIXTURES_SHA256);
  });

  it.skipIf(!existsSync(BACKEND_COPY))('match the backend copy byte for byte', () => {
    expect(
      readFileSync(FIXTURES).equals(readFileSync(BACKEND_COPY)),
      'copy config/inventory/barcode_fixtures.json here'
    ).toBe(true);
  });
});

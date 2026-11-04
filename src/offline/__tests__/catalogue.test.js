import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { initRxDB } from '../../offlineDB';
import { applyCatalogue, clearCatalogue, readCatalogue, readMeta, readSession, saveSession } from '../catalogue';

let db;
beforeEach(async () => {
  db = await initRxDB({ name: `c${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
});
afterEach(async () => {
  await db?.destroy();
  db = null;
});

const rice = { id: 1, name: 'Fake Rice', barcode: '5012345678900', price: '2.50', sold_by: 'each', stock_quantity: 10 };
const mince = { id: 2, name: 'Fake Mince', barcode: '', price: '0.00', price_per_kg: '8.9900', sold_by: 'weight' };
const body = (overrides = {}) => ({
  cursor: '2026-11-04T12:00:00+00:00',
  full: true,
  user: 7,
  company: 3,
  products: [rice, mince],
  removed: [],
  vat_rates: [{ id: 1, code: 'zero', rate: '0.00', valid_from: '1973-04-01' }],
  barcode_rules: [{ id: 4, prefix: '21' }],
  tills: [{ id: 9, branch: 5, number: 1, is_active: true }],
  branches: [{ id: 5, name: 'Fake High Street' }],
  settings: { manual_weight_max_kg: '25', offline_warn_hours: 4, offline_confirm_hours: 24, offline_stop_hours: 72 },
  ...overrides,
});
const names = async () => (await readCatalogue(db)).products.map((p) => p.name).sort();

describe('till catalogue in RxDB', () => {
  it('stores a full load: products and the small lists', async () => {
    expect(await applyCatalogue(db, body())).toEqual({ applied: true, needsFull: false });
    const { products, meta } = await readCatalogue(db);
    expect(products).toHaveLength(2);
    expect(products.find((p) => p.id === 2).price_per_kg).toBe('8.9900');
    expect(meta).toEqual(
      expect.objectContaining({
        cursor: '2026-11-04T12:00:00+00:00',
        owner: { user: 7, company: 3 },
        barcodeRules: [{ id: 4, prefix: '21' }],
        tills: [{ id: 9, branch: 5, number: 1, is_active: true }],
        refreshedAt: expect.any(Number),
      })
    );
  });

  it('applies a delta: changed products replaced, removed ones dropped', async () => {
    await applyCatalogue(db, body());
    await applyCatalogue(
      db,
      body({ full: false, cursor: '2026-11-04T12:01:00+00:00', products: [{ ...rice, price: '2.75' }], removed: [2] })
    );
    const { products, meta } = await readCatalogue(db);
    expect(products).toEqual([{ ...rice, price: '2.75' }]);
    expect(meta.cursor).toBe('2026-11-04T12:01:00+00:00');
  });

  it('replaces everything on a full load, dropping products it no longer has', async () => {
    await applyCatalogue(db, body());
    await applyCatalogue(db, body({ cursor: '2026-11-04T13:00:00+00:00', products: [mince] }));
    expect(await names()).toEqual(['Fake Mince']);
  });

  it('ignores an older cursor (a slow answer arriving after a newer one)', async () => {
    await applyCatalogue(db, body({ cursor: '2026-11-04T13:00:00+01:00' })); // 12:00 UTC
    const stale = body({ full: false, cursor: '2026-11-04T11:30:00+00:00', products: [{ ...rice, price: '1.00' }] });
    expect(await applyCatalogue(db, stale)).toEqual({ applied: false, needsFull: false });
    expect((await readCatalogue(db)).products.find((p) => p.id === 1).price).toBe('2.50');
  });

  it('wipes the cache for a different owner and asks for a full load', async () => {
    await applyCatalogue(db, body());
    await saveSession(db, 9, { id: 40, status: 'open' });
    const other = body({ full: false, user: 8, company: 4, cursor: '2026-11-04T12:05:00+00:00', products: [] });
    expect(await applyCatalogue(db, other)).toEqual({ applied: false, needsFull: true });
    expect(await readCatalogue(db)).toEqual({ products: [], meta: null });
    expect(await readSession(db, 9)).toBeUndefined();
  });

  it('asks for a full load when a delta arrives with nothing cached', async () => {
    expect(await applyCatalogue(db, body({ full: false }))).toEqual({ applied: false, needsFull: true });
  });

  it('keeps the last-known open session per till', async () => {
    await saveSession(db, 9, { id: 40, status: 'open' });
    await saveSession(db, 10, null);
    expect(await readSession(db, 9)).toEqual({ id: 40, status: 'open' });
    expect(await readSession(db, 10)).toBeNull();
    expect(await readSession(db, 11)).toBeUndefined(); // never seen here
  });

  it('applies answers one at a time, so a slower older answer cannot win', async () => {
    await applyCatalogue(db, body());
    const newer = body({ full: false, cursor: '2026-11-04T12:02:00+00:00', products: [{ ...rice, price: '3.00' }] });
    const older = body({ full: false, cursor: '2026-11-04T12:01:00+00:00', products: [{ ...rice, price: '1.00' }] });
    await Promise.all([applyCatalogue(db, newer), applyCatalogue(db, older)]);
    expect((await readCatalogue(db)).products.find((p) => p.id === 1).price).toBe('3.00');
  });

  it('remembers when the last full load was', async () => {
    await applyCatalogue(db, body());
    const { lastFullAt } = await readMeta(db);
    expect(lastFullAt).toEqual(expect.any(Number));
    await applyCatalogue(db, body({ full: false, cursor: '2026-11-04T12:01:00+00:00', products: [] }));
    expect((await readMeta(db)).lastFullAt).toBe(lastFullAt);
  });

  it('clears safely when two wipes run at once (React mounts the till twice in development)', async () => {
    await applyCatalogue(db, body());
    await expect(Promise.all([clearCatalogue(db), clearCatalogue(db)])).resolves.toBeDefined();
    expect(await readCatalogue(db)).toEqual({ products: [], meta: null });
  });

  it('clears everything', async () => {
    await applyCatalogue(db, body());
    await clearCatalogue(db);
    expect(await readCatalogue(db)).toEqual({ products: [], meta: null });
  });
});

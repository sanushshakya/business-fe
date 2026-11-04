import { afterEach, describe, expect, it } from 'vitest';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { initRxDB } from '../../offlineDB';
import { applyCatalogue, clearCatalogue } from '../catalogue';
import { branchPrefix, listQueued, nextOfflineNumber, queueSale, voidQueued } from '../salesQueue';

let db;
afterEach(async () => {
  await db?.destroy();
  db = null;
});
const open = (name, storage) => initRxDB({ name, storage });
const where = { tillId: 3, branchCode: 'HS', tillNumber: 2 };
const sale = (n) => ({
  client_ref: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  created_at: new Date(Date.UTC(2026, 10, 4, 12, 0, n)).toISOString(),
  session: 9,
  cashier: 7,
  body: { session: 9, payment_method: 'cash', amount_tendered: '5.00', items: [{ product: 1, quantity: 1 }] },
  receipt: { total: '2.50', items: [] },
});

describe('offline sales queue', () => {
  it('keeps 50 offline sales through a browser restart, with no duplicate client_ref (G27 done-when)', async () => {
    const name = `q${Math.random().toString(36).slice(2)}`;
    const storage = getRxStorageMemory();
    db = await open(name, storage);
    for (let n = 1; n <= 50; n += 1) await queueSale(db, { sale: sale(n), ...where });
    await db.destroy();

    db = await open(name, storage);
    const queued = await listQueued(db, 3);
    expect(queued).toHaveLength(50);
    expect(new Set(queued.map((s) => s.client_ref)).size).toBe(50);
    const numbers = queued.map((s) => s.offline_number).sort();
    expect(new Set(numbers).size).toBe(50);
    expect(numbers[0]).toMatch(/^HS-T02-[A-Z]{3}-000001$/);
    expect(numbers[49]).toMatch(/-000050$/);
    expect(queued[0].client_ref).toBe(sale(50).client_ref); // newest first
  });

  it('numbers concurrent sales uniquely', async () => {
    db = await open(`q${Math.random().toString(36).slice(2)}`, getRxStorageMemory());
    await Promise.all([1, 2, 3, 4, 5].map((n) => queueSale(db, { sale: sale(n), ...where })));
    const numbers = (await listQueued(db, 3)).map((s) => s.offline_number.slice(-6)).sort();
    expect(numbers).toEqual(['000001', '000002', '000003', '000004', '000005']);
  });

  it('counts per till and keeps one run code per till', async () => {
    db = await open(`q${Math.random().toString(36).slice(2)}`, getRxStorageMemory());
    const a1 = await nextOfflineNumber(db, where);
    const a2 = await nextOfflineNumber(db, where);
    const b1 = await nextOfflineNumber(db, { tillId: 4, branchCode: 'HS', tillNumber: 12 });
    expect(a2.slice(0, 11)).toBe(a1.slice(0, 11));
    expect([a1.slice(-6), a2.slice(-6), b1.slice(-6)]).toEqual(['000001', '000002', '000001']);
    expect(b1).toMatch(/^HS-T12-[A-Z]{3}-000001$/);
  });

  it('uses B<branch id> when the branch has no code', () => {
    expect(branchPrefix({ id: 7, code: '' })).toBe('B7');
    expect(branchPrefix({ id: 7, code: 'HS' })).toBe('HS');
    expect(branchPrefix(undefined)).toBe('B0');
  });

  it('never queues the same client_ref twice', async () => {
    db = await open(`q${Math.random().toString(36).slice(2)}`, getRxStorageMemory());
    const first = await queueSale(db, { sale: sale(1), ...where });
    const again = await queueSale(db, { sale: sale(1), ...where });
    expect(again.offline_number).toBe(first.offline_number); // the one already queued
    expect(await listQueued(db, 3)).toHaveLength(1);
  });

  it('voids a queued sale with a reason', async () => {
    db = await open(`q${Math.random().toString(36).slice(2)}`, getRxStorageMemory());
    await queueSale(db, { sale: sale(1), ...where });
    await voidQueued(db, sale(1).client_ref, 'Fake: wrong item', 7);
    const [voided] = await listQueued(db, 3);
    expect(voided).toEqual(
      expect.objectContaining({ status: 'voided', void_reason: 'Fake: wrong item', voided_by: 7 })
    );
    expect(voided.voided_at).toEqual(expect.any(String));
    await expect(voidQueued(db, sale(1).client_ref, 'again', 7)).rejects.toThrow('already voided');
    await expect(voidQueued(db, sale(1).client_ref, '  ', 7)).rejects.toThrow('reason');
  });

  it('survives the catalogue being wiped for another user', async () => {
    db = await open(`q${Math.random().toString(36).slice(2)}`, getRxStorageMemory());
    await queueSale(db, { sale: sale(1), ...where });
    await applyCatalogue(db, {
      cursor: '2026-11-04T12:00:00Z',
      full: true,
      user: 7,
      company: 1,
      products: [],
      removed: [],
    });
    await clearCatalogue(db);
    expect(await listQueued(db, 3)).toHaveLength(1);
    expect((await nextOfflineNumber(db, where)).slice(-6)).toBe('000002');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { initRxDB } from '../../offlineDB';

let db;
afterEach(async () => {
  await db?.destroy();
  db = null;
});

const receipt = (overrides = {}) => ({
  id: 'r1',
  product: 1,
  batch_number: 'B-1',
  quantity: 5,
  expiration_date: '2027-01-01',
  synced: false,
  ...overrides,
});

describe('offlineDB', () => {
  it('creates the stockReceipts collection and stores records', async () => {
    db = await initRxDB({ name: `t${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
    expect(Object.keys(db.collections)).toEqual(['stockReceipts']);

    await db.stockReceipts.insert(receipt());
    const found = await db.stockReceipts.findOne('r1').exec();
    expect(found.batch_number).toBe('B-1');

    await found.patch({ synced: true });
    expect((await db.stockReceipts.findOne('r1').exec()).synced).toBe(true);
  });
});

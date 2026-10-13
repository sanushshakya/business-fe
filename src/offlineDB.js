import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

/**
 * @module src/offlineDB.js
 * Offline database (RxDB on IndexedDB via Dexie) holding records captured while offline.
 */

export const stockReceiptSchema = {
  title: 'stockReceipts',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    product: { type: 'number' },
    batch_number: { type: 'string' },
    quantity: { type: 'number', minimum: 1 },
    expiration_date: { type: 'string' },
    synced: { type: 'boolean' },
  },
  required: ['id', 'product', 'batch_number', 'quantity', 'expiration_date', 'synced'],
};

/**
 * Creates the database and its collections.
 *
 * @param {{name?: string, storage?: object}} [options] - `storage` defaults to Dexie/IndexedDB; tests pass the memory storage.
 * @returns {Promise<import('rxdb').RxDatabase>}
 */
export async function initRxDB({ name = 'iq_fe_db', storage = getRxStorageDexie() } = {}) {
  const db = await createRxDatabase({ name, storage, multiInstance: false });
  await db.addCollections({ stockReceipts: { schema: stockReceiptSchema } });
  return db;
}

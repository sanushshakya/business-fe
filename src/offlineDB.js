import { addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

addRxPlugin(RxDBMigrationPlugin);

/**
 * @module src/offlineDB.js
 * Offline database (RxDB on IndexedDB via Dexie) holding records captured while offline.
 */

/** The first schema (no location); kept so the v0 → v1 migration can be tested. */
export const stockReceiptSchemaV0 = {
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
    error: { type: 'string' },
  },
  required: ['id', 'product', 'batch_number', 'quantity', 'expiration_date', 'synced'],
};

/**
 * v1 (G13) adds `location`, where the stock is received. Receipts queued before it have none and are sent
 * without one (the backend then uses the company's only shop floor).
 */
export const stockReceiptSchema = {
  ...stockReceiptSchemaV0,
  version: 1,
  properties: { ...stockReceiptSchemaV0.properties, location: { type: 'number' } },
};

const stockReceiptMigrations = { 1: (doc) => doc };

/**
 * Creates the database and its collections.
 *
 * @param {{name?: string, storage?: object}} [options] - `storage` defaults to Dexie/IndexedDB; tests pass the memory storage.
 * @returns {Promise<import('rxdb').RxDatabase>}
 */
export async function initRxDB({ name = 'iq_fe_db', storage = getRxStorageDexie() } = {}) {
  const db = await createRxDatabase({ name, storage, multiInstance: false });
  await db.addCollections({
    stockReceipts: { schema: stockReceiptSchema, migrationStrategies: stockReceiptMigrations },
  });
  return db;
}

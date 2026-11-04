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
export const stockReceiptSchemaV1 = {
  ...stockReceiptSchemaV0,
  version: 1,
  properties: { ...stockReceiptSchemaV0.properties, location: { type: 'number' } },
};

/** v2 (G24) adds `supplier`, who the stock came from (optional; earlier receipts have none). */
export const stockReceiptSchema = {
  ...stockReceiptSchemaV1,
  version: 2,
  properties: { ...stockReceiptSchemaV1.properties, supplier: { type: 'number' } },
};

const stockReceiptMigrations = { 1: (doc) => doc, 2: (doc) => doc };

/**
 * The till catalogue (G26): one document per product, as the server sent it (`data`), so a new product field needs
 * no schema change.
 */
export const catalogueProductSchema = {
  title: 'catalogueProducts',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: { id: { type: 'string', maxLength: 20 }, data: { type: 'object' } },
  required: ['id', 'data'],
};

/** Catalogue bookkeeping by key: `catalogue` (cursor, owner, the small lists) and `session:<till id>`. */
export const catalogueMetaSchema = {
  title: 'catalogueMeta',
  version: 0,
  primaryKey: 'key',
  type: 'object',
  properties: { key: { type: 'string', maxLength: 40 }, value: { type: ['object', 'null'] } },
  required: ['key'],
};

/**
 * Offline sales (G27): one document per sale queued while the server could not be reached, id = its `client_ref`.
 * `data` is the sale as kept for sending and reprinting; kept apart from the catalogue, which a user switch wipes.
 */
export const offlineSaleSchema = {
  title: 'offlineSales',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    till: { type: 'number' },
    createdAt: { type: 'string' },
    status: { type: 'string' },
    data: { type: 'object' },
  },
  required: ['id', 'till', 'createdAt', 'status', 'data'],
};

/** Per till: the next offline receipt counter and this device's run letters (G27). Never reset. */
export const tillCounterSchema = {
  title: 'tillCounters',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: { id: { type: 'string', maxLength: 20 }, next: { type: 'number' }, run: { type: 'string' } },
  required: ['id', 'next', 'run'],
};

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
    catalogueProducts: { schema: catalogueProductSchema },
    catalogueMeta: { schema: catalogueMetaSchema },
    offlineSales: { schema: offlineSaleSchema },
    tillCounters: { schema: tillCounterSchema },
  });
  return db;
}

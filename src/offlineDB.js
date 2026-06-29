import { createRxDatabase } from 'rxdb';
import indexedDBAdapter from 'rxdb/plugins/indexeddb';

/**
 * @module src/offlineDB.js
 * @description Initialize RxDB using IndexedDB adapter for offline database support.
 */

// Configure RxDB with IndexedDB adapter
indexedDBAdapter.addIndexedDBPlugin();

/**
 * Creates an RxDB instance and initializes a sample collection for StockReceipts.
 *
 * @returns {Promise<RxDatabase>} A promise that resolves to the created RxDB instance with a StockReceipts collection.
 */
async function initRxDB() {
  try {
    // Create a new database instance using IndexedDB
    const db = await createRxDatabase({
      name: 'iq_fe_db', // Name of the database
      adapter: indexedDBAdapter, // Use IndexedDB as the storage adapter
      multiInstance: false, // Prevent multiple instances of the same database
    });

    // Initialize a sample collection for StockReceipts
    if (!db.stockReceipts) {
      await db.addCollections({
        stockReceipts: {
          schema: {
            title: 'stockReceipts',
            description: 'Stores stock receipt data',
            type: 'object',
            properties: {
              id: { type: 'string' },
              itemId: { type: 'string' },
              quantity: { type: 'number', minimum: 0 },
              date: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'itemId', 'quantity', 'date']
          }
        }
      });
    }

    return db;
  } catch (error) {
    console.error('Error initializing RxDB:', error);
    throw error;
  }
}

export { initRxDB };
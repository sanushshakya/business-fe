import { createRxDatabase } from 'rxdb';
import indexedDBAdapter from 'rxdb/plugins/indexeddb';

/**
 * @module src/offlineDB.js
 * @description Initialize RxDB using IndexedDB adapter for offline database support.
 */

// Configure RxDB with IndexedDB adapter
indexedDBAdapter.addIndexedDBPlugin();

/**
 * Creates an RxDB instance and initializes a sample collection.
 *
 * @returns {Promise<RxDatabase>} A promise that resolves to the created RxDB instance with a sample collection.
 */
async function initRxDB() {
  try {
    // Create a new database instance using IndexedDB
    const db = await createRxDatabase({
      name: 'iq_fe_db', // Name of the database
      adapter: indexedDBAdapter, // Use IndexedDB as the storage adapter
      multiInstance: false, // Prevent multiple instances of the same database
    });

    // Initialize a sample collection
    if (!db.inventory) {
      await db.addCollections({
        inventory: {
          schema: {
            title: 'inventory',
            description: 'Stores inventory data',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'number', minimum: 0 }
            },
            required: ['id', 'name', 'quantity']
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
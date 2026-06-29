import { createRxDatabase } from 'rxdb';
import indexedDBAdapter from 'rxdb/plugins/indexeddb';

/**
 * @module src/offlineDB.js
 * @description Initialize RxDB using IndexedDB adapter for offline database support.
 */

// Configure RxDB with IndexedDB adapter
indexedDBAdapter.addIndexedDBPlugin();

/**
 * Creates an RxDB instance.
 *
 * @returns {Promise<RxDatabase>} A promise that resolves to the created RxDB instance.
 */
async function initRxDB() {
  try {
    // Create a new database instance using IndexedDB
    const db = await createRxDatabase({
      name: 'iq_fe_db', // Name of the database
      adapter: indexedDBAdapter, // Use IndexedDB as the storage adapter
      multiInstance: false, // Prevent multiple instances of the same database
    });

    return db;
  } catch (error) {
    console.error('Error initializing RxDB:', error);
    throw error;
  }
}

export { initRxDB };
import { describe, it, expect } from 'vitest';
import RxDB from 'rxdb';

// Function to initialize RxDB with IndexedDB adapter
async function initRxDB() {
  try {
    const db = await RxDB.create({
      name: 'mydatabase',
      storage: require('rxdb/plugins/storage-indexeddb'),
      password: 'secretPassword', // Required for encryption
      multiInstance: false,
    });
    return db;
  } catch (error) {
    console.error('Failed to initialize RxDB:', error);
    throw error;
  }
}

// Test suite for RxDB initialization with IndexedDB
describe('RxDB Initialization with IndexedDB', () => {
  it('should successfully initialize the database', async () => {
    try {
      const db = await initRxDB();
      expect(db.name).toBe('mydatabase');
      expect(db.collections.length).toBeGreaterThan(0);
      console.log('Database initialized successfully:', db);
    } catch (error) {
      throw error;
    }
  });

  it('should handle initialization errors', async () => {
    try {
      // Intentionally provide an invalid storage adapter to trigger an error
      const db = await RxDB.create({
        name: 'mydatabase',
        storage: require('rxdb/plugins/storage-level'),
        password: 'secretPassword',
        multiInstance: false,
      });
      expect(db.name).toBe('mydatabase');
    } catch (error) {
      expect(error.message).toContain('Invalid storage adapter');
      console.error('Error caught during database initialization:', error);
    }
  });

  it('should clean up resources after tests', async () => {
    try {
      const db = await initRxDB();
      await db.destroy();
      console.log('Database destroyed successfully');
    } catch (error) {
      throw error;
    }
  });
});
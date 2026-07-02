/**
 * @module src/actions/syncActions.js
 * Actions related to syncing records in RxDB based on UUID confirmation.
 */

import { updateRecord } from '../offlineDB'; // Assuming offlineDB.js exports the updateRecord function

/**
 * Updates the synced field of a record in RxDB based on the provided UUID and new value.
 *
 * @param {string} uuid - The unique identifier of the record to be updated.
 * @param {boolean} syncedValue - The new value for the synced field (true or false).
 * @returns {Promise<void>} - A promise that resolves when the record has been updated.
 */
export async function updateSyncedField(uuid, syncedValue) {
  try {
    await updateRecord('yourCollectionName', uuid, { synced: syncedValue });
  } catch (error) {
    console.error('Error updating synced field:', error);
    throw error;
  }
}

/**
 * Sets the syncing state and updates the record count.
 *
 * @param {boolean} isSyncing - Indicates whether the sync operation is currently in progress.
 * @param {number} newRecordCount - The new count of records after the update.
 * @returns {Promise<void>} - A promise that resolves when the syncing state and record count have been updated.
 */
export async function setSyncingStateAndUpdateRecordCount(isSyncing, newRecordCount) {
  // Assuming there is a global state management solution to update these values
  // For example, using Zustand or React Context
  await updateSyncedField('syncingStatus', isSyncing);
  await updateSyncedField('recordCount', newRecordCount);
}
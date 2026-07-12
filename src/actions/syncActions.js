/**
 * @module src/actions/syncActions.js
 * Actions related to syncing records in RxDB based on UUID confirmation and fetching alerts data.
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

/**
 * Fetches the most recent demand, stock, and freight alerts.
 *
 * @returns {Promise<Object[]>} - A promise that resolves to an array of alert objects containing the most recent demand, stock, and freight alerts.
 */
export async function fetchRecentAlerts() {
  try {
    // Assuming there is an API endpoint to fetch alerts data
    const response = await fetch('/api/alerts/recent');
    if (!response.ok) {
      throw new Error('Failed to fetch alerts data');
    }
    const alertsData = await response.json();
    return alertsData;
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    throw error;
  }
}

/**
 * Handles the completion of onboarding and saves company profile details.
 *
 * @param {Object} companyProfile - The company profile details to be saved.
 * @returns {Promise<void>} - A promise that resolves when the company profile has been updated.
 */
export async function handleOnboardingCompletion(companyProfile) {
  try {
    await updateRecord('companyProfiles', companyProfile.uuid, companyProfile);
    console.log('Company profile updated successfully');
  } catch (error) {
    console.error('Error updating company profile:', error);
    throw error;
  }
}

/**
 * Updates the last_seen_at field for a Till model on every WebSocket connection.
 *
 * @param {string} tillId - The unique identifier of the Till to be updated.
 * @returns {Promise<void>} - A promise that resolves when the 'last_seen_at' field has been updated.
 */
export async function updateTillLastSeenAt(tillId) {
  try {
    const timestamp = new Date();
    await updateRecord('tills', tillId, { last_seen_at: timestamp });
  } catch (error) {
    console.error('Error updating Till last seen at:', error);
    throw error;
  }
}
/**
 * @module src/utils/mockNetworkStatus.js
 * Mocks network status to simulate no internet connection for testing purposes.
 */

export const mockNetworkStatus = () => {
  // Simulate the absence of an internet connection by returning false
  return Promise.reject(new Error('No internet connection available'));
};
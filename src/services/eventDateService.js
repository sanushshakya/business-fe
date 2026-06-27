/**
 * @module src/services/eventDateService.js
 * Service to handle API requests for event dates.
 */

import axios from '../utils/axios';

/**
 * Fetches event dates for the next 3 months.
 *
 * @async
 * @function fetchEventDates
 * @returns {Promise<Array>} - A promise that resolves to an array of event dates.
 */
export async function fetchEventDates() {
  try {
    const response = await axios.get('/api/demand/calendar/', {
      params: {
        months: 3,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch event dates:', error);
    throw error;
  }
}
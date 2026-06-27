/**
 * Utility functions for formatting date ranges for display.
 * @module utils/dateUtils
 */

/**
 * Formats a Gregorian date range into a human-readable string.
 *
 * @param {Date} startDate - The start date of the range.
 * @param {Date} endDate - The end date of the range.
 * @returns {string} A formatted date range string.
 */
export function formatDateRange(startDate, endDate) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}
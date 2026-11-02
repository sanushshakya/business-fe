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

/**
 * Today's date in the UK as `'YYYY-MM-DD'` (use-by dates and VAT follow the UK calendar day; `toISOString()` gives the
 * UTC day, which is still yesterday between midnight and 1am in summer).
 *
 * @param {Date} [now]
 * @returns {string}
 */
export function ukToday(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(now)
      .map(({ type, value }) => [type, value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

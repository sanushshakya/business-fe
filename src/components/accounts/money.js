import { toCents } from '../../utils/money';

/** £1,234.50, or −£10.00 for a negative amount (the server sends money as strings). */
export const money = (value) => {
  const cents = toCents(value);
  const pounds = (Math.abs(cents) / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${cents < 0 ? '−' : ''}£${pounds}`;
};

/** Whole pounds (VAT boxes 6–9): £1,234. */
export const pounds = (value) => `£${Number(value).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

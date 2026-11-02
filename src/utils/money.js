/**
 * Money is shown as pounds but added up in whole pence, so totals and change never pick up
 * floating-point noise (0.1 + 0.2). The server stays the authority on what a sale really costs.
 */
export const toCents = (value) => Math.round(Number(value) * 100);

export const formatMoney = (value) => `£${(toCents(value) / 100).toFixed(2)}`;

export const formatCents = (cents) => `£${(cents / 100).toFixed(2)}`;

/** Parses what a person typed into a till field ("5", "5.5", "£5.50"); null when it is not an amount. */
export const parseMoney = (text) => {
  const cleaned = String(text ?? '')
    .replace(/[£,\s]/g, '')
    .trim();
  if (!/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return null;
  return toCents(cleaned);
};

/** A price per kg (4 dp from the server) with at least 2 decimals and no trailing zeros beyond: `'8.9900'` → `£8.99`. */
export const formatPerKg = (value) => {
  const [whole, fraction = ''] = String(value).split('.');
  return `£${whole}.${fraction.replace(/0+$/, '').padEnd(2, '0')}/kg`;
};

/** `0.512 kg × £8.99/kg`: how a weighed line is shown on the basket and the receipt. */
export const weightTimesPrice = (weightKg, pricePerKg) => `${weightKg} kg × ${formatPerKg(pricePerKg)}`;

/**
 * Exact decimal text for barcode values, without floats: the digits on a label and where the point goes. The results
 * match Python's `str(Decimal(int(digits)).scaleb(-decimals))`, so the fixtures compare as strings on both sides.
 */

/** `scaled('00345', 2)` → `'3.45'`; `scaled('00000', 3)` → `'0.000'`; `scaled('000012', 0)` → `'12'`. */
export function scaled(digits, decimals) {
  const whole = digits.replace(/^0+/, '') || '0';
  if (decimals === 0) return whole;
  const padded = whole.padStart(decimals + 1, '0');
  return `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`;
}

/**
 * The same number with exactly `decimals` places: pads with zeros, and drops extra places that the caller has
 * checked are zeros (`'4.600'` → `'4.60'`).
 */
export function withDecimals(text, decimals) {
  const [whole, fraction = ''] = text.split('.');
  return decimals === 0 ? whole : `${whole}.${fraction.padEnd(decimals, '0').slice(0, decimals)}`;
}

/**
 * Kilograms as whole grams, so sums and differences are exact (the server works in 3-dp Decimals). Text in, text
 * out: `toGrams('1.25')` is 1250 and `formatGrams(1250)` is `'1.250'`.
 */
import { normaliseKg } from '../components/pos/WeightEntry';

/** Grams from kg text the API sent (`'1.250'`) or a person typed (`'1,25'`); null when it is not a weight above 0. */
export const toGrams = (text) => {
  const kg = normaliseKg(text);
  if (kg === null) return null;
  const [whole, fraction] = kg.split('.');
  return Number(whole) * 1000 + Number(fraction);
};

/** Grams as 3-dp kg text (`-350` → `'-0.350'`). */
export const formatGrams = (grams) => {
  const sign = grams < 0 ? '-' : '';
  const abs = Math.abs(grams);
  return `${sign}${Math.floor(abs / 1000)}.${String(abs % 1000).padStart(3, '0')}`;
};

/** `part` as a % of `whole`, 1 dp (`'3.5'`), or `'0.0'` when there is no whole. */
export const percentOf = (part, whole) => (whole ? ((part * 100) / whole).toFixed(1) : '0.0');

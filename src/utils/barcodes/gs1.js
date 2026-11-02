/**
 * GS1 element strings (DataBar Expanded, GS1-128, DataMatrix): application identifiers (AIs) followed by their values,
 * e.g. GTIN, net weight, price, use-by date and batch. A port of the backend's `inventory/gs1_parser.py` (G16); both
 * run `gs1_cases` in the shared `barcode_fixtures.json`, so keep them in step.
 *
 * Scanners send FNC1 as the GS character, which ends a variable-length field; the human-readable form `(01)…(17)…`
 * is read too. A variable-length field without its separator runs to the end of the string: we never look inside a
 * field for the next AI, so a field that overruns its maximum length is a `format` error (ask for a rescan).
 */
import { scaled, withDecimals } from './decimal';

export const GS = '\x1d';
const SYMBOLOGY_IDS = [']e0', ']C1', ']d2', ']Q3'];
// Only what scanners add around a code (the backend strips exactly these).
const EDGE_SPACE = /^[ \t\r\n]+|[ \t\r\n]+$/g;
const BRACKETED = /\(([0-9]{2,4})\)([^()]*)/g;
// GS1 character set 82 (GenSpecs 7.11), allowed in a batch number.
const CSET82 = new Set('!"%&\'()*+,-./0123456789:;<=>?ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz');

// AI -> [fixed length or null, maximum length, kind]. Each kind may appear once.
const AIS = new Map([
  ['01', [14, 14, 'gtin']],
  ['10', [null, 20, 'batch']],
  ['11', [6, 6, 'production_date']],
  ['13', [6, 6, 'packaging_date']],
  ['15', [6, 6, 'best_before']],
  ['17', [6, 6, 'expiry']],
  ...[0, 1, 2, 3, 4, 5].map((n) => [`310${n}`, [6, 6, 'weight_kg']]),
  ...[0, 1, 2, 3].map((n) => [`392${n}`, [null, 15, 'price']]),
]);

/** `reason`: `format`, `unknown_ai`, `check_digit` (GTIN), `date` or `value` (fractional pence). */
export class GS1Error extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'GS1Error';
    this.reason = reason;
  }
}

/** GS1 mod-10 check digit for the data digits of a GTIN (weights 3, 1, 3, … from the right). */
export function gtinCheckDigit(digits) {
  const total = [...digits].reverse().reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 1 : 3), 0);
  return (10 - (total % 10)) % 10;
}

/**
 * Read a scanned element string. `today` (`'YYYY-MM-DD'`) decides the century and `expired`. Returns
 * `{gtin, batch, weightKg, price, expiry, bestBefore, expired, elements}`: decimal and ISO-date strings or null;
 * throws `GS1Error`.
 */
export function parseGs1(rawCode, today) {
  let code = String(rawCode).replace(EDGE_SPACE, '');
  const identifier = SYMBOLOGY_IDS.find((id) => code.startsWith(id));
  if (identifier) code = code.slice(identifier.length);
  if (code.startsWith(GS)) code = code.slice(1); // FNC1 in first position
  if (!code) throw new GS1Error('format');
  const pairs = code.startsWith('(') ? bracketed(code) : plain(code);
  const elements = {};
  const values = {};
  for (const [ai, raw] of pairs) {
    const [fixed, maximum, kind] = AIS.get(ai);
    if (kind in values || !raw || raw.length > maximum || (fixed && raw.length !== fixed)) {
      throw new GS1Error('format');
    }
    elements[ai] = raw;
    values[kind] = value(ai, kind, raw, today);
  }
  const expiry = values.expiry ?? null;
  return {
    gtin: values.gtin ?? null,
    batch: values.batch ?? null,
    weightKg: values.weight_kg ?? null,
    price: values.price ?? null,
    expiry,
    bestBefore: values.best_before ?? null,
    expired: expiry !== null && expiry < today,
    elements,
  };
}

function bracketed(code) {
  if (code.includes(GS)) throw new GS1Error('format');
  const pairs = [];
  let end = 0;
  for (const match of code.matchAll(BRACKETED)) {
    if (match.index !== end) break;
    if (!AIS.has(match[1])) throw new GS1Error('unknown_ai');
    pairs.push([match[1], match[2]]);
    end = match.index + match[0].length;
  }
  if (end !== code.length) throw new GS1Error('format');
  return pairs;
}

function plain(code) {
  const pairs = [];
  let index = 0;
  while (index < code.length) {
    const ai = readAi(code, index);
    index += ai.length;
    const fixed = AIS.get(ai)[0];
    let end;
    let following;
    if (fixed) {
      end = index + fixed;
      if (end > code.length) throw new GS1Error('format');
      following = code[end] === GS ? end + 1 : end; // a separator after a fixed field is tolerated
    } else {
      end = code.indexOf(GS, index);
      if (end < 0) [end, following] = [code.length, code.length];
      else following = end + 1;
    }
    pairs.push([ai, code.slice(index, end)]);
    index = following;
  }
  return pairs;
}

function readAi(code, index) {
  if (!/^[0-9]{2}$/.test(code.slice(index, index + 2))) throw new GS1Error('format');
  for (const length of [2, 4]) {
    const ai = code.slice(index, index + length);
    if (AIS.has(ai)) return ai;
  }
  throw new GS1Error('unknown_ai');
}

function value(ai, kind, raw, today) {
  if (kind === 'batch') {
    if (![...raw].every((char) => CSET82.has(char))) throw new GS1Error('format');
    return raw;
  }
  if (!/^[0-9]+$/.test(raw)) throw new GS1Error('format');
  if (kind === 'gtin') {
    if (gtinCheckDigit(raw.slice(0, 13)) !== Number(raw[13])) throw new GS1Error('check_digit');
    return raw;
  }
  const decimals = Number(ai[3]);
  if (kind === 'weight_kg') {
    const weight = scaled(raw, decimals);
    return decimals < 3 ? withDecimals(weight, 3) : weight;
  }
  if (kind === 'price') {
    const price = scaled(raw, decimals);
    if (/[1-9]/.test((price.split('.')[1] ?? '').slice(2))) throw new GS1Error('value');
    return withDecimals(price, 2);
  }
  return isoDate(raw, today);
}

/** `YYMMDD`; day 00 is the month's last day; the century follows GS1 GenSpecs 7.12. */
function isoDate(raw, today) {
  const [year, month, day] = [raw.slice(0, 2), raw.slice(2, 4), raw.slice(4)].map(Number);
  const todayYear = Number(today.slice(0, 4));
  const ahead = year - (todayYear % 100);
  const fullYear = Math.floor(todayYear / 100) * 100 + (ahead >= 51 ? -100 : ahead <= -50 ? 100 : 0) + year;
  if (month < 1 || month > 12) throw new GS1Error('date');
  const lastDay = new Date(Date.UTC(fullYear, month, 0)).getUTCDate();
  const actualDay = day === 0 ? lastDay : day;
  if (actualDay > lastDay) throw new GS1Error('date');
  const pad = (number, width) => String(number).padStart(width, '0');
  return `${pad(fullYear, 4)}-${pad(month, 2)}-${pad(actualDay, 2)}`;
}

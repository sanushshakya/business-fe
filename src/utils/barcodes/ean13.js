/**
 * UK variable-measure EAN-13 (scale labels): a code starting with `2` carries an item code and a price or a weight.
 * A port of the backend's `inventory/barcode_parser.py` (G15); both run the shared `barcode_fixtures.json`, so keep
 * them in step. Layout: `prefix | item code | [value check digit] | value | EAN-13 check digit`.
 */
import { scaled } from './decimal';

export const PRICE = 'price';
export const WEIGHT = 'weight';

// GS1 weighted products per digit (General Specifications 7.9.3): "2-", "3", "5+" and "5-".
const TWO_MINUS = [0, 2, 4, 6, 8, 9, 1, 3, 5, 7];
const THREE = [0, 3, 6, 9, 2, 5, 8, 1, 4, 7];
const FIVE_PLUS = [0, 5, 1, 6, 2, 7, 3, 8, 4, 9];
const FIVE_MINUS = [0, 5, 9, 4, 8, 3, 7, 2, 6, 1];

// Python's str.strip() whitespace, which the backend parser uses (String.prototype.trim() differs: it keeps
// \x1c-\x1f and \x85 and strips \ufeff).
const PY_SPACE = '[\\t\\n\\v\\f\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]';
const PY_STRIP = new RegExp(`^${PY_SPACE}+|${PY_SPACE}+$`, 'g');

/** `reason`: `format`, `check_digit`, `unknown_prefix` (an ordinary barcode) or `value_check_digit`. */
export class BarcodeError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'BarcodeError';
    this.reason = reason;
  }
}

/** A rule from `/inventory/barcode-rules/` (or the fixtures), in the shape the parser uses. */
export function ruleFromApi(row) {
  return {
    prefix: String(row.prefix),
    itemCodeLength: Number(row.item_code_length),
    valueType: row.value_type,
    decimals: Number(row.decimals),
    valueCheckDigit: Boolean(row.value_check_digit),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

export const valueLength = (rule) => 12 - rule.prefix.length - rule.itemCodeLength - (rule.valueCheckDigit ? 1 : 0);

/** Why this layout can't describe a 13-digit code (`"<field>: message"`), or null. */
export function layoutError(rule) {
  if (!/^2[0-9]{0,2}$/.test(rule.prefix)) return 'prefix: 1 to 3 digits starting with 2 (the in-store range).';
  if (rule.itemCodeLength < 1) return 'item_code_length: at least 1 digit.';
  const length = valueLength(rule);
  if (length < 4 || length > 6) {
    return `item_code_length: the value would be ${length} digits; a 13-digit code leaves room for 4 to 6.`;
  }
  if (rule.valueCheckDigit && length !== 4 && length !== 5) {
    return `value_check_digit: GS1 defines it for 4- or 5-digit values, not ${length}.`;
  }
  if (rule.valueType !== PRICE && rule.valueType !== WEIGHT) return 'value_type: price or weight.';
  if (!(rule.decimals >= 0 && rule.decimals <= 3)) return 'decimals: 0 to 3.';
  return null;
}

export function ean13CheckDigit(first12) {
  const total = [...first12].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0);
  return (10 - (total % 10)) % 10;
}

/** GS1 price/weight verifier digit for a 4- or 5-digit value. */
export function valueCheckDigit(digits) {
  const d = [...digits].map(Number);
  if (d.length === 4) return ((TWO_MINUS[d[0]] + TWO_MINUS[d[1]] + THREE[d[2]] + FIVE_MINUS[d[3]]) * 3) % 10;
  if (d.length === 5) {
    const total = FIVE_PLUS[d[0]] + TWO_MINUS[d[1]] + FIVE_MINUS[d[2]] + FIVE_PLUS[d[3]] + TWO_MINUS[d[4]];
    return FIVE_MINUS.indexOf((10 - (total % 10)) % 10);
  }
  throw new Error('A value check digit covers 4 or 5 digits.');
}

/**
 * Read a scanned code with the longest-prefix active, well-formed rule. Returns
 * `{rule, itemCode, value, price, weightKg}` (decimal strings, or null); throws `BarcodeError`.
 */
export function parseScaleLabel(rawCode, rules) {
  const code = String(rawCode).replace(PY_STRIP, '');
  if (!/^[0-9]{13}$/.test(code)) throw new BarcodeError('format');
  if (ean13CheckDigit(code.slice(0, 12)) !== Number(code[12])) throw new BarcodeError('check_digit');
  const matches = rules.filter((rule) => rule.isActive && layoutError(rule) === null && code.startsWith(rule.prefix));
  if (!matches.length) throw new BarcodeError('unknown_prefix');
  const rule = matches.reduce((best, rule) => (rule.prefix.length > best.prefix.length ? rule : best));
  let start = rule.prefix.length + rule.itemCodeLength;
  const itemCode = code.slice(rule.prefix.length, start);
  let check = null;
  if (rule.valueCheckDigit) {
    check = Number(code[start]);
    start += 1;
  }
  const digits = code.slice(start, 12);
  if (rule.valueCheckDigit && valueCheckDigit(digits) !== check) throw new BarcodeError('value_check_digit');
  const value = scaled(digits, rule.decimals);
  return {
    rule,
    itemCode,
    value,
    price: rule.valueType === PRICE ? value : null,
    weightKg: rule.valueType === WEIGHT ? value : null,
  };
}

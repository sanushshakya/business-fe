/**
 * What a scan at the till is (G18): an ordinary product barcode, a scale or GS1 label for one of the company's
 * products, or something the cashier is told about. The till uses this only to show the line; the server reads the
 * same raw code again on Charge (`sales/labels.py`) and its price is the one charged. Messages mirror the server's.
 */
import { divideHalfUp, scaled, toUnits } from './decimal';
import { BarcodeError, parseScaleLabel } from './ean13';
import { GS1Error, parseGs1 } from './gs1';

const GS1_PROBLEMS = {
  format: 'damaged or incomplete',
  unknown_ai: 'a field we do not read',
  check_digit: 'check digit',
  date: 'impossible date',
  value: 'price in fractions of a penny',
};

class ScanProblem extends Error {}
const refuse = (message) => {
  throw new ScanProblem(message);
};

const trimmed = (text) => (text || '').trim();
const isWeighed = (product) => product.sold_by === 'weight';

/** The forms a GTIN-14 may be stored in as a pack barcode: itself, and the GTIN-13, UPC-12 or EAN-8 it pads. */
export const gtinForms = (gtin) => [
  gtin,
  ...[1, 2, 6].filter((zeros) => gtin.startsWith('0'.repeat(zeros))).map((zeros) => gtin.slice(zeros)),
];

function scaleLabel(code, rules, products) {
  let parsed;
  try {
    parsed = parseScaleLabel(code, rules);
  } catch (error) {
    if (!(error instanceof BarcodeError)) throw error;
    if (error.reason === 'unknown_prefix') refuse('Not a price or weight label. Ring it up as a product.');
    refuse('The label did not read correctly (check digit). Scan it again or ring it up.');
  }
  const plu = parsed.itemCode.replace(/^0+/, '');
  const product = plu && products.find((p) => p.plu === plu);
  if (!product) refuse(`No product has PLU ${plu || parsed.itemCode}. Set it on the product in Inventory.`);
  return { product, weightKg: parsed.weightKg, labelPrice: parsed.price };
}

function gs1Label(code, products, today) {
  let parsed;
  try {
    parsed = parseGs1(code, today);
  } catch (error) {
    if (!(error instanceof GS1Error)) throw error;
    refuse(`The label did not read correctly (${GS1_PROBLEMS[error.reason]}). Scan it again or ring it up.`);
  }
  if (parsed.expired) {
    const [year, month, day] = parsed.expiry.split('-');
    refuse(`Use-by date ${day}/${month}/${year} has passed. Do not sell this.`);
  }
  if (!parsed.gtin) refuse('This label has no product number (GTIN). Ring it up as a product.');
  const forms = gtinForms(parsed.gtin);
  const matches = products.filter((p) => forms.includes(trimmed(p.barcode)));
  if (!matches.length) refuse(`No product has GTIN ${parsed.gtin}. Set its barcode in Inventory.`);
  if (matches.length > 1) refuse(`Several products share GTIN ${parsed.gtin}. Fix their barcodes in Inventory.`);
  return { product: matches[0], weightKg: parsed.weightKg, labelPrice: parsed.price };
}

function priced({ product, weightKg, labelPrice }) {
  if (!isWeighed(product)) {
    if (weightKg !== null)
      refuse(`${product.name} is sold by each, but this is a weight label. Ring it up as a product.`);
    return { weightKg: null, labelPrice, cents: toUnits(labelPrice ?? product.price, 2) };
  }
  if (weightKg === null && labelPrice === null) {
    refuse(`${product.name} is sold by weight, but this label has no weight or price. Weigh it.`);
  }
  const perKg = toUnits(product.price_per_kg || '0', 4); // £/kg in 1/10000 £
  let grams;
  if (weightKg === null) {
    if (!perKg) refuse(`${product.name}: no price per kg is set. Ask an admin.`);
    if (!toUnits(labelPrice, 2)) refuse(`${product.name}: the label price is £0.00. Weigh it instead.`);
    grams = divideHalfUp(toUnits(labelPrice, 2) * 100000, perKg); // kg = price ÷ £/kg, to the gram
  } else {
    const decimals = (weightKg.split('.')[1] ?? '').length;
    grams = decimals > 3 ? divideHalfUp(toUnits(weightKg, decimals), 10 ** (decimals - 3)) : toUnits(weightKg, 3);
  }
  const kg = scaled(String(grams), 3);
  if (grams < 1 || grams > 100000) {
    refuse(`${product.name}: the label weight ${kg} kg is not between 0.001 and 100 kg. Weigh it instead.`);
  }
  // The label's price is charged; otherwise weight × £/kg, half-up to the penny.
  const cents = labelPrice !== null ? toUnits(labelPrice, 2) : divideHalfUp(grams * perKg, 100000);
  return { weightKg: kg, labelPrice, cents };
}

/**
 * Read a scanned `code` against the company's `rules` and `products` on the UK date `today` (`'YYYY-MM-DD'`):
 * `{kind: 'product', product}`, `{kind: 'label', product, barcode, weightKg, labelPrice, cents}` or
 * `{kind: 'error', message}`.
 */
export function readScan(code, { rules, products, today }) {
  const stripped = trimmed(code);
  const product = stripped && products.find((p) => trimmed(p.barcode) === stripped);
  if (product) return { kind: 'product', product };
  try {
    const found = /^[0-9]{13}$/.test(stripped)
      ? scaleLabel(stripped, rules, products)
      : gs1Label(code, products, today);
    return { kind: 'label', product: found.product, barcode: code, ...priced(found) };
  } catch (error) {
    if (error instanceof ScanProblem) return { kind: 'error', message: error.message };
    throw error;
  }
}

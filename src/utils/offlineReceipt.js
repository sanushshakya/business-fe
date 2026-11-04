// src/utils/offlineReceipt.js

/**
 * The receipt of a sale made offline (G27): the basket priced from the till's cached catalogue, with VAT worked out
 * like the server's `vat.services.split_inclusive` — in whole pence, half-up, per line, then summed by rate. It is
 * what the customer is given; the server prices the sale again when it is sent (G28) and records any difference.
 */
import { divideHalfUp, toUnits } from './barcodes/decimal';

const pounds = (cents) => {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
};

/** VAT inside `grossCents` at `rateText` % ('20.00'): gross × rate ÷ (100 + rate), half-up to the penny. */
export const vatOfLine = (grossCents, rateText) => {
  const rate = toUnits(rateText, 2); // hundredths of a percent: 20.00% → 2000
  return divideHalfUp(grossCents * rate, 10000 + rate);
};

/** The rate (text) in force for `code` on the UK date `day` ('YYYY-MM-DD'), or null when none is cached. */
export const rateFor = (vatRates, code, day) =>
  (vatRates ?? [])
    .filter((row) => row.code === code && row.valid_from <= day)
    .sort((a, b) => b.valid_from.localeCompare(a.valid_from))[0]?.rate ?? null;

const itemFor = (line, product, rate, index) => {
  const lineCents = line.unitCents * line.quantity;
  const weighed = line.weightKg !== undefined && line.weightKg !== null;
  return {
    id: `offline-${index + 1}`,
    product: line.product,
    product_name: line.name,
    quantity: line.pieces ?? line.quantity,
    unit_price:
      line.labelPrice ?? (weighed ? pounds(divideHalfUp(toUnits(line.pricePerKg, 4), 100)) : pounds(line.unitCents)),
    weight_kg: weighed ? line.weightKg : null,
    price_per_kg: weighed ? (line.pricePerKg ?? null) : null,
    label_price: line.labelPrice ?? null,
    line_total: pounds(lineCents),
    vat_code: product?.vat_code ?? '',
    vat_rate: rate,
    vat_amount: rate === null ? null : pounds(vatOfLine(lineCents, rate)),
    lineCents,
  };
};

/**
 * A sale-shaped object for `Receipt` (and to keep with the queued sale). `payment` is
 * `{payment_method, amount_tendered?, card_auth_code?}`.
 */
export function offlineReceipt({
  lines,
  products,
  vatRates,
  payment,
  number,
  createdAt,
  ukDate,
  branchName = '',
  tillNumber = null,
  cashierName = '',
}) {
  const byId = Object.fromEntries((products ?? []).map((product) => [product.id, product]));
  const built = lines.map((line, index) => {
    const product = byId[line.product];
    return itemFor(line, product, product ? rateFor(vatRates, product.vat_code, ukDate) : null, index);
  });
  const totalCents = built.reduce((sum, item) => sum + item.lineCents, 0);
  const groups = new Map();
  for (const item of built.filter((row) => row.vat_rate !== null)) {
    const key = `${item.vat_code}|${item.vat_rate}`;
    const group = groups.get(key) ?? { vat_code: item.vat_code, rate: item.vat_rate, gross: 0, vat: 0 };
    group.gross += item.lineCents;
    group.vat += vatOfLine(item.lineCents, item.vat_rate);
    groups.set(key, group);
  }
  const cash = payment.payment_method === 'cash';
  const tendered = cash ? toUnits(payment.amount_tendered ?? '0', 2) : totalCents; // exact, never a float
  return {
    offline: true,
    receipt_number: number,
    created_at: createdAt,
    branch_name: branchName,
    till_number: tillNumber,
    cashier_name: cashierName,
    status: 'completed',
    payment_method: payment.payment_method,
    card_auth_code: payment.card_auth_code ?? null,
    total: pounds(totalCents),
    amount_tendered: pounds(tendered),
    change_due: pounds(cash ? tendered - totalCents : 0),
    items: built.map(({ lineCents, ...item }) => item),
    vat_summary: [...groups.values()]
      .sort((a, b) => a.vat_code.localeCompare(b.vat_code))
      .map((group) => ({
        vat_code: group.vat_code,
        rate: group.rate,
        net: pounds(group.gross - group.vat),
        vat: pounds(group.vat),
        gross: pounds(group.gross),
      })),
    vat_recorded: built.every((item) => item.vat_rate !== null),
  };
}

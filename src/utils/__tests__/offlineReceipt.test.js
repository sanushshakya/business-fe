import { describe, expect, it } from 'vitest';
import { offlineReceipt, rateFor, vatOfLine } from '../offlineReceipt';

const RATES = [
  { code: 'zero', rate: '0.00', valid_from: '1973-04-01' },
  { code: 'standard', rate: '17.50', valid_from: '2008-01-01' },
  { code: 'standard', rate: '20.00', valid_from: '2011-01-04' },
  { code: 'reduced', rate: '5.00', valid_from: '1997-09-01' },
];
const PRODUCTS = [
  { id: 1, name: 'Fake Rice', vat_code: 'zero' },
  { id: 2, name: 'Fake Cola', vat_code: 'standard' },
  { id: 3, name: 'Fake Mince', vat_code: 'zero' },
];
const lines = [
  { product: 1, name: 'Fake Rice', unitCents: 250, quantity: 2, max: 9 },
  { product: 2, name: 'Fake Cola', unitCents: 105, quantity: 1, max: 9 },
  {
    key: 'weight-1',
    product: 3,
    name: 'Fake Mince',
    weightKg: '0.512',
    pricePerKg: '8.9900',
    labelPrice: null,
    manual: true,
    unitCents: 460,
    quantity: 1,
    max: 1,
  },
  {
    key: 'label-1',
    product: 3,
    name: 'Fake Mince',
    barcode: '2100421005129',
    weightKg: '0.500',
    pricePerKg: '8.9900',
    labelPrice: '4.50',
    unitCents: 450,
    quantity: 1,
    max: 1,
  },
];
const receipt = (payment = { payment_method: 'cash', amount_tendered: '20.00' }) =>
  offlineReceipt({
    lines,
    products: PRODUCTS,
    vatRates: RATES,
    payment,
    number: 'HS-T02-QK-000001',
    createdAt: '2026-11-04T12:00:00.000Z',
    ukDate: '2026-11-04',
    branchName: 'Fake High Street',
    tillNumber: 2,
  });

describe("vatOfLine (the server's split_inclusive, in whole pence)", () => {
  it('matches split_inclusive on half pennies', () => {
    expect(vatOfLine(105, '20.00')).toBe(18); // 17.5p → 18p
    expect(vatOfLine(3, '20.00')).toBe(1); // 0.5p → 1p
    expect(vatOfLine(210, '5.00')).toBe(10);
    expect(vatOfLine(999, '17.50')).toBe(149); // 148.78...
    expect(vatOfLine(250, '0.00')).toBe(0);
  });
});

describe('rateFor', () => {
  it('takes the rate in force on the day', () => {
    expect(rateFor(RATES, 'standard', '2010-06-01')).toBe('17.50');
    expect(rateFor(RATES, 'standard', '2026-11-04')).toBe('20.00');
    expect(rateFor(RATES, 'exempt', '2026-11-04')).toBeNull();
  });
});

describe('offlineReceipt', () => {
  it('prices each line, totals, and sums VAT by rate from rounded lines (a mixed zero/standard basket)', () => {
    const sale = receipt();
    expect(sale.offline).toBe(true);
    expect(sale.receipt_number).toBe('HS-T02-QK-000001');
    expect(sale.total).toBe('15.15'); // 5.00 + 1.05 + 4.60 + 4.50
    expect(sale.items.map((i) => [i.product_name, i.quantity, i.line_total, i.vat_code])).toEqual([
      ['Fake Rice', 2, '5.00', 'zero'],
      ['Fake Cola', 1, '1.05', 'standard'],
      ['Fake Mince', 1, '4.60', 'zero'],
      ['Fake Mince', 1, '4.50', 'zero'],
    ]);
    expect(sale.vat_summary).toEqual([
      // lowest rate first, as the server's vat_by_rate
      { vat_code: 'zero', rate: '0.00', net: '14.10', vat: '0.00', gross: '14.10' },
      { vat_code: 'standard', rate: '20.00', net: '0.87', vat: '0.18', gross: '1.05' },
    ]);
    expect(sale.vat_recorded).toBe(true);
  });

  it('shows weighed and label lines as kg × £/kg and the label price', () => {
    const [, , typed, label] = receipt().items;
    expect([typed.weight_kg, typed.price_per_kg, typed.label_price]).toEqual(['0.512', '8.9900', null]);
    expect([label.weight_kg, label.label_price, label.unit_price]).toEqual(['0.500', '4.50', '4.50']);
  });

  it('works out cash change, and no change for card', () => {
    expect([receipt().amount_tendered, receipt().change_due]).toEqual(['20.00', '4.85']);
    const card = receipt({ payment_method: 'card', card_auth_code: 'A1B2C3' });
    expect([card.amount_tendered, card.change_due, card.card_auth_code]).toEqual(['15.15', '0.00', 'A1B2C3']);
  });

  it('says VAT was not recorded for a line whose code has no rate cached', () => {
    const sale = offlineReceipt({
      lines: [{ product: 9, name: 'Fake Odd', unitCents: 100, quantity: 1, max: 1 }],
      products: [{ id: 9, name: 'Fake Odd', vat_code: 'exempt' }],
      vatRates: RATES,
      payment: { payment_method: 'card' },
      number: 'B1-T01-AA-000001',
      createdAt: '2026-11-04T12:00:00.000Z',
      ukDate: '2026-11-04',
    });
    expect([sale.vat_recorded, sale.vat_summary]).toEqual([false, []]);
  });
});

import { describe, expect, it } from 'vitest';
import { ean13CheckDigit, ruleFromApi, valueCheckDigit } from '../ean13';
import { GS, gtinCheckDigit } from '../gs1';
import { readScan } from '../scan';

const RULES = [
  { prefix: '20', item_code_length: 5, value_type: 'price', decimals: 2, value_check_digit: false },
  { prefix: '21', item_code_length: 4, value_type: 'weight', decimals: 3, value_check_digit: true },
].map(ruleFromApi);
const scale = (prefix, item, value, check = false) => {
  const body = prefix + item + (check ? String(valueCheckDigit(value)) : '') + value;
  return body + ean13CheckDigit(body);
};
const gtin = (first13) => first13 + gtinCheckDigit(first13);
const MINCE_GTIN = gtin('0501234567890');
const PRODUCTS = [
  {
    id: 4,
    name: 'Mince',
    price: '0.00',
    sold_by: 'weight',
    price_per_kg: '8.9900',
    plu: '42',
    barcode: MINCE_GTIN.slice(1),
  },
  { id: 7, name: 'Cake', price: '2.00', sold_by: 'each', plu: '77', barcode: '4006381333931' },
];
const read = (code) => readScan(code, { rules: RULES, products: PRODUCTS, today: '2026-11-02' });

describe('readScan', () => {
  it('reads a weight label and prices it weight × £/kg, half-up', () => {
    // 0.512 × 8.99 = 4.60288 -> 4.60
    expect(read(scale('21', '0042', '00512', true))).toMatchObject({
      kind: 'label',
      product: PRODUCTS[0],
      weightKg: '0.512',
      labelPrice: null,
      cents: 460,
    });
  });

  it('reads a price label for an each product (PLU without leading zeros)', () => {
    expect(read(scale('20', '00077', '00150'))).toMatchObject({
      kind: 'label',
      product: PRODUCTS[1],
      weightKg: null,
      labelPrice: '1.50',
      cents: 150,
    });
  });

  it('works out the kg of a price-only label for a weighed product', () => {
    expect(read(scale('20', '00042', '00460'))).toMatchObject({ weightKg: '0.512', labelPrice: '4.60', cents: 460 });
  });

  it('reads a GS1 label with weight and price', () => {
    const code = `01${MINCE_GTIN}3103000512` + `10LOT1${GS}392200460`;
    expect(read(code)).toMatchObject({
      kind: 'label',
      product: PRODUCTS[0],
      weightKg: '0.512',
      labelPrice: '4.60',
      cents: 460,
    });
  });

  it('adds an ordinary product barcode as the product', () => {
    expect(read('4006381333931\n')).toEqual({ kind: 'product', product: PRODUCTS[1] });
  });

  it('refuses a label price in fractions of a penny, like the server', () => {
    const rules = [
      ...RULES,
      ruleFromApi({ prefix: '22', item_code_length: 5, value_type: 'price', decimals: 3, value_check_digit: false }),
    ];
    const at = (value) => readScan(scale('22', '00077', value), { rules, products: PRODUCTS, today: '2026-11-02' });
    expect(at('01234')).toMatchObject({ kind: 'error', message: expect.stringMatching(/fractions of a penny/) });
    expect(at('01230')).toMatchObject({ kind: 'label', labelPrice: '1.23', cents: 123 });
  });

  it('says why a scan cannot be used', () => {
    const good = scale('21', '0042', '00512', true);
    const tampered = good.slice(0, 9) + ((Number(good[9]) + 1) % 10) + good.slice(10); // a changed weight digit
    expect(read(tampered)).toMatchObject({
      kind: 'error',
      message: expect.stringMatching(/did not read correctly/),
    });
    expect(read(scale('20', '00099', '00150'))).toMatchObject({
      kind: 'error',
      message: expect.stringMatching(/PLU 99/),
    });
    expect(read('5000000000005')).toMatchObject({
      kind: 'error',
      message: expect.stringMatching(/Not a price or weight label/),
    });
    expect(read(`01${MINCE_GTIN}17261101`)).toMatchObject({ kind: 'error', message: expect.stringMatching(/Use-by/) });
    expect(read(scale('21', '0077', '00512', true))).toMatchObject({
      kind: 'error',
      message: expect.stringMatching(/sold by each/),
    });
  });
});

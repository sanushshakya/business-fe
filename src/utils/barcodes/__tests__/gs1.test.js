import { describe, expect, it } from 'vitest';
import FIXTURES from '../barcode_fixtures.json';
import { GS1Error, gtinCheckDigit, parseGs1 } from '../gs1';

const reasonOf = (fn) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(GS1Error);
    return error.reason;
  }
  throw new Error('expected a GS1Error');
};

describe('GS1 element-string parser (shared fixtures)', () => {
  it.each(FIXTURES.gs1_cases.map((c) => [c.name, c]))('%s', (_name, c) => {
    if (c.error) {
      expect(reasonOf(() => parseGs1(c.code, c.today))).toBe(c.error);
      return;
    }
    const parsed = parseGs1(c.code, c.today);
    expect({
      gtin: parsed.gtin,
      batch: parsed.batch,
      weight_kg: parsed.weightKg,
      price: parsed.price,
      expiry: parsed.expiry,
      best_before: parsed.bestBefore,
      expired: parsed.expired,
      elements: parsed.elements,
    }).toEqual(c.result);
  });

  it.each(FIXTURES.gs1_check_digits.map((c) => [c.digits, c]))('GTIN check digit %s', (_digits, c) => {
    expect(gtinCheckDigit(c.digits)).toBe(c.check);
  });
});

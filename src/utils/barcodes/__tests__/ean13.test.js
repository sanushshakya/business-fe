import { describe, expect, it } from 'vitest';
import FIXTURES from '../barcode_fixtures.json';
import { scaled, withDecimals } from '../decimal';
import { BarcodeError, ean13CheckDigit, layoutError, parseScaleLabel, ruleFromApi, valueCheckDigit } from '../ean13';

const RULES = FIXTURES.rules.map(ruleFromApi);

const reasonOf = (fn) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(BarcodeError);
    return error.reason;
  }
  throw new Error('expected a BarcodeError');
};

describe('scale-label parser (shared fixtures)', () => {
  it.each(FIXTURES.cases.map((c) => [c.name, c]))('%s', (_name, c) => {
    if (c.error) {
      expect(reasonOf(() => parseScaleLabel(c.code, RULES))).toBe(c.error);
      return;
    }
    const parsed = parseScaleLabel(c.code, RULES);
    expect({
      prefix: parsed.rule.prefix,
      item_code: parsed.itemCode,
      value: parsed.value,
      price: parsed.price,
      weight_kg: parsed.weightKg,
    }).toEqual(c.result);
  });

  it.each(FIXTURES.check_digits.map((c) => [c.digits, c]))('check digit %s', (_digits, c) => {
    const calculate = c.kind === 'ean13' ? ean13CheckDigit : valueCheckDigit;
    expect(calculate(c.digits)).toBe(c.check);
  });

  it.each(FIXTURES.layouts.map((c) => [c.name, c]))('layout %s', (_name, c) => {
    const error = layoutError(ruleFromApi(c.rule));
    expect(error === null ? null : error.split(':')[0]).toBe(c.error);
  });

  it('value check digit needs 4 or 5 digits', () => {
    expect(() => valueCheckDigit('123')).toThrow();
  });

  const codeOf = (name) => FIXTURES.cases.find((c) => c.name === name).code;

  it('an unusable rule never matches', () => {
    const broken = ruleFromApi({ ...FIXTURES.rules[0], item_code_length: 9 });
    expect(reasonOf(() => parseScaleLabel(codeOf('price'), [broken]))).toBe('unknown_prefix');
  });

  it('rule order does not matter', () => {
    expect(parseScaleLabel(codeOf('overlap_specific_wins'), [...RULES].reverse()).rule.prefix).toBe('21');
  });

  it('a rule with missing or non-integer lengths is unusable, never read as NaN', () => {
    for (const change of [{ item_code_length: undefined }, { item_code_length: 4.5 }, { decimals: 'two' }]) {
      const rule = ruleFromApi({ ...FIXTURES.rules[0], ...change });
      expect(layoutError(rule)).not.toBeNull();
      expect(reasonOf(() => parseScaleLabel(codeOf('price'), [rule]))).toBe('unknown_prefix');
    }
  });

  it('reads API rows (snake_case, is_active defaulting to true)', () => {
    const row = { ...FIXTURES.rules[0] };
    delete row.is_active;
    expect(ruleFromApi(row)).toEqual({
      prefix: '20',
      itemCodeLength: 5,
      valueType: 'price',
      decimals: 2,
      valueCheckDigit: false,
      isActive: true,
    });
  });
});

describe('decimal strings', () => {
  it('shifts the point like Python Decimal.scaleb', () => {
    expect(scaled('00345', 2)).toBe('3.45');
    expect(scaled('000012', 0)).toBe('12');
    expect(scaled('00000', 3)).toBe('0.000');
    expect(scaled('000512', 5)).toBe('0.00512');
    expect(scaled('0000000000000001', 2)).toBe('0.01');
  });

  it('pads to a number of decimals', () => {
    expect(withDecimals('12', 2)).toBe('12.00');
    expect(withDecimals('0.1', 2)).toBe('0.10');
    expect(withDecimals('4.600', 2)).toBe('4.60');
    expect(withDecimals('0.512', 3)).toBe('0.512');
  });
});

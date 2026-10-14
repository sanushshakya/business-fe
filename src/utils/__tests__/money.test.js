import { describe, expect, it } from 'vitest';
import { formatCents, formatMoney, parseMoney, toCents } from '../money';

describe('money', () => {
  it('converts to whole pence without floating-point noise', () => {
    expect(toCents('0.1') + toCents('0.2')).toBe(30);
    expect(toCents('19.99')).toBe(1999);
  });

  it('formats pounds and pence', () => {
    expect(formatMoney('12.5')).toBe('£12.50');
    expect(formatMoney(0)).toBe('£0.00');
    expect(formatCents(3175)).toBe('£31.75');
  });

  it('parses what a person types', () => {
    expect(parseMoney('5')).toBe(500);
    expect(parseMoney('5.5')).toBe(550);
    expect(parseMoney(' £1,250.05 ')).toBe(125005);
    expect(parseMoney('.5')).toBe(50);
    expect(parseMoney('5.')).toBe(500);
  });

  it('rejects anything that is not an amount', () => {
    for (const bad of ['', 'abc', '-3', '1.2.3', '5 pounds', null, undefined]) expect(parseMoney(bad)).toBeNull();
  });
});

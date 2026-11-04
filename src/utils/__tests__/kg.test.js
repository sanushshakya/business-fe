import { describe, expect, it } from 'vitest';
import { formatGrams, percentOf, toGrams } from '../kg';

describe('kg', () => {
  it('reads kg text as whole grams', () => {
    expect(toGrams('1.25')).toBe(1250);
    expect(toGrams('10.000')).toBe(10000);
    expect(toGrams('0,512')).toBe(512);
    expect(toGrams('')).toBeNull();
    expect(toGrams('0')).toBeNull();
  });

  it('formats grams as 3-dp kg', () => {
    expect(formatGrams(350)).toBe('0.350');
    expect(formatGrams(-350)).toBe('-0.350');
    expect(formatGrams(12005)).toBe('12.005');
  });

  it('works out a percentage', () => {
    expect(percentOf(350, 10000)).toBe('3.5');
    expect(percentOf(1, 0)).toBe('0.0');
  });
});

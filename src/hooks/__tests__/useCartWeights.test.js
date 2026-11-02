import { describe, expect, it } from 'vitest';
import { cartReducer, cartTotalCents, weighedCents } from '../useCart';

const mince = { id: 4, name: 'Mince', price: '0.00', stock_quantity: 0, sold_by: 'weight', price_per_kg: '8.9900' };
const legs = { ...mince, id: 5, name: 'Lamb Legs', is_catch_weight: true, price_per_kg: '12.0000' };

describe('cartReducer typed weights (G19)', () => {
  it('adds each typed weight as its own manual line, priced weight × £/kg', () => {
    let lines = cartReducer([], { type: 'addWeighed', product: mince, weightKg: '0.512' });
    lines = cartReducer(lines, { type: 'addWeighed', product: mince, weightKg: '1.000' });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      product: 4,
      name: 'Mince',
      weightKg: '0.512',
      pricePerKg: '8.9900',
      manual: true,
      pieces: null,
      unitCents: 460,
      quantity: 1,
    });
    expect(lines[0].key).not.toBe(lines[1].key);
    expect(cartTotalCents(lines)).toBe(460 + 899);
    expect(cartReducer(lines, { type: 'setQuantity', product: lines[0].key, quantity: 3 })[0].quantity).toBe(1);
    expect(cartReducer(lines, { type: 'remove', product: lines[0].key })).toHaveLength(1);
  });

  it('keeps the pieces of a catch-weight line', () => {
    const [line] = cartReducer([], { type: 'addWeighed', product: legs, weightKg: '4.800', pieces: 2 });
    expect(line).toMatchObject({ pieces: 2, quantity: 1, unitCents: 5760 });
  });

  it('keys stay unique alongside scanned labels', () => {
    const label = { product: mince, barcode: '2100421005129', weightKg: '0.512', labelPrice: null, cents: 460 };
    let lines = cartReducer([], { type: 'addLabel', label });
    lines = cartReducer(lines, { type: 'addWeighed', product: mince, weightKg: '0.512' });
    lines = cartReducer(lines, { type: 'addLabel', label });
    expect(new Set(lines.map((l) => l.key)).size).toBe(3);
  });
});

describe('weighedCents', () => {
  it('rounds half-up to the penny with whole numbers', () => {
    expect(weighedCents('0.512', '8.9900')).toBe(460); // 4.60288
    expect(weighedCents('0.500', '0.0100')).toBe(1); // 0.005 → 0.01
    expect(weighedCents('0.001', '4.9900')).toBe(0); // 0.00499
    expect(weighedCents('100.000', '12.3456')).toBe(123456);
  });
});

import { describe, expect, it } from 'vitest';
import { cartReducer, cartTotalCents } from '../useCart';

const cake = { id: 7, name: 'Cake', price: '2.00', stock_quantity: 3 };
const mince = { id: 4, name: 'Mince', price: '0.00', stock_quantity: 0, sold_by: 'weight', price_per_kg: '8.9900' };
const label = { product: mince, barcode: '2100421005129', weightKg: '0.512', labelPrice: null, cents: 460 };

describe('cartReducer label lines', () => {
  it('adds each scanned label as its own line, which keeps its quantity', () => {
    let lines = cartReducer([], { type: 'addLabel', label });
    lines = cartReducer(lines, { type: 'addLabel', label });
    lines = cartReducer(lines, { type: 'add', product: cake });
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({
      product: 4,
      name: 'Mince',
      barcode: label.barcode,
      weightKg: '0.512',
      pricePerKg: '8.9900',
      unitCents: 460,
      quantity: 1,
    });
    expect(lines[0].key).not.toBe(lines[1].key);
    const changed = cartReducer(lines, { type: 'setQuantity', product: lines[0].key, quantity: 5 });
    expect(changed[0].quantity).toBe(1);
    expect(cartTotalCents(lines)).toBe(460 + 460 + 200);
  });

  it('removes one label line by its key and leaves the others', () => {
    let lines = cartReducer([], { type: 'addLabel', label });
    lines = cartReducer(lines, { type: 'addLabel', label });
    lines = cartReducer(lines, { type: 'remove', product: lines[0].key });
    expect(lines).toHaveLength(1);
  });

  it('a plain product line is not merged into a label line of the same product', () => {
    const cakeLabel = { product: cake, barcode: '2000077001501', weightKg: null, labelPrice: '1.50', cents: 150 };
    let lines = cartReducer([], { type: 'addLabel', label: cakeLabel });
    lines = cartReducer(lines, { type: 'add', product: cake });
    expect(lines.map((l) => [l.quantity, l.unitCents])).toEqual([
      [1, 150],
      [1, 200],
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { cartReducer, cartTotalCents } from '../useCart';

const rice = { id: 1, name: 'Rice', price: '12.50', stock_quantity: 3 };
const dates = { id: 2, name: 'Dates', price: '8.99', stock_quantity: 10 };
const add = (lines, product) => cartReducer(lines, { type: 'add', product });

describe('cartReducer', () => {
  it('adds a product once and counts repeats', () => {
    let lines = add([], rice);
    lines = add(lines, rice);
    expect(lines).toEqual([{ product: 1, name: 'Rice', unitCents: 1250, quantity: 2, max: 3 }]);
  });

  it('never goes past the stock on hand', () => {
    let lines = [];
    for (let i = 0; i < 5; i += 1) lines = add(lines, rice);
    expect(lines[0].quantity).toBe(3);
    expect(cartReducer(lines, { type: 'setQuantity', product: 1, quantity: 99 })[0].quantity).toBe(3);
  });

  it('ignores products that are out of stock', () => {
    expect(add([], { ...rice, stock_quantity: 0 })).toEqual([]);
  });

  it('sets, removes and clears', () => {
    let lines = add(add([], rice), dates);
    lines = cartReducer(lines, { type: 'setQuantity', product: 2, quantity: 4 });
    expect(lines.find((l) => l.product === 2).quantity).toBe(4);
    expect(cartReducer(lines, { type: 'setQuantity', product: 2, quantity: 0 }).map((l) => l.product)).toEqual([1]);
    expect(cartReducer(lines, { type: 'remove', product: 1 }).map((l) => l.product)).toEqual([2]);
    expect(cartReducer(lines, { type: 'clear' })).toEqual([]);
    expect(cartReducer(lines, { type: 'setQuantity', product: 2, quantity: 'abc' })).toBe(lines);
  });

  it('totals in whole pence', () => {
    let lines = add(add([], dates), dates);
    lines = add(lines, rice);
    expect(cartTotalCents(lines)).toBe(2 * 899 + 1250);
    expect(cartTotalCents([])).toBe(0);
  });
});

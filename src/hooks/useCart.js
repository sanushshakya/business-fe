import { useMemo, useReducer } from 'react';
import { toCents } from '../utils/money';

/**
 * The till's basket. Lines hold the price shown at the till in pence; the server re-prices every sale.
 * `max` is the stock on hand, so the basket cannot ask for more than the shelf holds.
 */
export const cartReducer = (lines, action) => {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const max = Math.max(Number(product.stock_quantity) || 0, 0);
      const existing = lines.find((line) => line.product === product.id);
      if (existing) {
        return lines.map((line) =>
          line.product === product.id ? { ...line, quantity: Math.min(line.quantity + 1, line.max) } : line
        );
      }
      if (max < 1) return lines;
      return [
        ...lines,
        { product: product.id, name: product.name, unitCents: toCents(product.price), quantity: 1, max },
      ];
    }
    case 'setQuantity': {
      const quantity = Math.floor(Number(action.quantity));
      if (!Number.isFinite(quantity)) return lines;
      if (quantity < 1) return lines.filter((line) => line.product !== action.product);
      return lines.map((line) =>
        line.product === action.product ? { ...line, quantity: Math.min(quantity, line.max) } : line
      );
    }
    case 'remove':
      return lines.filter((line) => line.product !== action.product);
    case 'clear':
      return [];
    default:
      return lines;
  }
};

export const cartTotalCents = (lines) => lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);

export default function useCart() {
  const [lines, dispatch] = useReducer(cartReducer, []);
  return useMemo(
    () => ({
      lines,
      totalCents: cartTotalCents(lines),
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      add: (product) => dispatch({ type: 'add', product }),
      setQuantity: (product, quantity) => dispatch({ type: 'setQuantity', product, quantity }),
      remove: (product) => dispatch({ type: 'remove', product }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [lines]
  );
}

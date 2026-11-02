import { useMemo, useReducer } from 'react';
import { toCents } from '../utils/money';

/** A line's id for `setQuantity`/`remove`: the product for a counted line, `key` for a scanned label's line. */
export const lineKey = (line) => line.key ?? line.product;

const nextLabelKey = (lines) =>
  `label-${Math.max(0, ...lines.filter((line) => line.key).map((line) => Number(line.key.slice(6)))) + 1}`;

/**
 * The till's basket. Lines hold the price shown at the till in pence; the server re-prices every sale.
 * `max` is the stock on hand, so the basket cannot ask for more than the shelf holds. A scanned label is a line of its
 * own (`key`, `barcode`, `weightKg`), sent to the server as just the barcode.
 */
export const cartReducer = (lines, action) => {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const max = Math.max(Number(product.stock_quantity) || 0, 0);
      const existing = lines.find((line) => line.product === product.id && !line.key);
      if (existing) {
        return lines.map((line) =>
          line === existing ? { ...line, quantity: Math.min(line.quantity + 1, line.max) } : line
        );
      }
      if (max < 1) return lines;
      return [
        ...lines,
        { product: product.id, name: product.name, unitCents: toCents(product.price), quantity: 1, max },
      ];
    }
    case 'addLabel': {
      // One line per scanned label (G18): its own key, one item, priced as the label reads; never merged.
      const { label } = action;
      return [
        ...lines,
        {
          key: nextLabelKey(lines),
          product: label.product.id,
          name: label.product.name,
          barcode: label.barcode,
          weightKg: label.weightKg,
          pricePerKg: label.weightKg === null ? null : label.product.price_per_kg,
          labelPrice: label.labelPrice,
          unitCents: label.cents,
          quantity: 1,
          max: 1,
        },
      ];
    }
    case 'setQuantity': {
      const quantity = Math.floor(Number(action.quantity));
      if (!Number.isFinite(quantity)) return lines;
      if (quantity < 1) return lines.filter((line) => lineKey(line) !== action.product);
      return lines.map((line) =>
        line.product === action.product && !line.key ? { ...line, quantity: Math.min(quantity, line.max) } : line
      );
    }
    case 'remove':
      return lines.filter((line) => lineKey(line) !== action.product);
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
      addLabel: (label) => dispatch({ type: 'addLabel', label }),
      setQuantity: (product, quantity) => dispatch({ type: 'setQuantity', product, quantity }),
      remove: (product) => dispatch({ type: 'remove', product }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [lines]
  );
}

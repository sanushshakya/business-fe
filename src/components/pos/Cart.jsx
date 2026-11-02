import React from 'react';
import { Button } from '@/components/ui';
import { formatCents, weightTimesPrice } from '../../utils/money';
import { lineKey } from '../../hooks/useCart';

/**
 * The basket: one row per product with a quantity stepper, and one row per scanned label (weight × £/kg or the label's
 * price, no stepper) or typed weight. `lines` come from `useCart`; `onQuantity`/`onRemove` get the line's `lineKey`.
 */
// A scanned label's line: the label's price when it has one, else weight × £/kg, else (a GS1 label with only the
// product number) the product's own price. A typed weight says so.
const labelDetail = (line) => {
  if (line.manual) {
    const pieces = line.pieces ? `${line.pieces} piece${line.pieces === 1 ? '' : 's'}, ` : '';
    return `${pieces}${weightTimesPrice(line.weightKg, line.pricePerKg)} · manual weight`;
  }
  if (line.labelPrice !== null) return 'Label price';
  if (line.weightKg !== null) return weightTimesPrice(line.weightKg, line.pricePerKg);
  return `${formatCents(line.unitCents)} each`;
};

const Cart = ({ lines = [], totalCents = 0, onQuantity, onRemove }) => (
  <div>
    {lines.length === 0 ? (
      <p className="py-6 text-center text-sm text-gray-500">Basket is empty. Tap a product to add it.</p>
    ) : (
      <ul className="divide-y divide-gray-100">
        {lines.map((line) => (
          <li key={lineKey(line)} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{line.name}</p>
              <p className="text-xs text-gray-500">
                {line.key ? labelDetail(line) : `${formatCents(line.unitCents)} each`}
              </p>
            </div>
            {!line.key && (
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  className="px-2 py-1"
                  aria-label={`Decrease ${line.name}`}
                  onClick={() => onQuantity(line.product, line.quantity - 1)}
                >
                  −
                </Button>
                <span className="w-8 text-center" aria-label={`${line.name} quantity`}>
                  {line.quantity}
                </span>
                <Button
                  variant="secondary"
                  className="px-2 py-1"
                  aria-label={`Increase ${line.name}`}
                  disabled={line.quantity >= line.max}
                  onClick={() => onQuantity(line.product, line.quantity + 1)}
                >
                  +
                </Button>
              </div>
            )}
            <p className="w-20 text-right">{formatCents(line.unitCents * line.quantity)}</p>
            <Button
              variant="secondary"
              className="px-2 py-1"
              aria-label={`Remove ${line.name}`}
              onClick={() => onRemove(lineKey(line))}
            >
              ×
            </Button>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-lg font-semibold">
      <span>Total</span>
      <span data-testid="cart-total">{formatCents(totalCents)}</span>
    </div>
  </div>
);

export default Cart;

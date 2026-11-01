import React from 'react';
import { Button, Input, Select } from '@/components/ui';

export const emptyLine = () => ({ product: '', quantity: '' });

const byId = (items) => Object.fromEntries((items || []).map((item) => [item.id, item]));

export const productName = (products, id) => byId(products)[id]?.name ?? `Product ${id}`;

/**
 * Checks edited lines (`[{product, quantity}]`, as typed) and returns `{lines}` ready to send or `{error}`.
 * Same rules as the backend: at least one product, each once, at least 1 unit.
 */
export const checkLines = (lines, products) => {
  const filled = lines.filter((line) => line.product !== '' || line.quantity !== '');
  if (!filled.length) return { error: 'Add at least one product.' };
  const seen = new Set();
  const result = [];
  for (const line of filled) {
    if (line.product === '') return { error: 'Choose a product on every line.' };
    const name = productName(products, line.product);
    if (seen.has(line.product)) return { error: `${name} is listed twice.` };
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return { error: `${name}: send at least 1 unit.` };
    seen.add(line.product);
    result.push({ product: line.product, quantity });
  }
  return { lines: result };
};

/** Rows of product + quantity with add/remove; `onChange` gets the new array. */
const LineEditor = ({ lines, products, onChange }) => {
  const update = (index, fields) => onChange(lines.map((line, i) => (i === index ? { ...line, ...fields } : line)));

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        // eslint-disable-next-line react/no-array-index-key -- rows have no id until saved
        <div key={index} className="flex gap-2">
          <Select
            aria-label={`Product ${index + 1}`}
            value={line.product}
            onChange={(event) =>
              update(index, { product: event.target.value === '' ? '' : Number(event.target.value) })
            }
          >
            <option value="">Select a product</option>
            {(products || []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <div className="w-24 shrink-0">
            <Input
              aria-label={`Quantity ${index + 1}`}
              type="number"
              min="1"
              value={line.quantity}
              onChange={(event) => update(index, { quantity: event.target.value })}
            />
          </div>
          {lines.length > 1 && (
            <Button
              variant="secondary"
              aria-label={`Remove line ${index + 1}`}
              onClick={() => onChange(lines.filter((_, i) => i !== index))}
            >
              ×
            </Button>
          )}
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...lines, emptyLine()])}>
        Add product
      </Button>
    </div>
  );
};

export default LineEditor;

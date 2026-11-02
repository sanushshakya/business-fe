import React from 'react';
import { Button, Form, Input } from '@/components/ui';
import { formatCents, weightTimesPrice } from '../../utils/money';
import { weighedCents } from '../../hooks/useCart';

// The serializer's ceiling for any one weighing; the company's lower limit for typed weights is checked on Charge.
const MAX_KG = 100;

/** What a person typed as kg (`0.5`, `.512`, `0,512`) as 3-dp text (`'0.500'`), or null when it is not a weight. */
export const normaliseKg = (text) => {
  const cleaned = String(text ?? '')
    .trim()
    .replace(',', '.');
  const match = /^([0-9]{0,3})(?:\.([0-9]{0,3}))?$/.exec(cleaned);
  if (!match || !(match[1] || match[2])) return null;
  const kg = `${Number(match[1] || '0')}.${(match[2] || '').padEnd(3, '0')}`;
  return /[1-9]/.test(kg) ? kg : null;
};

/**
 * Type the weight of a weighed product that has no label (G19: until the scale agent exists). Catch-weight products
 * also ask for pieces. Calls `onAdd({weightKg, pieces})`; the server marks the line "manual weight" for audit.
 */
const WeightEntry = ({ product, onAdd, onCancel }) => {
  const [kgText, setKgText] = React.useState('');
  const [piecesText, setPiecesText] = React.useState('1');
  const [problem, setProblem] = React.useState('');
  const catchWeight = Boolean(product.is_catch_weight);
  const weightKg = normaliseKg(kgText);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (weightKg === null) return setProblem('Type the weight in kg, up to 3 decimals (e.g. 0.512).');
    if (Number(weightKg) > MAX_KG) return setProblem(`Over ${MAX_KG} kg: check the weight, or weigh it in parts.`);
    const pieces = catchWeight ? Number(piecesText) : null;
    if (catchWeight && !(Number.isInteger(pieces) && pieces >= 1)) return setProblem('Say how many pieces.');
    setProblem('');
    return onAdd({ weightKg, pieces });
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-sm font-medium">Weigh {product.name} · no label, so the weight is typed</p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="manualWeightKg" className="mb-1 block text-sm font-medium">
            Weight (kg)
          </label>
          <Input
            id="manualWeightKg"
            inputMode="decimal"
            autoFocus
            value={kgText}
            onChange={(e) => setKgText(e.target.value)}
            className="w-32"
          />
        </div>
        {catchWeight && (
          <div>
            <label htmlFor="manualWeightPieces" className="mb-1 block text-sm font-medium">
              Pieces
            </label>
            <Input
              id="manualWeightPieces"
              inputMode="numeric"
              value={piecesText}
              onChange={(e) => setPiecesText(e.target.value)}
              className="w-20"
            />
          </div>
        )}
        <Button type="submit" aria-label={`Add ${product.name}`}>
          Add
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {weightKg !== null && (
        <p className="text-sm text-gray-700">
          {weightTimesPrice(weightKg, product.price_per_kg)} ={' '}
          {formatCents(weighedCents(weightKg, product.price_per_kg))}
        </p>
      )}
      {problem && (
        <p role="alert" className="text-sm text-red-600">
          {problem}
        </p>
      )}
    </Form>
  );
};

export default WeightEntry;

import React from 'react';
import { Button, Input } from '@/components/ui';
import { productName } from './LineEditor';
import LocationSelect from './LocationSelect';

/**
 * Send some or all of what a requisition still needs. Each open line is pre-filled with its open quantity;
 * 0 leaves it open. `onSubmit` gets `{source_location, lines: [{line, quantity}]}` (POST .../fulfil/), only
 * lines with something to send.
 */
const FulfilForm = ({ requisition, locations, products, onSubmit, submitting = false }) => {
  const open = requisition.lines.filter((line) => line.open_quantity > 0);
  const [source, setSource] = React.useState('');
  const [amounts, setAmounts] = React.useState(() =>
    Object.fromEntries(open.map((line) => [line.id, String(line.open_quantity)]))
  );
  const [error, setError] = React.useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (source === '') return setError('Choose where the stock comes from.');
    const lines = [];
    for (const line of open) {
      const quantity = Number(amounts[line.id]);
      if (amounts[line.id] === '' || !Number.isInteger(quantity) || quantity < 0 || quantity > line.open_quantity) {
        return setError(`${productName(products, line.product)}: send between 0 and ${line.open_quantity}.`);
      }
      if (quantity) lines.push({ line: line.id, quantity });
    }
    if (!lines.length) return setError('Send at least one unit.');
    setError(null);
    try {
      await onSubmit({ source_location: source, lines });
    } catch {
      // the page shows the error
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <LocationSelect
        id="fulfil-from"
        label="Send from"
        locations={locations}
        exclude={requisition.location}
        value={source}
        onChange={setSource}
      />
      {open.map((line) => {
        const name = productName(products, line.product);
        return (
          <div key={line.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1">
              {name} <span className="text-gray-500">({line.open_quantity} open)</span>
            </span>
            <div className="w-24 shrink-0">
              <Input
                aria-label={`Send ${name}`}
                type="number"
                min="0"
                max={line.open_quantity}
                value={amounts[line.id]}
                onChange={(event) => setAmounts((current) => ({ ...current, [line.id]: event.target.value }))}
              />
            </div>
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Saving…' : 'Make transfer'}
      </Button>
    </form>
  );
};

export default FulfilForm;

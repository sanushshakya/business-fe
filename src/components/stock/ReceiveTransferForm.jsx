import React from 'react';
import { Button, Input } from '@/components/ui';
import { productName } from './LineEditor';

/**
 * What arrived on a dispatched transfer: one row per line, pre-filled with what was sent. A different count
 * needs a reason. `onSubmit` gets `{lines: [{line, received_quantity, reason}]}` (POST .../receive/).
 */
const ReceiveTransferForm = ({ transfer, products, onSubmit, submitting = false }) => {
  const [rows, setRows] = React.useState(() =>
    Object.fromEntries(transfer.lines.map((line) => [line.id, { received: String(line.quantity), reason: '' }]))
  );
  const [error, setError] = React.useState(null);
  const update = (id, fields) => setRows((current) => ({ ...current, [id]: { ...current[id], ...fields } }));

  const submit = async (event) => {
    event.preventDefault();
    const lines = [];
    for (const line of transfer.lines) {
      const name = productName(products, line.product);
      const received = Number(rows[line.id].received);
      const reason = rows[line.id].reason.trim();
      if (rows[line.id].received === '' || !Number.isInteger(received) || received < 0 || received > line.quantity) {
        return setError(`${name}: received must be between 0 and ${line.quantity}.`);
      }
      if (received !== line.quantity && !reason) return setError(`${name}: say why ${received} of ${line.quantity} arrived.`);
      lines.push({ line: line.id, received_quantity: received, reason: received === line.quantity ? '' : reason });
    }
    setError(null);
    try {
      await onSubmit({ lines });
    } catch {
      // the page shows the error
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {transfer.lines.map((line) => {
        const name = productName(products, line.product);
        const row = rows[line.id];
        const differs = row.received !== '' && Number(row.received) !== line.quantity;
        return (
          <div key={line.id} className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex-1">
                {name} <span className="text-gray-500">(sent {line.quantity})</span>
              </span>
              <Input
                aria-label={`Received ${name}`}
                type="number"
                min="0"
                max={line.quantity}
                className="w-24"
                value={row.received}
                onChange={(event) => update(line.id, { received: event.target.value })}
              />
            </div>
            {differs && (
              <Input
                aria-label={`Reason for ${name}`}
                placeholder="Why is it different? (e.g. one damaged)"
                value={row.reason}
                onChange={(event) => update(line.id, { reason: event.target.value })}
              />
            )}
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Saving…' : 'Receive'}
      </Button>
    </form>
  );
};

export default ReceiveTransferForm;

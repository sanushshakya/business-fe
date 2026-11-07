import React from 'react';
import { Button, Card, Input, Select } from '@/components/ui';
import { apiErrorMessage } from '../../utils/http';

export const REASONS = [
  ['not_wanted', 'Not wanted'],
  ['wrong_item', 'Wrong item'],
  ['damaged', 'Damaged (waste)'],
  ['out_of_date', 'Out of date (waste)'],
];

const loose = (line) => line.quantity == null; // ordered by kg
const catchWeight = (line) => line.quantity != null && line.picked_weight_kg != null;

/**
 * Goods a customer gives back after delivery (G45), line by line with a reason, and the returns so far with their
 * credit notes. Amounts are sent as typed; the server checks them against what was delivered.
 */
const ReturnForm = ({ lines, returns = [], onSubmit, onCredit, busy = false }) => {
  const blank = () => Object.fromEntries(lines.map((line) => [line.id, { units: '', kg: '', reason: 'not_wanted' }]));
  const [rows, setRows] = React.useState(blank);
  const [error, setError] = React.useState(null);
  const set = (id, name, value) => setRows((current) => ({ ...current, [id]: { ...current[id], [name]: value } }));

  const submit = async (event) => {
    event.preventDefault();
    const requested = lines
      .filter((line) => (loose(line) ? rows[line.id]?.kg : rows[line.id]?.units))
      .map((line) => {
        const row = rows[line.id];
        if (loose(line)) return { line: line.id, weight_kg: row.kg.trim(), reason: row.reason };
        const body = { line: line.id, quantity: Number(row.units), reason: row.reason };
        return catchWeight(line) ? { ...body, weight_kg: row.kg.trim() } : body;
      });
    if (!requested.length) return;
    try {
      await onSubmit({ lines: requested });
      setRows(blank());
      setError(null);
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Could not record the return.'));
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <h3 className="font-medium">Returns</h3>
      {returns.length > 0 && (
        <ul className="space-y-1 text-sm">
          {returns.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="font-mono">{item.number_display}</span>
              <span>{item.kind === 'door' ? 'refused at the door' : 'returned later'}</span>
              {item.credit_note ? (
                <span className="text-gray-500">credit note drawn up</span>
              ) : (
                <Button variant="secondary" disabled={busy} onClick={() => onCredit(item)}>
                  Draft credit note
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2">
        {lines.map((line) => {
          const name = line.product_name;
          return (
            <div key={line.id} className="grid grid-cols-[1fr_6rem_6rem_12rem] items-center gap-2 text-sm">
              <span>{name}</span>
              {loose(line) ? (
                <span />
              ) : (
                <Input
                  aria-label={`Return ${name}`}
                  inputMode="numeric"
                  placeholder="qty"
                  value={rows[line.id]?.units ?? ''}
                  onChange={(e) => set(line.id, 'units', e.target.value)}
                />
              )}
              {loose(line) || catchWeight(line) ? (
                <Input
                  aria-label={`Return kg ${name}`}
                  inputMode="decimal"
                  placeholder="kg"
                  value={rows[line.id]?.kg ?? ''}
                  onChange={(e) => set(line.id, 'kg', e.target.value)}
                />
              ) : (
                <span />
              )}
              <Select
                aria-label={`Reason ${name}`}
                value={rows[line.id]?.reason ?? 'not_wanted'}
                onChange={(e) => set(line.id, 'reason', e.target.value)}
              >
                {REASONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          Record return
        </Button>
      </form>
    </Card>
  );
};

export default ReturnForm;

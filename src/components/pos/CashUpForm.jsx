import React from 'react';
import { Button, Form, Input } from '@/components/ui';
import { formatCents, formatMoney, parseMoney, toCents } from '../../utils/money';

/**
 * Closing a till: shows what the drawer should hold, takes the counted cash and previews the variance.
 * Calls `onSubmit({counted_cash, note})`.
 */
const CashUpForm = ({ session, onSubmit, submitting = false }) => {
  const [counted, setCounted] = React.useState('');
  const [note, setNote] = React.useState('');
  const { summary } = session;
  const expectedCents = toCents(summary.expected_cash);
  const countedCents = parseMoney(counted);
  const variance = countedCents === null ? null : countedCents - expectedCents;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (countedCents === null) return;
    onSubmit({ counted_cash: (countedCents / 100).toFixed(2), note: note.trim() });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-gray-600">Opening float</dt>
        <dd className="text-right">{formatMoney(session.opening_float)}</dd>
        <dt className="text-gray-600">Cash sales</dt>
        <dd className="text-right">{formatMoney(summary.cash_total)}</dd>
        <dt className="text-gray-600">Card sales</dt>
        <dd className="text-right">{formatMoney(summary.card_total)}</dd>
        <dt className="text-gray-600">Sales / voids</dt>
        <dd className="text-right">
          {summary.sales_count} / {summary.voided_count}
        </dd>
        <dt className="font-semibold">Cash expected in drawer</dt>
        <dd className="text-right font-semibold">{formatMoney(summary.expected_cash)}</dd>
      </dl>
      <div>
        <label htmlFor="countedCash" className="mb-1 block text-sm font-medium">
          Counted cash
        </label>
        <Input
          id="countedCash"
          inputMode="decimal"
          placeholder="0.00"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
          required
        />
        {variance !== null && (
          <p className={`mt-1 text-sm ${variance === 0 ? 'text-green-700' : 'text-red-600'}`} data-testid="variance">
            {variance === 0
              ? 'Drawer balances'
              : variance > 0
                ? `Over by ${formatCents(variance)}`
                : `Short by ${formatCents(-variance)}`}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="cashUpNote" className="mb-1 block text-sm font-medium">
          Note (optional)
        </label>
        <Input id="cashUpNote" value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting || countedCents === null}>
        {submitting ? 'Closing…' : 'Close till'}
      </Button>
    </Form>
  );
};

export default CashUpForm;

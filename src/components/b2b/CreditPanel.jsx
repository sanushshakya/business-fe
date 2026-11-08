import React from 'react';
import { Button, Card, Input } from '@/components/ui';

const OVERRIDABLE = ['over_limit', 'overdue'];
const LIFTED = { over_limit: 'over the limit', overdue: 'overdue invoices' };

/**
 * Credit hold on an order (G48): what stops it (the server's reasons) and the override that let it through.
 * Staff may override the limit and overdue rules with a reason; a manual hold is lifted on the customer instead.
 */
const CreditPanel = ({ blocks, override, isStaff, onOverride, busy = false, label = 'Override' }) => {
  const [reason, setReason] = React.useState('');
  const overridable = blocks.some((block) => OVERRIDABLE.includes(block.code));
  const onHold = blocks.some((block) => block.code === 'on_hold');
  if (!blocks.length && !override) return null;

  const submit = (event) => {
    event.preventDefault();
    onOverride(reason.trim()).then(
      () => setReason(''),
      () => {} // the page shows why; keep the reason
    );
  };

  return (
    <Card className="space-y-2 border-amber-300 p-4 text-sm">
      {blocks.length > 0 && (
        <>
          <h3 className="font-semibold text-amber-800">Credit hold</h3>
          <ul className="list-disc space-y-1 pl-5">
            {blocks.map((block) => (
              <li key={block.code}>{block.message}</li>
            ))}
          </ul>
          {onHold && <p className="text-gray-600">Take the customer off hold to go on.</p>}
        </>
      )}
      {isStaff && overridable && !onHold && (
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <Input
            aria-label="Override reason"
            placeholder="Why it may go ahead"
            value={reason}
            maxLength={255}
            onChange={(event) => setReason(event.target.value)}
          />
          <Button type="submit" disabled={!reason.trim() || busy}>
            {label}
          </Button>
        </form>
      )}
      {override && (
        <p className="text-gray-700">
          Credit override ({override.blocks.map((code) => LIFTED[code] ?? code).join(', ')}) on{' '}
          {new Date(override.created_at).toLocaleString('en-GB')}: {override.reason}
        </p>
      )}
    </Card>
  );
};

export default CreditPanel;

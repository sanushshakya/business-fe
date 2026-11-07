import React from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { formatMoney } from '../../utils/money';

const EMAIL_LABELS = {
  not_sent: 'not sent',
  queued: 'email queued',
  sent: 'emailed',
  failed: 'email failed',
  no_address: 'no email address',
};

/** An order's invoice (G43): make the draft from what was picked, issue it, open the PDF. */
const OrderInvoice = ({ invoice, onCreate, onIssue, onPdf, busy = false }) => (
  <Card className="space-y-2 p-4">
    <h3 className="font-medium">Invoice</h3>
    {!invoice && (
      <Button disabled={busy} onClick={onCreate}>
        Create invoice
      </Button>
    )}
    {invoice && (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-mono">{invoice.number_display}</span>
        <Badge color={invoice.status === 'issued' ? 'green' : 'yellow'}>{invoice.status}</Badge>
        <span>{formatMoney(invoice.gross_total)}</span>
        {invoice.status === 'issued' && <span className="text-gray-500">{EMAIL_LABELS[invoice.email_status]}</span>}
        {invoice.status === 'draft' && (
          <Button disabled={busy} onClick={() => onIssue(invoice)}>
            Issue invoice
          </Button>
        )}
        <Button variant="secondary" onClick={() => onPdf(invoice)}>
          Open PDF
        </Button>
      </div>
    )}
  </Card>
);

export default OrderInvoice;

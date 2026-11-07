import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { formatMoney } from '../../utils/money';

const EMAIL_LABELS = {
  not_sent: '—',
  queued: 'queued',
  sent: 'sent',
  failed: 'failed',
  no_address: 'no address',
};

/**
 * Invoices (G43) or credit notes (G45) as a table: number, customer, total, status and email, with the actions a
 * row allows — drafts are issued or deleted, issued ones resent; every one opens as a PDF.
 */
const DocumentList = ({ documents, kind, onIssue, onDelete, onResend, onRefresh, onPdf, busy = false }) => (
  <Table>
    <Thead>
      <Tr>
        <Th>Number</Th>
        <Th>{kind === 'invoice' ? 'Order' : 'Invoice'}</Th>
        <Th>Customer</Th>
        <Th>Total</Th>
        <Th>Status</Th>
        <Th>Email</Th>
        <Th />
      </Tr>
    </Thead>
    <Tbody>
      {documents.map((doc) => {
        const name = doc.number_display;
        return (
          <Tr key={doc.id}>
            <Td className="font-mono">{name}</Td>
            <Td>{kind === 'invoice' ? doc.order_number : doc.invoice_number}</Td>
            <Td>{doc.customer_name || doc.customer_code || '—'}</Td>
            <Td>{formatMoney(doc.gross_total)}</Td>
            <Td>
              <Badge color={doc.status === 'issued' ? 'green' : 'yellow'}>{doc.status}</Badge>
            </Td>
            <Td>{doc.status === 'issued' ? EMAIL_LABELS[doc.email_status] : '—'}</Td>
            <Td className="space-x-2 text-right">
              {doc.status === 'draft' && (
                <>
                  <Button disabled={busy} onClick={() => onIssue(doc)} aria-label={`Issue ${name}`}>
                    Issue
                  </Button>
                  {onRefresh && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => onRefresh(doc)}
                      aria-label={`Rebuild ${name}`}
                    >
                      Rebuild
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onDelete(doc)}
                    aria-label={`Delete ${name}`}
                  >
                    Delete
                  </Button>
                </>
              )}
              {doc.status === 'issued' && (
                <Button variant="secondary" disabled={busy} onClick={() => onResend(doc)} aria-label={`Resend ${name}`}>
                  Resend
                </Button>
              )}
              <Button variant="secondary" onClick={() => onPdf(doc)} aria-label={`PDF ${name}`}>
                PDF
              </Button>
            </Td>
          </Tr>
        );
      })}
    </Tbody>
  </Table>
);

export default DocumentList;

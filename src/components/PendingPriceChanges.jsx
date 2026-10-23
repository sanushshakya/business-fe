import React from 'react';
import { Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';

const REASONS = { decay_markdown: 'Near-expiry markdown' };

const change = (log) => {
  const oldPrice = Number(log.old_price);
  const percent = oldPrice ? ((Number(log.new_price) - oldPrice) / oldPrice) * 100 : 0;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}%`;
};

/**
 * Price change requests waiting for approval. A change only reaches the product (and the storefronts) once
 * staff approve it; rejecting deletes the request.
 *
 * @param {{id, product, old_price, new_price, reason, changed_at, is_approved}[]} logs - PriceChangeLog rows
 * @param {Record<number, string>} [productNames] - product id → name
 * @param {boolean} [canDecide] - show Approve/Reject (staff only; the backend refuses everyone else)
 * @param {(log) => void} [onApprove]
 * @param {(log) => void} [onReject]
 * @param {number} [busyId] - id of the change being approved or rejected right now
 */
const PendingPriceChanges = ({ logs = [], productNames = {}, canDecide = false, onApprove, onReject, busyId }) => {
  const rows = logs.filter((log) => !log.is_approved);

  if (rows.length === 0) return <p className="text-sm text-gray-500">No price changes waiting for approval.</p>;

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Requested</Th>
          <Th>Product</Th>
          <Th>Price</Th>
          <Th>Reason</Th>
          {canDecide && <Th>Decision</Th>}
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((log) => {
          const name = productNames[log.product] ?? `Product #${log.product}`;
          const busy = busyId === log.id;
          return (
            <Tr key={log.id}>
              <Td>{new Date(log.changed_at).toLocaleDateString()}</Td>
              <Td>{name}</Td>
              <Td>
                £{Number(log.old_price).toFixed(2)} → £{Number(log.new_price).toFixed(2)}{' '}
                <span className="text-gray-500">({change(log)})</span>
              </Td>
              <Td>{REASONS[log.reason] ?? (log.reason || '—')}</Td>
              {canDecide && (
                <Td>
                  <div className="flex gap-2">
                    <Button
                      className="px-3 py-1"
                      disabled={busyId != null}
                      aria-label={`Approve ${name}`}
                      onClick={() => onApprove?.(log)}
                    >
                      {busy ? 'Saving…' : 'Approve'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-1"
                      disabled={busyId != null}
                      aria-label={`Reject ${name}`}
                      onClick={() => onReject?.(log)}
                    >
                      Reject
                    </Button>
                  </div>
                </Td>
              )}
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default PendingPriceChanges;

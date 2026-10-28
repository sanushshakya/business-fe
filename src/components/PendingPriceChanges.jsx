import React, { useState } from 'react';
import { Button, Input, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';

export const SOURCES = { manual: 'Manual', decay_markdown: 'Near-expiry markdown' };
const REASONS = { decay_markdown: 'Shelf life running out' };

export const prices = (log) => `£${Number(log.old_price).toFixed(2)} → £${Number(log.new_price).toFixed(2)}`;

export const percentChange = (log) => {
  const oldPrice = Number(log.old_price);
  const percent = oldPrice ? ((Number(log.new_price) - oldPrice) / oldPrice) * 100 : 0;
  return `(${percent > 0 ? '+' : ''}${percent.toFixed(0)}%)`;
};

/**
 * Price change requests waiting for a decision. A change only reaches the product (and the storefronts) once
 * approved; a rejected one is kept as a record. Staff only: the page does not render this for anyone else.
 *
 * @param {{id, product, old_price, new_price, reason, source, requested_by_name, changed_at, is_approved,
 *   is_rejected}[]} logs - PriceChangeLog rows
 * @param {Record<number, string>} [productNames] - product id → name
 * @param {(log, note: string) => void} [onApprove]
 * @param {(log, note: string) => void} [onReject]
 * @param {number} [busyId] - id of the change being approved or rejected right now
 */
const PendingPriceChanges = ({ logs = [], productNames = {}, onApprove, onReject, busyId }) => {
  const [notes, setNotes] = useState({});
  const rows = logs.filter((log) => !log.is_approved && !log.is_rejected);

  if (rows.length === 0) return <p className="text-sm text-gray-500">No price changes waiting for a decision.</p>;

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Requested</Th>
          <Th>Product</Th>
          <Th>Price</Th>
          <Th>Reason</Th>
          <Th>Source</Th>
          <Th>Decision</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((log) => {
          const name = productNames[log.product] ?? `Product #${log.product}`;
          const busy = busyId === log.id;
          const note = notes[log.id] ?? '';
          return (
            <Tr key={log.id}>
              <Td>
                <div>{new Date(log.changed_at).toLocaleDateString()}</div>
                <div className="text-xs text-gray-500">
                  {log.requested_by_name || (log.source === 'decay_markdown' ? 'Nightly job' : '—')}
                </div>
              </Td>
              <Td>{name}</Td>
              <Td>
                {prices(log)} <span className="text-gray-500">{percentChange(log)}</span>
              </Td>
              <Td>{REASONS[log.reason] ?? (log.reason || '—')}</Td>
              <Td>{SOURCES[log.source] ?? log.source}</Td>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="w-40 py-1"
                    placeholder="Note (optional)"
                    maxLength={255}
                    aria-label={`Note for ${name}`}
                    value={note}
                    onChange={(e) => setNotes((all) => ({ ...all, [log.id]: e.target.value }))}
                  />
                  <Button
                    className="px-3 py-1"
                    disabled={busyId != null}
                    aria-label={`Approve ${name}`}
                    onClick={() => onApprove?.(log, note)}
                  >
                    {busy ? 'Saving…' : 'Approve'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3 py-1"
                    disabled={busyId != null}
                    aria-label={`Reject ${name}`}
                    onClick={() => onReject?.(log, note)}
                  >
                    Reject
                  </Button>
                </div>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default PendingPriceChanges;

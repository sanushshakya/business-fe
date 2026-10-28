import React from 'react';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { SOURCES, percentChange, prices } from './PendingPriceChanges';

/**
 * Approved and rejected price changes: who decided, when, and their note. Changes approved before decisions
 * were recorded show a dash for who and when.
 *
 * @param {{id, product, old_price, new_price, source, is_approved, is_rejected, decided_by_name, decided_at,
 *   decision_note, changed_at}[]} logs - PriceChangeLog rows
 * @param {Record<number, string>} [productNames] - product id → name
 * @param {number} [limit] - how many of the newest decisions to show
 */
const PriceDecisions = ({ logs = [], productNames = {}, limit = 20 }) => {
  const when = (log) => log.decided_at || log.changed_at;
  const rows = logs
    .filter((log) => log.is_approved || log.is_rejected)
    .sort((a, b) => new Date(when(b)) - new Date(when(a)))
    .slice(0, limit);

  if (rows.length === 0) return <p className="text-sm text-gray-500">No decisions yet.</p>;

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Product</Th>
          <Th>Price</Th>
          <Th>Source</Th>
          <Th>Decision</Th>
          <Th>By</Th>
          <Th>When</Th>
          <Th>Note</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((log) => (
          <Tr key={log.id}>
            <Td>{productNames[log.product] ?? `Product #${log.product}`}</Td>
            <Td>
              {prices(log)} <span className="text-gray-500">{percentChange(log)}</span>
            </Td>
            <Td>{SOURCES[log.source] ?? log.source}</Td>
            <Td>{log.is_approved ? <Badge color="green">Approved</Badge> : <Badge color="red">Rejected</Badge>}</Td>
            <Td>{log.decided_by_name || '—'}</Td>
            <Td>{log.decided_at ? new Date(log.decided_at).toLocaleString() : '—'}</Td>
            <Td>{log.decision_note || '—'}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default PriceDecisions;

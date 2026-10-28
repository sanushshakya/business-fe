import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Value saved by markdowns of near-expiry stock in the last 30 days. Only approved ones count: pending
 * and rejected markdowns never changed a price.
 *
 * @param {{id, product, old_price, new_price, source, is_approved, changed_at}[]} logs - PriceChangeLog rows
 * @param {Record<number, string>} [productNames] - product id → name
 */
const WasteReductionReport = ({ logs = [], productNames = {}, now = new Date() }) => {
  const rows = logs.filter(
    (log) => log.source === 'decay_markdown' && log.is_approved && now - new Date(log.changed_at) <= THIRTY_DAYS_MS
  );

  if (rows.length === 0) return <p className="text-sm text-gray-500">No markdowns in the last 30 days.</p>;

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Date</Th>
          <Th>Product</Th>
          <Th>Markdown</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((log) => (
          <Tr key={log.id}>
            <Td>{new Date(log.changed_at).toLocaleDateString()}</Td>
            <Td>{productNames[log.product] ?? `Product #${log.product}`}</Td>
            <Td>£{(Number(log.old_price) - Number(log.new_price)).toFixed(2)}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default WasteReductionReport;

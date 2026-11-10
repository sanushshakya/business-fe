import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { money } from './money';

/** One section of a report: its accounts with an amount, then the total. */
const AccountRows = ({ title, rows, total, totalLabel }) => (
  <Table aria-label={title}>
    <Thead>
      <Tr>
        <Th>{title}</Th>
        <Th className="text-right">Amount</Th>
      </Tr>
    </Thead>
    <Tbody>
      {rows.map((row) => (
        <Tr key={row.account ?? row.name}>
          <Td>
            {row.code && <span className="mr-2 font-mono text-gray-500">{row.code}</span>}
            {row.name}
          </Td>
          <Td className="text-right tabular-nums">{money(row.amount)}</Td>
        </Tr>
      ))}
      {!rows.length && (
        <Tr>
          <Td className="text-gray-500">Nothing posted.</Td>
          <Td />
        </Tr>
      )}
      <Tr>
        <Td className="font-semibold">{totalLabel}</Td>
        <Td className="text-right font-semibold tabular-nums">{money(total)}</Td>
      </Tr>
    </Tbody>
  </Table>
);

export default AccountRows;

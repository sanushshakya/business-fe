import React from 'react';
import { Card, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import AccountRows from './AccountRows';
import { money } from './money';

/** Trial balance (G53): each account's net as a debit or a credit; the totals agree. */
export const TrialBalanceTable = ({ data }) => (
  <Table aria-label="Trial balance">
    <Thead>
      <Tr>
        <Th>Account</Th>
        <Th className="text-right">Debit</Th>
        <Th className="text-right">Credit</Th>
      </Tr>
    </Thead>
    <Tbody>
      {data.rows.map((row) => (
        <Tr key={row.account}>
          <Td>
            <span className="mr-2 font-mono text-gray-500">{row.code}</span>
            {row.name}
          </Td>
          <Td className="text-right tabular-nums">{Number(row.debit) ? money(row.debit) : ''}</Td>
          <Td className="text-right tabular-nums">{Number(row.credit) ? money(row.credit) : ''}</Td>
        </Tr>
      ))}
      <Tr>
        <Td className="font-semibold">Total</Td>
        <Td className="text-right font-semibold tabular-nums">{money(data.debit)}</Td>
        <Td className="text-right font-semibold tabular-nums">{money(data.credit)}</Td>
      </Tr>
    </Tbody>
  </Table>
);

/** Profit and loss (G54) for the period. */
export const ProfitAndLoss = ({ data }) => (
  <div className="space-y-4">
    <AccountRows title="Income" rows={data.income} total={data.total_income} totalLabel="Total income" />
    <AccountRows title="Expenses" rows={data.expenses} total={data.total_expenses} totalLabel="Total expenses" />
    <Card className="flex justify-between p-4 font-semibold">
      <span>{Number(data.net_profit) < 0 ? 'Net loss' : 'Net profit'}</span>
      <span className="tabular-nums">{money(data.net_profit)}</span>
    </Card>
  </div>
);

/** Balance sheet (G54) at a day; equity includes profit to date (no year-end close yet). */
export const BalanceSheet = ({ data }) => (
  <div className="space-y-4">
    <AccountRows title="Assets" rows={data.assets} total={data.total_assets} totalLabel="Total assets" />
    <AccountRows
      title="Liabilities"
      rows={data.liabilities}
      total={data.total_liabilities}
      totalLabel="Total liabilities"
    />
    <AccountRows title="Equity" rows={data.equity} total={data.total_equity} totalLabel="Total equity" />
    <Card className="flex justify-between p-4 font-semibold">
      <span>Liabilities and equity</span>
      <span className="tabular-nums">{money(data.total_liabilities_and_equity)}</span>
    </Card>
  </div>
);

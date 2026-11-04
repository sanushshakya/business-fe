import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { formatMoney } from '../../utils/money';
import { ukDay } from './BreakdownForm';

/** The waste report (`GET /inventory/reports/waste/`): written-off stock per week from Monday, with its cost. */
const WasteReport = ({ report }) => {
  if (!report.weeks.length) return <p className="text-sm text-gray-500">Nothing written off in these dates.</p>;
  return (
    <div className="space-y-6">
      {report.weeks.map((week) => (
        <div key={week.week_start}>
          <h3 className="mb-2 font-semibold">
            Week of {ukDay(week.week_start)}{' '}
            <span className="text-sm font-normal text-gray-600">· {formatMoney(week.total_cost)}</span>
          </h3>
          <Table>
            <Thead>
              <Tr>
                <Th>{report.group === 'reason' ? 'Reason' : 'Product'}</Th>
                <Th>Write-offs</Th>
                <Th>Quantity</Th>
                <Th>kg</Th>
                <Th>Cost</Th>
              </Tr>
            </Thead>
            <Tbody>
              {week.rows.map((row) => (
                <Tr key={row.key}>
                  <Td>{row.name}</Td>
                  <Td>{row.write_offs}</Td>
                  <Td>{row.quantity}</Td>
                  <Td>{row.weight_kg}</Td>
                  <Td>
                    {formatMoney(row.cost)}
                    {row.uncosted > 0 && (
                      <span className="ml-1 text-xs text-amber-700">+ {row.uncosted} with no cost</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      ))}
      <p className="text-right font-semibold">Total {formatMoney(report.total_cost)}</p>
    </div>
  );
};

export default WasteReport;

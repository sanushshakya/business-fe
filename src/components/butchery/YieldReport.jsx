import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { formatGrams, toGrams } from '../../utils/kg';
import { formatMoney } from '../../utils/money';

/**
 * Whether a variance is bad: less product than expected, or more waste or loss. `variance` is kg text such as
 * `'-0.100'`.
 */
const worse = (kind, variance) => (kind === 'product' ? Number(variance) < 0 : Number(variance) > 0);
const varianceClass = (kind, variance) =>
  Number(variance) === 0 ? '' : worse(kind, variance) ? 'font-medium text-red-600' : 'text-green-700';
const signed = (kg) => (Number(kg) > 0 ? `+${kg}` : kg);
const lossVariance = (row) => formatGrams((toGrams(row.loss_kg) ?? 0) - (toGrams(row.expected_loss_kg) ?? 0));

/** The yield report (`GET /inventory/reports/yield/`): per group, each output's actual kg against the template's. */
const YieldReport = ({ report }) => {
  if (!report.rows.length) return <p className="text-sm text-gray-500">No breakdowns in these dates.</p>;
  return (
    <div className="space-y-6">
      {report.rows.map((row) => (
        <div key={row.key ?? 'none'}>
          <h3 className="mb-2 font-semibold">
            {row.name}{' '}
            <span className="text-sm font-normal text-gray-600">
              · {row.breakdowns} breakdown{row.breakdowns === 1 ? '' : 's'} · {row.input_kg} kg in
              {row.input_cost != null && ` · cost ${formatMoney(row.input_cost)}`}
              {row.uncosted > 0 && row.input_cost != null && ` (${row.uncosted} with no cost)`}
            </span>
          </h3>
          <Table>
            <Thead>
              <Tr>
                <Th>Output</Th>
                <Th>Actual kg</Th>
                <Th>Expected kg</Th>
                <Th>Actual %</Th>
                <Th>Expected %</Th>
                <Th>Variance kg</Th>
              </Tr>
            </Thead>
            <Tbody>
              {row.outputs.map((output) => (
                <Tr key={`${output.kind}-${output.product ?? output.name}`}>
                  <Td>
                    {output.name}
                    {output.kind === 'waste' && <span className="ml-1 text-xs text-gray-500">(waste)</span>}
                  </Td>
                  <Td>{output.actual_kg}</Td>
                  <Td>{output.expected_kg}</Td>
                  <Td>{output.actual_percent}%</Td>
                  <Td>{output.expected_percent}%</Td>
                  <Td className={varianceClass(output.kind, output.variance_kg)}>{signed(output.variance_kg)}</Td>
                </Tr>
              ))}
              <Tr>
                <Td>Loss</Td>
                <Td>{row.loss_kg}</Td>
                <Td>{row.expected_loss_kg}</Td>
                <Td />
                <Td />
                <Td className={varianceClass('loss', lossVariance(row))}>{signed(lossVariance(row))}</Td>
              </Tr>
            </Tbody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default YieldReport;

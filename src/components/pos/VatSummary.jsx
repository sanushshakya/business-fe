// src/components/pos/VatSummary.jsx

import React from 'react';
import { formatCents, formatMoney, toCents } from '../../utils/money';
import { vatLetter } from '../../utils/vat';

/**
 * VAT by rate, as the backend sends it (`[{vat_code, rate, net, vat, gross}]`), with a total row. The totals are
 * sums of the rows, which the backend already made from rounded lines.
 */
const VatSummary = ({ rows = [] }) => {
  const total = (key) => formatCents(rows.reduce((sum, row) => sum + toCents(row[key]), 0));
  return (
    <table aria-label="VAT summary" className="w-full text-xs">
      <thead>
        <tr className="text-gray-600">
          <th className="text-left font-normal">VAT rate</th>
          <th className="text-right font-normal">Net</th>
          <th className="text-right font-normal">VAT</th>
          <th className="text-right font-normal">Gross</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.vat_code}-${row.rate}`}>
            <td>{`${vatLetter(row.vat_code)} ${Number(row.rate)}%`}</td>
            <td className="text-right">{formatMoney(row.net)}</td>
            <td className="text-right">{formatMoney(row.vat)}</td>
            <td className="text-right">{formatMoney(row.gross)}</td>
          </tr>
        ))}
        <tr className="border-t border-gray-200 font-medium">
          <td>Total</td>
          <td className="text-right">{total('net')}</td>
          <td className="text-right">{total('vat')}</td>
          <td className="text-right">{total('gross')}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default VatSummary;

import React from 'react';
import { Badge, Button } from '@/components/ui';
import { formatMoney } from '../../utils/money';

/**
 * A sale as returned by `/sales/sales/`. Everything inside `.print-area` is all that gets printed.
 */
const Receipt = ({ sale, onPrint = () => window.print() }) => {
  const voided = sale.status === 'voided';
  return (
    <div>
      <div className="print-area space-y-2 text-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold">Receipt {sale.receipt_number}</p>
            <p className="text-gray-600">{new Date(sale.created_at).toLocaleString()}</p>
            <p className="text-gray-600">
              {sale.branch_name} · Till {sale.till_number} · {sale.cashier_name ?? sale.cashier_email}
            </p>
          </div>
          {voided && <Badge color="red">Voided</Badge>}
        </div>
        <table className="w-full">
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="py-1">
                  {item.quantity} × {item.product_name}
                  <span className="block text-xs text-gray-500">{formatMoney(item.unit_price)} each</span>
                </td>
                <td className="py-1 text-right">{formatMoney(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1 border-t border-gray-300 pt-2">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(sale.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>{sale.payment_method === 'cash' ? 'Cash' : 'Card'}</span>
            <span>{formatMoney(sale.amount_tendered)}</span>
          </div>
          {sale.payment_method === 'cash' && (
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatMoney(sale.change_due)}</span>
            </div>
          )}
          {voided && sale.void_reason && <p className="text-gray-600">Void reason: {sale.void_reason}</p>}
        </div>
      </div>
      <Button variant="secondary" className="mt-3" onClick={onPrint}>
        Print receipt
      </Button>
    </div>
  );
};

export default Receipt;

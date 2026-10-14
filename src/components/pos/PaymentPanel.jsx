import React from 'react';
import { Button, Input } from '@/components/ui';
import { formatCents, parseMoney } from '../../utils/money';

const NOTES = [500, 1000, 2000, 5000];

/**
 * Takes payment for `totalCents`. Cash needs an amount tendered and shows the change; card charges
 * the total. Calls `onCharge({payment_method, amount_tendered?})`; the page does the posting.
 */
const PaymentPanel = ({ totalCents, onCharge, submitting = false, disabled = false }) => {
  const [method, setMethod] = React.useState('cash');
  const [tendered, setTendered] = React.useState('');

  React.useEffect(() => {
    if (totalCents === 0) setTendered('');
  }, [totalCents]);

  const tenderedCents = parseMoney(tendered);
  const cash = method === 'cash';
  const short = cash && (tenderedCents === null || tenderedCents < totalCents);
  const canCharge = !disabled && !submitting && totalCents > 0 && !short;
  const quickAmounts = [totalCents, ...NOTES.filter((n) => n > totalCents)].filter((n) => n > 0);

  const handleCharge = () => {
    if (!canCharge) return;
    onCharge(
      cash ? { payment_method: 'cash', amount_tendered: (tenderedCents / 100).toFixed(2) } : { payment_method: 'card' }
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Payment method">
        {['cash', 'card'].map((value) => (
          <Button
            key={value}
            variant={method === value ? 'primary' : 'secondary'}
            aria-pressed={method === value}
            onClick={() => setMethod(value)}
          >
            {value === 'cash' ? 'Cash' : 'Card'}
          </Button>
        ))}
      </div>

      {cash && (
        <div className="space-y-2">
          <label htmlFor="cashTendered" className="block text-sm font-medium">
            Cash tendered
          </label>
          <Input
            id="cashTendered"
            inputMode="decimal"
            placeholder="0.00"
            value={tendered}
            onChange={(e) => setTendered(e.target.value)}
          />
          {totalCents > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((cents, index) => (
                <Button
                  key={cents}
                  variant="secondary"
                  className="px-3 py-1"
                  onClick={() => setTendered((cents / 100).toFixed(2))}
                >
                  {index === 0 ? 'Exact' : formatCents(cents)}
                </Button>
              ))}
            </div>
          )}
          {tenderedCents !== null && totalCents > 0 && (
            <p className={`text-sm ${short ? 'text-red-600' : 'text-gray-800'}`} data-testid="change">
              {short
                ? `Short by ${formatCents(totalCents - tenderedCents)}`
                : `Change due ${formatCents(tenderedCents - totalCents)}`}
            </p>
          )}
        </div>
      )}

      <Button className="w-full py-3 text-base" disabled={!canCharge} onClick={handleCharge}>
        {submitting ? 'Charging…' : `Charge ${formatCents(totalCents)}`}
      </Button>
    </div>
  );
};

export default PaymentPanel;

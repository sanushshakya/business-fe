import React from 'react';
import { Button, Input } from '@/components/ui';
import { formatMoney } from '../../utils/money';

const MESSAGES = {
  loading: 'Looking up card…',
  not_found: 'Card not recognised',
  unavailable: 'Loyalty unavailable — sale will go through without points',
};

/**
 * The customer's storefront loyalty card for the current sale. A scanner types the digits and then Enter,
 * which calls `onScan(barcode)`; the page does the lookup and passes back `value` (the customer, when
 * `status` is "found") and `status`: idle | loading | found | not_found | unavailable | error (with `message`).
 */
const LoyaltyCard = ({ value, status, message, onScan, onClear }) => {
  const [code, setCode] = React.useState('');

  if (status === 'found' && value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md bg-green-50 p-3 text-sm">
        <div>
          <p className="font-semibold">{value.first_name}</p>
          <p className="text-gray-700">
            {value.points_balance} points ({formatMoney(value.points_gbp_value)}) · {value.tier}
          </p>
        </div>
        <Button variant="secondary" className="px-3 py-1" aria-label="Remove card" onClick={onClear}>
          Remove
        </Button>
      </div>
    );
  }

  const note = status === 'error' ? message : MESSAGES[status];
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const barcode = code.trim();
    if (!barcode) return;
    onScan(barcode);
    setCode('');
  };

  return (
    <div className="space-y-1">
      <label htmlFor="loyaltyCard" className="block text-sm font-medium">
        Loyalty card
      </label>
      <Input
        id="loyaltyCard"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Scan or type the card number"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {note && (
        <p role="status" className={`text-sm ${status === 'loading' ? 'text-gray-500' : 'text-amber-700'}`}>
          {note}
        </p>
      )}
    </div>
  );
};

export default LoyaltyCard;

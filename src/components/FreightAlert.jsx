import React from 'react';
import { Button } from '@/components/ui';

/**
 * A freight-rate alert as returned by /logistics/freight-alerts/. A rising rate is bad news (red).
 */
const FreightAlert = ({ alert, onDismiss }) => {
  const change = Number(alert.change_percent);
  const color = change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500';

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
      <div>
        <p className="font-semibold">{alert.shipping_lane}</p>
        <p className="text-sm text-gray-600">
          £{Number(alert.baseline_rate).toFixed(2)} → £{Number(alert.current_rate).toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className={color}>
          {change > 0 ? '+' : ''}
          {change.toFixed(1)}%
        </p>
        {onDismiss && (
          <Button variant="secondary" onClick={() => onDismiss(alert)}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
};

export default FreightAlert;

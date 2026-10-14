import React from 'react';
import { Badge, Button } from '@/components/ui';

/**
 * A branch's request for more stock, as returned by /common/api/alerts/demand/.
 */
const DemandAlert = ({ alert, onDismiss }) => (
  <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
    <div>
      <p className="font-semibold">{alert.product}</p>
      <p className="text-sm text-gray-600">
        {alert.branch} · {new Date(alert.created_at).toLocaleDateString()}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <p>{alert.requested_qty} requested</p>
      {alert.is_handled ? (
        <Badge>Handled</Badge>
      ) : (
        onDismiss && (
          <Button variant="secondary" onClick={() => onDismiss(alert)}>
            Dismiss
          </Button>
        )
      )}
    </div>
  </div>
);

export default DemandAlert;

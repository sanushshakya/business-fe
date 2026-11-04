import React from 'react';
import { Badge, Button, Card, Input } from '@/components/ui';
import { formatMoney } from '../../utils/money';

const time = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * Sales this till made offline that are waiting to be sent (G27). Reprint shows the receipt again; Void needs a
 * reason and keeps the sale, marked voided (G28 sends the sale, then the void). As online, only the cashier who made
 * a sale, or staff, may void it (`me`: `{id, is_staff}`).
 */
const OfflineQueue = ({ sales = [], me = {}, onVoid, onReprint, onRetry }) => {
  const mayVoid = (sale) => Boolean(me.is_staff) || (me.id != null && sale.cashier === me.id);
  const [voiding, setVoiding] = React.useState(null);
  const [reason, setReason] = React.useState('');
  if (!sales.length) return null;
  return (
    <Card className="space-y-2" aria-label="Offline sales">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Waiting to send ({sales.length})</h3>
        {onRetry && sales.some((sale) => sale.error) && (
          <Button variant="secondary" className="px-3 py-1" onClick={onRetry}>
            Retry sending
          </Button>
        )}
      </div>
      <ul className="divide-y divide-gray-100 text-sm">
        {sales.map((sale) => (
          <li key={sale.client_ref} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              <span className="font-medium">{sale.offline_number}</span>{' '}
              <span className="text-gray-600">· {time(sale.created_at)}</span>
            </span>
            <span className="flex items-center gap-2">
              <span>{formatMoney(sale.receipt?.total ?? '0')}</span>
              {sale.status === 'voided' ? (
                <Badge color="gray">Voided</Badge>
              ) : (
                voiding !== sale.client_ref &&
                mayVoid(sale) && (
                  <Button
                    variant="secondary"
                    className="px-3 py-1"
                    onClick={() => {
                      setVoiding(sale.client_ref);
                      setReason('');
                    }}
                  >
                    Void
                  </Button>
                )
              )}
              <Button variant="secondary" className="px-3 py-1" onClick={() => onReprint(sale)}>
                Reprint
              </Button>
            </span>
            {sale.error && <span className="w-full text-xs text-red-600">Not sent: {sale.error}</span>}
            {voiding === sale.client_ref && (
              <span className="flex w-full items-center gap-2">
                <Input
                  aria-label={`Why void ${sale.offline_number}?`}
                  maxLength={255}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  variant="danger"
                  disabled={!reason.trim()}
                  onClick={() => {
                    onVoid(sale, reason.trim());
                    setVoiding(null);
                  }}
                >
                  Confirm void
                </Button>
                <Button variant="secondary" onClick={() => setVoiding(null)}>
                  Keep
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default OfflineQueue;

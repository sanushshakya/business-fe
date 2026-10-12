import React from 'react';
import { Badge, Card } from '@/components/ui';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';

/**
 * Undismissed low-stock alerts, with product names joined from the inventory list.
 */
const StockAlertsPage = () => {
  const alerts = useApiList('/common/api/alerts/stock/');
  const products = useApiList('/inventory/products/');
  const names = new Map((products.data || []).map((p) => [p.id, p.name]));

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Stock alerts</h2>
      <QueryState query={alerts} emptyMessage="No low-stock alerts. Everything is above its reorder threshold.">
        {(items) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((alert) => (
              <Card key={alert.id}>
                <h3 className="font-semibold">{names.get(alert.product) ?? `Product #${alert.product}`}</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {alert.current_qty} left (reorder at {alert.threshold})
                </p>
                <Badge color={alert.current_qty === 0 ? 'red' : 'yellow'} className="mt-2">
                  {alert.current_qty === 0 ? 'Out of stock' : 'Low stock'}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </section>
  );
};

export default StockAlertsPage;

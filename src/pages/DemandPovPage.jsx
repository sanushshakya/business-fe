import React from 'react';
import { Badge, Card } from '@/components/ui';
import KPICard from '../components/KPICard';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';
import DemandAlertsPage from './DemandAlertsPage';

/**
 * The demand planner's view: what branches are asking for, which events are coming and what is running low.
 */
const DemandPovPage = () => {
  const demandAlerts = useApiList('/common/api/alerts/demand/');
  const upcoming = useApiList('/calendar/upcoming/');
  const stockAlerts = useApiList('/common/api/alerts/stock/');
  const products = useApiList('/inventory/products/');
  const names = new Map((products.data || []).map((p) => [p.id, p.name]));
  const eventCount = (upcoming.data || []).reduce((sum, month) => sum + month.events.length, 0);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Demand overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Open demand alerts" value={demandAlerts.data?.length ?? '—'} />
        <KPICard title="Events in the next 90 days" value={upcoming.isSuccess ? eventCount : '—'} />
        <KPICard title="Products low on stock" value={stockAlerts.data?.length ?? '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold">Coming up</h3>
          <QueryState query={upcoming} emptyMessage="No events in the next 90 days.">
            {(months) => (
              <div className="space-y-3">
                {months.map((month) => (
                  <Card key={month.month}>
                    <h4 className="mb-2 text-sm font-semibold text-gray-600">{month.month}</h4>
                    <ul className="space-y-2">
                      {month.events.map((event) => (
                        <li key={event.id} className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <p className="font-medium">{event.name}</p>
                            <p className="text-gray-600">{event.date_range}</p>
                            {event.product_categories.length > 0 && (
                              <p className="text-xs text-gray-500">{event.product_categories.join(', ')}</p>
                            )}
                          </div>
                          <Badge color="blue">×{Number(event.demand_multiplier)} demand</Badge>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            )}
          </QueryState>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Running low</h3>
          <QueryState query={stockAlerts} emptyMessage="Nothing is below its reorder level.">
            {(items) => (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {items.slice(0, 10).map((alert) => (
                  <li key={alert.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span>{names.get(alert.product) ?? `Product #${alert.product}`}</span>
                    <Badge color={alert.current_qty === 0 ? 'red' : 'yellow'}>
                      {alert.current_qty === 0 ? 'Out' : `${alert.current_qty} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </div>
      </div>

      <DemandAlertsPage />
    </section>
  );
};

export default DemandPovPage;

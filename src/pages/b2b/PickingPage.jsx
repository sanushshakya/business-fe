import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import usePagedList from '../../hooks/usePagedList';

/** Orders to pick (G46b): confirmed or being picked, by delivery date. */
const PickingPage = () => {
  const confirmed = usePagedList('/wholesale/orders/', { params: { status: 'confirmed' }, pageSize: 100 });
  const picking = usePagedList('/wholesale/orders/', { params: { status: 'picking' }, pageSize: 100 });
  const rows = [...(picking.data?.results ?? []), ...(confirmed.data?.results ?? [])].sort(
    (a, b) => a.delivery_date.localeCompare(b.delivery_date) || a.id - b.id
  );
  const query = { ...confirmed, isLoading: confirmed.isLoading || picking.isLoading, data: rows };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Picking</h2>
      <QueryState
        query={query}
        empty={<EmptyState title="Nothing to pick" description="Confirmed orders show up here." />}
      >
        {(orders) => (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/dashboard/b2b/picking/${order.id}`}
                  className="flex items-center justify-between rounded border p-4 text-lg hover:bg-gray-50"
                >
                  <span>
                    <span className="font-mono">{order.number_display}</span> · {order.customer_name}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    {order.delivery_date}
                    <Badge color={order.status === 'picking' ? 'yellow' : 'blue'}>{order.status}</Badge>
                    {order.is_short && <span className="text-red-600">short</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </section>
  );
};

export default PickingPage;

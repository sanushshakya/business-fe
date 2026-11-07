import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import useApiList from '../../hooks/useApiList';
import usePagedList from '../../hooks/usePagedList';
import { formatMoney } from '../../utils/money';

const STATUSES = ['draft', 'confirmed', 'picking', 'picked', 'dispatched', 'delivered', 'invoiced', 'cancelled'];

/** Trade orders (G40): filter by status and customer; open one, or take a new one from the keyboard. */
const OrdersPage = () => {
  const [status, setStatus] = React.useState('');
  const [customer, setCustomer] = React.useState('');
  const customers = useApiList('/wholesale/customers/');
  const orders = usePagedList('/wholesale/orders/', {
    params: { ...(status ? { status } : {}), ...(customer ? { customer } : {}) },
    pageSize: 50,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Trade orders</h2>
        <div className="flex gap-2">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select aria-label="Customer" value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-56">
            <option value="">All customers</option>
            {(customers.data ?? []).map((option) => (
              <option key={option.id} value={option.id}>
                {option.account_code} {option.trading_name || option.legal_name}
              </option>
            ))}
          </Select>
          <Link
            to="/dashboard/b2b/orders/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            New order
          </Link>
        </div>
      </div>
      <QueryState
        query={{ ...orders, data: orders.data?.results }}
        empty={<EmptyState title="No trade orders" description="Take a phone order with New order." />}
      >
        {(rows) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Delivery</Th>
                <Th>Status</Th>
                <Th>Estimated</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((order) => (
                <Tr key={order.id}>
                  <Td>
                    <Link to={`/dashboard/b2b/orders/${order.id}`} className="font-mono text-primary underline">
                      {order.number_display}
                    </Link>
                  </Td>
                  <Td>
                    {order.customer_code} {order.customer_name}
                  </Td>
                  <Td>{order.delivery_date}</Td>
                  <Td>
                    <Badge color={order.status === 'cancelled' ? 'gray' : 'blue'}>{order.status}</Badge>
                    {order.is_short && <span className="ml-2 text-xs text-red-600">short</span>}
                  </Td>
                  <Td>{order.estimated_gross ? formatMoney(order.estimated_gross) : '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
    </section>
  );
};

export default OrdersPage;

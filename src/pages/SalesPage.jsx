import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { formatMoney } from '../utils/money';
import { Badge, Button, Input, Modal, Option, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import Receipt from '../components/pos/Receipt';
import QueryState from '../components/QueryState';
import usePagedList from '../hooks/usePagedList';

const SALES = '/sales/sales/';
const SESSIONS = '/sales/sessions/';

const time = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const Pager = ({ page, onPage, count, pageSize }) => {
  const pages = Math.max(Math.ceil(count / pageSize), 1);
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">
        {count} total · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

const SalesTab = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('');
  const [method, setMethod] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [reason, setReason] = React.useState('');

  const params = {};
  if (status) params.status = status;
  if (method) params.payment_method = method;
  const sales = usePagedList(SALES, { page, params });

  const voidSale = useMutation({
    mutationFn: ({ id, reason: why }) => axios.post(`${SALES}${id}/void/`, { reason: why }).then((r) => r.data),
    onSuccess: (sale) => {
      setSelected(sale);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['list', SALES] });
      queryClient.invalidateQueries({ queryKey: ['list', SESSIONS] });
      queryClient.invalidateQueries({ queryKey: ['list', '/inventory/products/'] });
    },
  });

  const close = () => {
    setSelected(null);
    setReason('');
    voidSale.reset();
  };

  const filterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select aria-label="Status" value={status} onChange={filterChange(setStatus)} className="w-40">
          <Option value="">All statuses</Option>
          <Option value="completed">Completed</Option>
          <Option value="voided">Voided</Option>
        </Select>
        <Select aria-label="Payment method" value={method} onChange={filterChange(setMethod)} className="w-40">
          <Option value="">Cash and card</Option>
          <Option value="cash">Cash</Option>
          <Option value="card">Card</Option>
        </Select>
      </div>
      <QueryState
        query={{ ...sales, data: sales.data?.results }}
        emptyMessage="No sales yet. Ring one up on the Till page."
      >
        {(rows) => (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Receipt</Th>
                  <Th>Time</Th>
                  <Th>Till</Th>
                  <Th>Cashier</Th>
                  <Th>Payment</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((sale) => (
                  <Tr key={sale.id}>
                    <Td>{sale.receipt_number}</Td>
                    <Td>{time(sale.created_at)}</Td>
                    <Td>
                      {sale.branch_name} – {sale.till_number}
                    </Td>
                    <Td>{sale.cashier_name ?? sale.cashier_email}</Td>
                    <Td>{sale.payment_method === 'cash' ? 'Cash' : 'Card'}</Td>
                    <Td>{formatMoney(sale.total)}</Td>
                    <Td>
                      <Badge color={sale.status === 'voided' ? 'red' : 'green'}>
                        {sale.status === 'voided' ? 'Voided' : 'Completed'}
                      </Badge>
                    </Td>
                    <Td>
                      <Button variant="secondary" className="px-2 py-1" onClick={() => setSelected(sale)}>
                        View {sale.receipt_number}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pager page={page} onPage={setPage} count={sales.data.count} pageSize={20} />
          </>
        )}
      </QueryState>

      <Modal open={Boolean(selected)} onClose={close} title="Sale">
        {selected && (
          <div className="space-y-4">
            <Receipt sale={selected} />
            {selected.status === 'completed' && (
              <div className="space-y-2 border-t border-gray-200 pt-3">
                <label htmlFor="voidReason" className="block text-sm font-medium">
                  Void reason (optional)
                </label>
                <Input id="voidReason" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
                <Button
                  variant="danger"
                  disabled={voidSale.isLoading}
                  onClick={() => voidSale.mutate({ id: selected.id, reason: reason.trim() })}
                >
                  {voidSale.isLoading ? 'Voiding…' : 'Void sale'}
                </Button>
                {voidSale.isError && (
                  <p role="alert" className="text-sm text-red-600">
                    {apiErrorMessage(voidSale.error, 'Could not void the sale.')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const ShiftsTab = () => {
  const [page, setPage] = React.useState(1);
  const sessions = usePagedList(SESSIONS, { page });

  return (
    <QueryState query={{ ...sessions, data: sessions.data?.results }} emptyMessage="No till sessions yet.">
      {(rows) => (
        <div className="space-y-4">
          <Table>
            <Thead>
              <Tr>
                <Th>Till</Th>
                <Th>Opened</Th>
                <Th>Closed</Th>
                <Th>Float</Th>
                <Th>Sales</Th>
                <Th>Expected cash</Th>
                <Th>Counted</Th>
                <Th>Variance</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((s) => {
                const variance = s.summary.variance === null ? null : Number(s.summary.variance);
                return (
                  <Tr key={s.id}>
                    <Td>
                      {s.branch_name} – {s.till_number}
                    </Td>
                    <Td>
                      {time(s.opened_at)}
                      <span className="block text-xs text-gray-500">{s.opened_by_name ?? s.opened_by_email}</span>
                    </Td>
                    <Td>{s.is_open ? <Badge color="green">Open</Badge> : time(s.closed_at)}</Td>
                    <Td>{formatMoney(s.opening_float)}</Td>
                    <Td>
                      {s.summary.sales_count} · {formatMoney(s.summary.sales_total)}
                    </Td>
                    <Td>{formatMoney(s.summary.expected_cash)}</Td>
                    <Td>{s.counted_cash === null ? '—' : formatMoney(s.counted_cash)}</Td>
                    <Td className={variance ? 'text-red-600' : ''}>
                      {variance === null
                        ? '—'
                        : variance === 0
                          ? 'Balanced'
                          : `${variance > 0 ? '+' : '−'}${formatMoney(Math.abs(variance))}`}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <Pager page={page} onPage={setPage} count={sessions.data.count} pageSize={20} />
        </div>
      )}
    </QueryState>
  );
};

const SalesPage = () => {
  const [tab, setTab] = React.useState('sales');
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Sales</h2>
      <div className="flex gap-2" role="tablist">
        {[
          ['sales', 'Sales'],
          ['shifts', 'Till sessions'],
        ].map(([id, label]) => (
          <Button
            key={id}
            role="tab"
            aria-selected={tab === id}
            variant={tab === id ? 'primary' : 'secondary'}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === 'sales' ? <SalesTab /> : <ShiftsTab />}
    </section>
  );
};

export default SalesPage;

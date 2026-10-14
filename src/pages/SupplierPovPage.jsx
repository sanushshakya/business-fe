import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { formatMoney } from '../utils/money';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import KPICard from '../components/KPICard';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';
import SuppliersListPage from './SuppliersListPage';

const INVOICES = '/pricing/invoices/';
const STATUS_COLORS = { paid: 'green', pending: 'yellow', overdue: 'red' };

const isOverdue = (invoice, today) =>
  invoice.payment_status === 'overdue' ||
  (invoice.payment_status === 'pending' && invoice.due_date && invoice.due_date < today);

/**
 * The supplier manager's view: who we buy from, what we owe, and the alternatives if a supplier lets us down.
 */
const SupplierPovPage = () => {
  const queryClient = useQueryClient();
  const suppliers = useApiList('/logistics/suppliers/');
  const alternatives = useApiList('/logistics/alternative-suppliers/');
  const invoices = useApiList(INVOICES);
  const invoiceSuppliers = useApiList('/inventory/suppliers/');
  const names = new Map((invoiceSuppliers.data || []).map((s) => [s.id, s.name]));
  const today = new Date().toISOString().slice(0, 10);

  const markPaid = useMutation({
    mutationFn: (invoice) => axios.patch(`${INVOICES}${invoice.id}/`, { payment_status: 'paid' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', INVOICES] }),
  });

  const unpaid = (invoices.data || []).filter((i) => i.payment_status !== 'paid');
  const overdue = unpaid.filter((i) => isOverdue(i, today));
  const owed = unpaid.reduce((sum, i) => sum + Math.round(Number(i.total_amount) * 100), 0) / 100;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Supplier overview</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Suppliers" value={suppliers.data?.length ?? '—'} />
        <KPICard title="Alternatives on file" value={alternatives.data?.length ?? '—'} />
        <KPICard title="Owed (unpaid invoices)" value={invoices.isSuccess ? formatMoney(owed) : '—'} />
        <KPICard title="Overdue invoices" value={invoices.isSuccess ? overdue.length : '—'} />
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Invoices</h3>
        {markPaid.isError && (
          <p role="alert" className="mb-2 text-sm text-red-600">
            {apiErrorMessage(markPaid.error, 'Could not update the invoice.')}
          </p>
        )}
        <QueryState query={invoices} emptyMessage="No invoices yet.">
          {(items) => (
            <Table>
              <Thead>
                <Tr>
                  <Th>Invoice</Th>
                  <Th>Supplier</Th>
                  <Th>Amount</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {items.map((invoice) => {
                  const late = isOverdue(invoice, today);
                  const status = late ? 'overdue' : invoice.payment_status;
                  return (
                    <Tr key={invoice.id}>
                      <Td>{invoice.invoice_number}</Td>
                      <Td>{names.get(invoice.supplier) ?? `Supplier #${invoice.supplier}`}</Td>
                      <Td>{formatMoney(invoice.total_amount)}</Td>
                      <Td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</Td>
                      <Td>
                        <Badge color={STATUS_COLORS[status] || 'gray'}>{status}</Badge>
                      </Td>
                      <Td>
                        {invoice.payment_status !== 'paid' && (
                          <Button
                            variant="secondary"
                            className="px-2 py-1"
                            disabled={markPaid.isLoading}
                            onClick={() => markPaid.mutate(invoice)}
                          >
                            Mark {invoice.invoice_number} paid
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </QueryState>
      </div>

      <SuppliersListPage />
    </section>
  );
};

export default SupplierPovPage;

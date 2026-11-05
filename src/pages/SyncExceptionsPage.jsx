import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { formatMoney } from '../utils/money';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import usePagedList from '../hooks/usePagedList';

const URL = '/sales/exceptions/';
const KINDS = [
  ['', 'All kinds'],
  ['price', 'Price differs'],
  ['stock', 'Not enough stock'],
  ['label', 'Label not readable as sold'],
  ['product_changed', 'Product changed since the sale'],
  ['weight_limit', 'Typed weight over the limit'],
  ['tender', 'Cash tendered below the total'],
  ['session_closed', 'Session already closed'],
  ['cashier', 'Cashier not found'],
];

/** What differed, in a few words. */
const what = (row) => {
  if (row.expected != null && row.charged != null) {
    return row.kind === 'tender'
      ? `Total ${formatMoney(row.charged)}, cash ${formatMoney(row.expected)}`
      : `Charged ${formatMoney(row.charged)}, price ${formatMoney(row.expected)}`;
  }
  if (row.kind === 'stock') return row.weight_kg ? `${row.weight_kg} kg short` : `${row.quantity} short`;
  return row.detail;
};

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '');

/**
 * Offline sales that didn't match the server when they were synced (G28): the sales stand (they were paid); a
 * manager looks at each difference — a price, stock short, an unreadable label, a closed session... — and marks it
 * handled (G29). Staff only.
 */
const SyncExceptionsPage = () => {
  const queryClient = useQueryClient();
  const [resolved, setResolved] = React.useState('');
  const [kind, setKind] = React.useState('');
  const params = { ...(resolved ? { resolved } : {}), ...(kind ? { kind } : {}) };
  const rows = usePagedList(URL, { params, pageSize: 50 });
  const resolve = useMutation({
    mutationFn: (row) => axios.post(`${URL}${row.id}/resolve/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', URL] }),
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Sync exceptions</h2>
        <div className="flex gap-2">
          <Select aria-label="Show" value={resolved} onChange={(e) => setResolved(e.target.value)} className="w-40">
            <option value="">To review</option>
            <option value="true">Handled</option>
          </Select>
          <Select aria-label="Kind" value={kind} onChange={(e) => setKind(e.target.value)} className="w-64">
            {KINDS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        Offline sales stand as they were paid. Each row is something the server saw differently when the sale was sent.
      </p>
      {resolve.isError && (
        <p role="alert" className="text-sm text-red-600">
          {apiErrorMessage(resolve.error, 'Could not mark it handled.')}
        </p>
      )}
      <QueryState
        query={{ ...rows, data: rows.data?.results }}
        emptyMessage={null}
        empty={<EmptyState title="Nothing to review" description="Offline sales that differed will show up here." />}
      >
        {(items) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Kind</Th>
                <Th>Sale</Th>
                <Th>Offline receipt</Th>
                <Th>Sold</Th>
                <Th>Product</Th>
                <Th>What</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td>{row.kind_label}</Td>
                  <Td>{row.receipt_number}</Td>
                  <Td>{row.offline_number}</Td>
                  <Td>{when(row.sold_at)}</Td>
                  <Td>{row.product_name}</Td>
                  <Td>{what(row)}</Td>
                  <Td>
                    {row.resolved_at ? (
                      <span className="text-xs text-gray-500">
                        Handled {when(row.resolved_at)}
                        {row.resolved_by_name ? ` by ${row.resolved_by_name}` : ''}
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        className="px-3 py-1"
                        disabled={resolve.isLoading}
                        onClick={() => resolve.mutate(row)}
                      >
                        Mark handled
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
    </section>
  );
};

export default SyncExceptionsPage;

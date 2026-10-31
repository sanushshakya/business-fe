import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Select } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import ReceiveTransferForm from '../components/stock/ReceiveTransferForm';
import TransferForm from '../components/stock/TransferForm';
import TransferTable from '../components/stock/TransferTable';
import useApiList from '../hooks/useApiList';

const TRANSFERS = '/inventory/transfers/';
const STATUSES = [
  ['', 'All statuses'],
  ['draft', 'Draft'],
  ['dispatched', 'Dispatched'],
  ['received', 'Received'],
  ['cancelled', 'Cancelled'],
];

/** Stock moved between the company's locations: create a draft, dispatch it, receive it at the other end. */
const TransfersPage = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState('');
  const transfers = useApiList(status ? `${TRANSFERS}?status=${status}` : TRANSFERS);
  const locations = useApiList('/inventory/locations/');
  const products = useApiList('/inventory/products/');
  const [creating, setCreating] = React.useState(false);
  const [receiving, setReceiving] = React.useState(null);
  const [error, setError] = React.useState(null);

  const run = useMutation({
    mutationFn: ({ url, body }) => (body === undefined ? axios.post(url) : axios.post(url, body)),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not save the transfer.')),
  });

  const create = async (body) => {
    await run.mutateAsync({ url: TRANSFERS, body });
    setCreating(false);
  };
  const step = (transfer, action, body) => run.mutateAsync({ url: `${TRANSFERS}${transfer.id}/${action}/`, body });
  const receive = async (body) => {
    await step(receiving, 'receive', body);
    setReceiving(null);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Transfers</h2>
        <div className="flex items-center gap-2">
          <Select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-44">
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button onClick={() => setCreating(true)}>New transfer</Button>
        </div>
      </div>
      {error && !creating && !receiving && (
        <p role="alert" className="mb-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <QueryState
        query={transfers}
        emptyMessage={null}
        empty={<EmptyState title="No transfers" description="Transfers you create will show up here." />}
      >
        {(items) => (
          <TransferTable
            transfers={items}
            locations={locations.data}
            products={products.data}
            busy={run.isLoading}
            onDispatch={(transfer) => step(transfer, 'dispatch').catch(() => {})}
            onCancel={(transfer) => step(transfer, 'cancel').catch(() => {})}
            onReceive={(transfer) => {
              setError(null);
              setReceiving(transfer);
            }}
          />
        )}
      </QueryState>
      <Modal open={creating} onClose={() => setCreating(false)} title="New transfer">
        <TransferForm locations={locations.data} products={products.data} onSubmit={create} submitting={run.isLoading} />
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </Modal>
      <Modal open={Boolean(receiving)} onClose={() => setReceiving(null)} title={receiving ? `Receive ${receiving.reference}` : ''}>
        {receiving && (
          <ReceiveTransferForm transfer={receiving} products={products.data} onSubmit={receive} submitting={run.isLoading} />
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </Modal>
    </section>
  );
};

export default TransfersPage;

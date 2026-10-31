import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Select } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import FulfilForm from '../components/stock/FulfilForm';
import RequisitionForm from '../components/stock/RequisitionForm';
import RequisitionTable from '../components/stock/RequisitionTable';
import useApiList from '../hooks/useApiList';

const REQUISITIONS = '/inventory/requisitions/';
const STATUSES = [
  ['', 'All statuses'],
  ['open', 'Open'],
  ['partly_fulfilled', 'Partly fulfilled'],
  ['fulfilled', 'Fulfilled'],
  ['cancelled', 'Cancelled'],
];

/** Stores ask for stock; the warehouse fulfils (in parts if need be) by making draft transfers. */
const RequisitionsPage = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState('');
  const requisitions = useApiList(status ? `${REQUISITIONS}?status=${status}` : REQUISITIONS);
  const locations = useApiList('/inventory/locations/');
  const products = useApiList('/inventory/products/');
  const transfers = useApiList('/inventory/transfers/');
  const [creating, setCreating] = React.useState(false);
  const [fulfilling, setFulfilling] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);

  const transferReferences = React.useMemo(
    () => Object.fromEntries((transfers.data || []).map((transfer) => [transfer.id, transfer.reference])),
    [transfers.data]
  );

  const save = useMutation({
    mutationFn: ({ url, body }) => axios.post(url, body),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not save the requisition.')),
  });

  const create = async (body) => {
    await save.mutateAsync({ url: REQUISITIONS, body });
    setCreating(false);
  };
  const fulfil = async (body) => {
    const { data } = await save.mutateAsync({ url: `${REQUISITIONS}${fulfilling.id}/fulfil/`, body });
    setFulfilling(null);
    setNotice(`Draft ${data.reference} made. Dispatch it on Transfers.`);
  };
  const open = (setter) => (value) => {
    setError(null);
    setNotice(null);
    setter(value);
  };

  const errorLine = error && (
    <p role="alert" className="mt-2 text-sm text-red-600">
      {error}
    </p>
  );

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Requisitions</h2>
        <div className="flex items-center gap-2">
          <Select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-44">
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button onClick={() => open(setCreating)(true)}>New requisition</Button>
        </div>
      </div>
      {notice && (
        <p role="status" className="mb-2 text-sm text-gray-700">
          {notice}
        </p>
      )}
      <QueryState
        query={requisitions}
        emptyMessage={null}
        empty={<EmptyState title="No requisitions" description="Requisitions raised by stores will show up here." />}
      >
        {(items) => (
          <RequisitionTable
            requisitions={items}
            locations={locations.data}
            products={products.data}
            transferReferences={transferReferences}
            busy={save.isLoading}
            onFulfil={open(setFulfilling)}
          />
        )}
      </QueryState>
      <Modal open={creating} onClose={() => setCreating(false)} title="New requisition">
        <RequisitionForm locations={locations.data} products={products.data} onSubmit={create} submitting={save.isLoading} />
        {errorLine}
      </Modal>
      <Modal open={Boolean(fulfilling)} onClose={() => setFulfilling(null)} title={fulfilling ? `Fulfil ${fulfilling.reference}` : ''}>
        {fulfilling && (
          <FulfilForm
            requisition={fulfilling}
            locations={locations.data}
            products={products.data}
            onSubmit={fulfil}
            submitting={save.isLoading}
          />
        )}
        {errorLine}
      </Modal>
    </section>
  );
};

export default RequisitionsPage;

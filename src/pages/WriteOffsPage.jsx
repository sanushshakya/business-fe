import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import WriteOffForm from '../components/butchery/WriteOffForm';
import WriteOffList from '../components/butchery/WriteOffList';
import { usableLocations } from '../components/stock/LocationSelect';
import useApiList from '../hooks/useApiList';
import useMe from '../hooks/useMe';
import usePagedList from '../hooks/usePagedList';

const WRITE_OFFS = '/inventory/write-offs/';
const STATUSES = [
  ['', 'All statuses'],
  ['pending', 'Waiting for approval'],
  ['written_off', 'Written off'],
  ['rejected', 'Rejected'],
];
const hasStock = (batch) => batch.quantity > 0 || Number(batch.weight_kg) > 0;

/** Waste write-offs (G23): raise one from a batch; staff approve or reject pending ones raised by someone else. */
const WriteOffsPage = () => {
  const queryClient = useQueryClient();
  const me = useMe();
  const locations = useApiList('/inventory/locations/');
  const products = useApiList('/inventory/products/');
  const real = usableLocations(locations.data);
  const [chosen, setChosen] = React.useState('');
  const location = chosen || (real.length === 1 ? real[0].id : '');
  const batches = useApiList(`/inventory/batches/?location=${location}`, { enabled: location !== '' });
  const [status, setStatus] = React.useState('');
  const writeOffs = usePagedList(WRITE_OFFS, { params: status ? { status } : {} });
  const [error, setError] = React.useState(null);

  const run = useMutation({
    mutationFn: ({ url, body }) => axios.post(url, body),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not save the write-off.')),
  });

  const raise = async (body) => (await run.mutateAsync({ url: WRITE_OFFS, body })).data;
  const decide = (writeOff, step) =>
    run.mutateAsync({ url: `${WRITE_OFFS}${writeOff.id}/${step}/`, body: {} }).catch(() => {});

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Write-offs</h2>
      <WriteOffForm
        locations={locations.data ?? []}
        location={location}
        onLocationChange={setChosen}
        batches={(batches.data ?? []).filter(hasStock)}
        products={products.data ?? []}
        onSubmit={raise}
        submitting={run.isLoading}
        error={error}
      />
      <div className="flex justify-end">
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-56">
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <QueryState
        query={{ ...writeOffs, data: writeOffs.data?.results }}
        emptyMessage={null}
        empty={<EmptyState title="No write-offs" description="Write-offs will show up here." />}
      >
        {(rows) => <WriteOffList writeOffs={rows} me={me.data ?? {}} onDecide={decide} busy={run.isLoading} />}
      </QueryState>
    </section>
  );
};

export default WriteOffsPage;

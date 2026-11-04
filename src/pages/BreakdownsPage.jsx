import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import BreakdownForm from '../components/butchery/BreakdownForm';
import BreakdownList from '../components/butchery/BreakdownList';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import { usableLocations } from '../components/stock/LocationSelect';
import useApiList from '../hooks/useApiList';
import usePagedList from '../hooks/usePagedList';

const BREAKDOWNS = '/inventory/breakdowns/';
const hasStock = (batch) => batch.quantity > 0 || Number(batch.weight_kg) > 0;

/** Butchery breakdowns (G21) for staff and the stock role: record one from a batch, see and void recent ones. */
const BreakdownsPage = () => {
  const queryClient = useQueryClient();
  const locations = useApiList('/inventory/locations/');
  const templates = useApiList('/inventory/yield-templates/?active=true');
  const products = useApiList('/inventory/products/');
  const breakdowns = usePagedList(BREAKDOWNS);
  const butcheries = usableLocations(locations.data).filter((location) => location.type === 'butchery');
  const [chosen, setChosen] = React.useState('');
  const location = chosen || (butcheries.length === 1 ? butcheries[0].id : '');
  const batches = useApiList(`/inventory/batches/?location=${location}`, { enabled: location !== '' });
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);

  const run = useMutation({
    mutationFn: ({ url, body }) => axios.post(url, body),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not save the breakdown.')),
  });

  const record = async (body) => {
    setNotice(null);
    const { data } = await run.mutateAsync({ url: BREAKDOWNS, body });
    setNotice(`${data.reference} recorded.`);
  };
  const voidOne = (breakdown, reason) =>
    run.mutateAsync({ url: `${BREAKDOWNS}${breakdown.id}/void/`, body: { reason } }).then(
      () => setNotice(`${breakdown.reference} voided.`),
      () => {}
    );

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Breakdowns</h2>
      <BreakdownForm
        locations={butcheries}
        location={location}
        onLocationChange={setChosen}
        templates={templates.data ?? []}
        batches={(batches.data ?? []).filter(hasStock)}
        products={products.data ?? []}
        onSubmit={record}
        submitting={run.isLoading}
        error={error}
      />
      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}
      <QueryState
        query={{ ...breakdowns, data: breakdowns.data?.results }}
        emptyMessage={null}
        empty={<EmptyState title="No breakdowns" description="Breakdowns you record will show up here." />}
      >
        {(rows) => <BreakdownList breakdowns={rows} onVoid={voidOne} busy={run.isLoading} />}
      </QueryState>
    </section>
  );
};

export default BreakdownsPage;

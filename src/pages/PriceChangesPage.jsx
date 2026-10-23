import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import PendingPriceChanges from '../components/PendingPriceChanges';
import QueryState from '../components/QueryState';
import WasteReductionReport from '../components/WasteReductionReport';
import useApiList from '../hooks/useApiList';
import useMe from '../hooks/useMe';

const URL = '/pricing/price-changes/';
const PRODUCTS_URL = '/inventory/products/';

const PriceChangesPage = () => {
  const queryClient = useQueryClient();
  const logs = useApiList(URL);
  const products = useApiList(PRODUCTS_URL);
  const me = useMe();
  const names = Object.fromEntries((products.data || []).map((p) => [p.id, p.name]));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['list', URL] });
    queryClient.invalidateQueries({ queryKey: ['list', PRODUCTS_URL] }); // approval changes the product's price
  };
  const approve = useMutation({ mutationFn: (log) => axios.post(`${URL}${log.id}/approve/`), onSuccess: refresh });
  const reject = useMutation({ mutationFn: (log) => axios.delete(`${URL}${log.id}/`), onSuccess: refresh });
  const failed = approve.isError ? approve : reject.isError ? reject : null;
  const busyId = approve.isLoading ? approve.variables?.id : reject.isLoading ? reject.variables?.id : undefined;

  const decide = (mutation, other) => (log) => {
    other.reset();
    mutation.mutate(log);
  };

  return (
    <section className="space-y-8">
      <div>
        <h2 className="mb-1 text-xl font-semibold">Pending price changes</h2>
        <p className="mb-4 text-sm text-gray-500">
          A change takes effect, and reaches the online shop, only once it is approved.
        </p>
        {failed && (
          <p role="alert" className="mb-2 text-sm text-red-600">
            {apiErrorMessage(failed.error, 'Could not save the decision. Please try again.')}
          </p>
        )}
        <QueryState query={logs} emptyMessage="No price changes yet.">
          {(items) => (
            <PendingPriceChanges
              logs={items}
              productNames={names}
              canDecide={Boolean(me.data?.is_staff)}
              onApprove={decide(approve, reject)}
              onReject={decide(reject, approve)}
              busyId={busyId}
            />
          )}
        </QueryState>
      </div>
      <div>
        <h2 className="mb-4 text-xl font-semibold">Waste reduction</h2>
        <QueryState query={logs} emptyMessage="No price changes yet.">
          {(items) => <WasteReductionReport logs={items} productNames={names} />}
        </QueryState>
      </div>
    </section>
  );
};

export default PriceChangesPage;

import React from 'react';
import QueryState from '../components/QueryState';
import WasteReductionReport from '../components/WasteReductionReport';
import useApiList from '../hooks/useApiList';

const PriceChangesPage = () => {
  const logs = useApiList('/pricing/price-changes/');
  const products = useApiList('/inventory/products/');
  const names = Object.fromEntries((products.data || []).map((p) => [p.id, p.name]));

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Waste reduction</h2>
      <QueryState query={logs} emptyMessage="No price changes yet.">
        {(items) => <WasteReductionReport logs={items} productNames={names} />}
      </QueryState>
    </section>
  );
};

export default PriceChangesPage;

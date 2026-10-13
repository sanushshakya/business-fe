import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import AlternativeSupplierCarousel from '../components/AlternativeSupplierCarousel';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';

const SuppliersListPage = () => {
  const suppliers = useApiList('/logistics/suppliers/');
  const alternatives = useApiList('/logistics/alternative-suppliers/');

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Suppliers</h2>
      <QueryState query={suppliers} emptyMessage="No suppliers yet.">
        {(items) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Country</Th>
                <Th>Lead time</Th>
                <Th>Categories</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((s) => (
                <Tr key={s.id}>
                  <Td>{s.name}</Td>
                  <Td>{s.country_of_origin}</Td>
                  <Td>{s.lead_time_days} days</Td>
                  <Td>{(s.product_categories || []).join(', ')}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
      <div>
        <h3 className="mb-2 font-semibold">Alternative suppliers</h3>
        <AlternativeSupplierCarousel suppliers={alternatives.data || []} />
      </div>
    </section>
  );
};

export default SuppliersListPage;

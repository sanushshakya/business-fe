import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../utils/axios';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import StockReceiptModal from '../components/StockReceiptModal';
import useApiList from '../hooks/useApiList';

const InventoryListPage = () => {
  const queryClient = useQueryClient();
  const products = useApiList('/inventory/products/');
  const [receiving, setReceiving] = React.useState(false);

  const receive = useMutation({
    mutationFn: (payload) => axios.post('/inventory/batches/', payload),
    onSuccess: () => {
      setReceiving(false);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Inventory</h2>
        <Button onClick={() => setReceiving(true)}>Receive stock</Button>
      </div>
      <QueryState
        query={products}
        emptyMessage={null}
        empty={<EmptyState title="No products yet" description="Products you add will show up here." />}
      >
        {(items) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Product</Th>
                <Th>Price</Th>
                <Th>In stock</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((product) => (
                <Tr key={product.id}>
                  <Td>{product.name}</Td>
                  <Td>£{Number(product.price).toFixed(2)}</Td>
                  <Td>{product.stock_quantity}</Td>
                  <Td>
                    {product.stock_quantity <= product.reorder_threshold ? (
                      <Badge color="yellow">Reorder</Badge>
                    ) : (
                      <Badge color="green">OK</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
      <StockReceiptModal
        isOpen={receiving}
        onClose={() => setReceiving(false)}
        onSubmit={receive.mutateAsync}
        submitting={receive.isLoading}
      />
      {receive.isError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          Could not record the stock.
        </p>
      )}
    </section>
  );
};

export default InventoryListPage;

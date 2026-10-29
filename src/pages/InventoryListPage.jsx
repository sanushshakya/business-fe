import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../utils/axios';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import StockReceiptModal from '../components/StockReceiptModal';
import VatCodeSelect from '../components/VatCodeSelect';
import useApiList from '../hooks/useApiList';
import { useOffline } from '../offline/OfflineProvider';
import { isRejection } from '../utils/http';

const InventoryListPage = () => {
  const queryClient = useQueryClient();
  const products = useApiList('/inventory/products/');
  const { queueReceipt } = useOffline();
  const [receiving, setReceiving] = React.useState(false);
  const [notice, setNotice] = React.useState(null);

  const receive = useMutation({
    mutationFn: (payload) => axios.post('/inventory/batches/', payload),
    onSuccess: () => {
      setReceiving(false);
      setNotice(null);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
  });

  const changeVat = useMutation({
    mutationFn: ({ product, vatCode }) => axios.patch(`/inventory/products/${product.id}/`, { vat_code: vatCode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list'] }),
  });

  // Online: send it now. No connection (or the server is unreachable or failing): keep it on this device
  // and let the offline layer send it later. A server rejection (4xx) is a real error and goes back to the form.
  const submitReceipt = async (payload) => {
    if (navigator.onLine) {
      try {
        await receive.mutateAsync(payload);
        return;
      } catch (error) {
        if (isRejection(error)) throw error;
      }
    }
    await queueReceipt(payload);
    receive.reset(); // the failed attempt is now queued, so it is no longer an error
    setReceiving(false);
    setNotice('Saved on this device. It will be sent when you are back online.');
  };

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
                <Th>VAT</Th>
                <Th>In stock</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((product) => (
                <Tr key={product.id}>
                  <Td>{product.name}</Td>
                  <Td>£{Number(product.price).toFixed(2)}</Td>
                  <Td>
                    <VatCodeSelect
                      productName={product.name}
                      value={product.vat_code}
                      disabled={changeVat.isLoading}
                      onChange={(vatCode) => changeVat.mutate({ product, vatCode })}
                    />
                  </Td>
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
        onSubmit={submitReceipt}
        submitting={receive.isLoading}
      />
      {notice && (
        <p role="status" className="mt-2 text-sm text-gray-700">
          {notice}
        </p>
      )}
      {changeVat.isError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          Could not change the VAT code.
        </p>
      )}
      {receive.isError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          Could not record the stock.
        </p>
      )}
    </section>
  );
};

export default InventoryListPage;

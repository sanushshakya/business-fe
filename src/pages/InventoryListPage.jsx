import React from 'react';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';

const InventoryListPage = () => {
  const products = useApiList('/inventory/products/');

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Inventory</h2>
      <QueryState query={products} emptyMessage="No products yet.">
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
    </section>
  );
};

export default InventoryListPage;

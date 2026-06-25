// src/components/Table.jsx

import React, { useEffect, useState } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@shadcn/ui';
import { usePaginatedData } from './usePaginatedData'; // Custom hook for handling pagination and data fetching
import axios from '../utils/axios';

/**
 * InventoryTable component to display a paginated table of products.
 */
const InventoryTable = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom hook for fetching inventory data
  const { pageData, handlePageChange } = usePaginatedData('/api/inventory/stock/levels', setData, setIsLoading, setError);

  useEffect(() => {
    if (!pageData) return;

    // Fetching the initial data
    axios.get(pageData.url)
      .then(response => {
        setData(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        setError('Failed to fetch inventory data');
        setIsLoading(false);
      });
  }, [pageData]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>SKU</Th>
          <Th>Name</Th>
          <Th>Category</Th>
          <Th>Unit</Th>
          <Th>Stock Level</Th>
          <Th>Reorder Threshold</Th>
          <Th>Status</Th>
        </Tr>
      </Thead>
      <Tbody>
        {data.map(product => (
          <Tr key={product.sku}>
            <Td>{product.sku}</Td>
            <Td>{product.name}</Td>
            <Td>{product.category}</Td>
            <Td>{product.unit}</Td>
            <Td>{product.stockLevel}</Td>
            <Td>{product.reorderThreshold}</Td>
            <Td>
              {product.stockLevel <= product.reorderThreshold ? (
                <span className="bg-red-500 text-white px-2 py-1 rounded">LOW</span>
              ) : product.stockLevel === 0 ? (
                <span className="bg-gray-300 text-black px-2 py-1 rounded">OUT</span>
              ) : (
                <span className="bg-green-500 text-white px-2 py-1 rounded">OK</span>
              )}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default InventoryTable;
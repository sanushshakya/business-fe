// src/components/Inventory.jsx

import React, { useEffect, useState } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@shadcn/ui';
import axios from '@/utils/axios';
import useAuthStore from '@/stores/authStore';

/**
 * Inventory component displaying a paginated table of products.
 *
 * @returns {JSX.Element} - The rendered Inventory component.
 */
const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const authStore = useAuthStore();
  const { token } = authStore;

  /**
   * Fetches product data from the API.
   *
   * @param {number} page - The current page number for pagination.
   */
  const fetchProducts = async (page) => {
    try {
      const response = await axios.get('/api/inventory/stock/levels/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page,
        },
      });
      setProducts(response.data.products);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  /**
   * Handles pagination change.
   *
   * @param {number} newPage - The new page number.
   */
  const handlePaginationChange = (newPage) => {
    setCurrentPage(newPage);
    fetchProducts(newPage);
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, token]);

  return (
    <div>
      <h1>Inventory</h1>
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
          {products.map((product) => (
            <Tr key={product.sku}>
              <Td>{product.sku}</Td>
              <Td>{product.name}</Td>
              <Td>{product.category}</Td>
              <Td>{product.unit}</Td>
              <Td>{product.stockLevel}</Td>
              <Td>{product.reorderThreshold}</Td>
              <Td>
                {product.stockLevel >= product.reorderThreshold ? (
                  'OK'
                ) : product.stockLevel > 0 ? (
                  'LOW'
                ) : (
                  'OUT'
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {/* Pagination component would go here */}
    </div>
  );
};

export default Inventory;
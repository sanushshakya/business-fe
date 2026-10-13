import React from 'react';
import { Select } from '@/components/ui';
import useApiList from '../hooks/useApiList';

/**
 * Dropdown of the company's products. `onChange` receives the selected product id (number) or ''.
 */
const ProductSelect = ({ value, onChange, id = 'product' }) => {
  const products = useApiList('/inventory/products/');

  return (
    <Select
      id={id}
      aria-label="Product"
      value={value ?? ''}
      disabled={products.isLoading}
      onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
    >
      <option value="">{products.isLoading ? 'Loading…' : 'Select a product'}</option>
      {(products.data || []).map((product) => (
        <option key={product.id} value={product.id}>
          {product.name}
        </option>
      ))}
    </Select>
  );
};

export default ProductSelect;

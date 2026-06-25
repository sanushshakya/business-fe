import React from 'react';
import { useAsyncDebounce } from 'use-async-debounce';
import { Select, Option } from '@shadcn/ui';

/**
 * ProductSelect component for searching and selecting products.
 *
 * @param {Object} props - Component props.
 * @param {function} [props.onChange] - Callback function to handle product selection change.
 * @param {string} [props.value] - Currently selected product ID.
 */
const ProductSelect = ({ onChange, value }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearch = useAsyncDebounce(searchTerm);

  // Function to fetch products based on search term
  const fetchProducts = async (term) => {
    try {
      const response = await fetch(`/api/products?query=${term}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  // Effect to handle debounced search term and fetch products
  React.useEffect(() => {
    const fetchData = async () => {
      const products = await fetchProducts(debouncedSearch);
      setOptions(products.map(product => ({ value: product.id, label: product.name })));
    };
    if (debouncedSearch) {
      fetchData();
    }
    // Clear options when search term is empty
    else {
      setOptions([]);
    }
  }, [debouncedSearch]);

  const [options, setOptions] = React.useState([]);

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(option => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );
};

export default ProductSelect;
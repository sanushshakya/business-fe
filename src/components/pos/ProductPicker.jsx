import React from 'react';
import { Input } from '@/components/ui';
import { formatMoney } from '../../utils/money';

const MAX_SHOWN = 60;

/**
 * Searchable grid of products. Enter in the search box adds the first match that is in stock.
 */
const ProductPicker = ({ products = [], onAdd }) => {
  const [query, setQuery] = React.useState('');
  const needle = query.trim().toLowerCase();
  const matches = products.filter(
    (p) => !needle || p.name.toLowerCase().includes(needle) || (p.commodity_code || '').toLowerCase().includes(needle)
  );

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const first = matches.find((p) => p.stock_quantity > 0);
    if (first) {
      onAdd(first);
      setQuery('');
    }
  };

  return (
    <div className="space-y-3">
      <Input
        type="search"
        aria-label="Search products"
        placeholder="Search products — Enter adds the first match"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      {matches.length === 0 ? (
        <p className="text-sm text-gray-500">{products.length ? 'No products match.' : 'No products yet.'}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
          {matches.slice(0, MAX_SHOWN).map((product) => {
            const out = product.stock_quantity < 1;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  disabled={out}
                  onClick={() => onAdd(product)}
                  className="h-full w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block text-sm font-medium">{product.name}</span>
                  <span className="mt-1 block text-sm text-gray-700">{formatMoney(product.price)}</span>
                  <span className={`mt-1 block text-xs ${out ? 'text-red-600' : 'text-gray-500'}`}>
                    {out ? 'Out of stock' : `${product.stock_quantity} in stock`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {matches.length > MAX_SHOWN && (
        <p className="text-xs text-gray-500">
          Showing {MAX_SHOWN} of {matches.length}. Search to narrow down.
        </p>
      )}
    </div>
  );
};

export default ProductPicker;

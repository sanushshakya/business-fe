import { useState } from 'react';

/**
 * Custom hook to fetch inventory data for the EventCard component directly from RxDB.
 *
 * @returns {Object} - An object containing the loading state, error state, and event card data.
 */
const useInventory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventCards, setEventCards] = useState([
    { id: '1', name: 'Item A', quantity: 10 },
    { id: '2', name: 'Item B', quantity: 5 },
    { id: '3', name: 'Item C', quantity: 8 },
  ]);

  return { loading, error, eventCards };
};

export default useInventory;
import { useState, useEffect } from 'react';
import axios from '../utils/axios';

/**
 * Custom hook to fetch inventory data for the LineChart.
 *
 * @returns {Object} - An object containing the loading state, error state, and inventory data.
 */
const useInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await axios.get('/api/inventory/stock/levels/');
        setInventory(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  return { loading, error, inventory };
};

export default useInventory;
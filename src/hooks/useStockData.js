// src/hooks/useStockData.js

import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch stock data for the last 30 days.
 *
 * @returns {Object} - An object containing the stock data and loading state.
 */
const useStockData = () => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        // Simulate API call to fetch stock data
        const response = await fetch('/api/stock-data');
        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }
        const data = await response.json();
        setStockData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  return { stockData, loading, error };
};

export default useStockData;
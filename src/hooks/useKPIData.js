// src/hooks/useKPIData.js

import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch data for KPI hero cards.
 *
 * @returns {Object} - An object containing the fetched data and a loading state.
 */
const useKPIData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch KPI data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/kpi');
        if (!response.ok) {
          throw new Error('Failed to fetch KPI data');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
};

export default useKPIData;
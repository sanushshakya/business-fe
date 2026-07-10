import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * useBranches hook to fetch and manage branch data.
 *
 * @returns {Object} - An object containing branches data and loading state.
 */
const useBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches');
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return { branches, loading };
};

export default useBranches;
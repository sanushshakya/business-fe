// src/hooks/useTeamData.js

import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Custom hook to fetch user data from the backend API.
 *
 * @returns {Object} - An object containing users and isLoading status.
 */
const useTeamData = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { users, isLoading };
};

export default useTeamData;
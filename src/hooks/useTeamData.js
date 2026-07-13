// src/hooks/useTeamData.js

import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Custom hook to fetch user data and manage new user data from the backend API.
 *
 * @returns {Object} - An object containing users, isLoading status, and a function to add a new user.
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

  /**
   * Adds a new user to the state.
   *
   * @param {Object} newUser - The new user data to be added.
   */
  const addUser = async (newUser) => {
    try {
      await axios.post('/api/users', newUser);
      setUsers([...users, newUser]);
    } catch (error) {
      console.error('Failed to add new user:', error);
    }
  };

  return { users, isLoading, addUser };
};

export default useTeamData;
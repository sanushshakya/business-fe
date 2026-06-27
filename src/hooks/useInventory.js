import { useState, useEffect } from 'react';
import axios from '../utils/axios';

/**
 * Custom hook to fetch inventory data for the EventCard component.
 *
 * @returns {Object} - An object containing the loading state, error state, and event card data.
 */
const useInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventCards, setEventCards] = useState([]);

  useEffect(() => {
    const fetchEventCardData = async () => {
      try {
        const response = await axios.get('/api/events/card/');
        setEventCards(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventCardData();
  }, []);

  return { loading, error, eventCards };
};

export default useInventory;
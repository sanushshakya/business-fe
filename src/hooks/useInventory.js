import { useState, useEffect } from 'react';
import RxDB from 'rxdb';
import { useRxStore } from '../stores/eventCardStore';

/**
 * Custom hook to fetch inventory data for the EventCard component directly from RxDB.
 *
 * @returns {Object} - An object containing the loading state, error state, and event card data.
 */
const useInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventCards, setEventCards] = useState([]);
  const rxStore = useRxStore();

  useEffect(() => {
    const fetchEventCardData = async () => {
      try {
        // Fetch data from RxDB
        const eventData = await rxStore.getEventCards();
        setEventCards(eventData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventCardData();
  }, [rxStore]);

  return { loading, error, eventCards };
};

export default useInventory;
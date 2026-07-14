import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch upcoming cultural events for the next 60 days.
 *
 * @returns {Object} - An object containing loading state, error state, and event data.
 */
const useEventData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Replace the following URL with the actual API endpoint for fetching cultural events
        const response = await fetch('https://api.example.com/events?days=60');
        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }
        const eventData = await response.json();
        setEvents(eventData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { loading, error, events };
};

export default useEventData;
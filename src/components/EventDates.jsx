// src/components/EventDates.jsx

import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';

/**
 * EventDates Component - Fetches and displays event dates from the API.
 */
const EventDates = () => {
  const [eventDates, setEventDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches event dates from the API.
   */
  useEffect(() => {
    const fetchEventDates = async () => {
      try {
        const response = await axios.get('/api/demand/calendar/?months=3');
        setEventDates(response.data.dates);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDates();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {eventDates.map((date, index) => (
        <li key={index}>{date.toLocaleDateString()}</li>
      ))}
    </ul>
  );
};

export default EventDates;
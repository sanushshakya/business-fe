// src/views/AlertsDemandListView.js

import React from 'react';
import { useQuery } from 'react-query';
import axios from '../utils/axios';

/**
 * Custom hook to fetch alerts demand data.
 * @returns {Object} An object containing the data, isLoading state, and error if any.
 */
const useFetchAlertsDemand = () => {
  return useQuery('alerts-demand', async () => {
    const response = await axios.get('/api/alerts/demand');
    return response.data;
  });
};

/**
 * Component to display the list of alerts demand.
 * @returns {React.Element} The component rendered in the DOM.
 */
const AlertsDemandListView = () => {
  const { data, isLoading, error } = useFetchAlertsDemand();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Alerts Demand List</h1>
      <ul>
        {data.map(alert => (
          <li key={alert.id}>{alert.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default AlertsDemandListView;
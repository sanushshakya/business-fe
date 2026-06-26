// src/views/AlertsDemandListView.js

import React from 'react';
import { useQuery } from 'react-query';
import axios from '../utils/axios';

/**
 * Custom hook to fetch alerts demand data for a specific tenant.
 * @param {string} tenantId - The ID of the tenant.
 * @returns {Object} An object containing the data, isLoading state, and error if any.
 */
const useFetchAlertsDemand = (tenantId) => {
  return useQuery(['alerts-demand', tenantId], async () => {
    const response = await axios.get(`/api/alerts/demand?tenant=${tenantId}`);
    return response.data;
  });
};

/**
 * Component to display the list of alerts demand for a specific tenant.
 * @param {Object} props - The component props.
 * @param {string} props.tenantId - The ID of the tenant.
 * @returns {React.Element} The component rendered in the DOM.
 */
const AlertsDemandListView = ({ tenantId }) => {
  const { data, isLoading, error } = useFetchAlertsDemand(tenantId);

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
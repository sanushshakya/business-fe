// src/views/AlertsDemandListView.js

import React from 'react';
import { useQuery } from 'react-query';
import axios from '../utils/axios';

/**
 * Custom hook to fetch alerts demand data for a specific tenant, filtered by branch and dismissed status.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} branch - The branch name to filter alerts by.
 * @param {boolean} dismissed - Whether to filter by dismissed status.
 * @returns {Object} An object containing the data, isLoading state, and error if any.
 */
const useFetchAlertsDemand = (tenantId, branch, dismissed) => {
  return useQuery(['alerts-demand', tenantId, branch, dismissed], async () => {
    const response = await axios.get(`/api/alerts/demand?tenant=${tenantId}&branch=${branch}&dismissed=${dismissed}`);
    return response.data;
  });
};

/**
 * Component to display the list of alerts demand for a specific tenant, filtered by branch and dismissed status.
 * @param {Object} props - The component props.
 * @param {string} props.tenantId - The ID of the tenant.
 * @param {string} [props.branch] - The branch name to filter alerts by (optional).
 * @param {boolean} [props.dismissed=false] - Whether to filter by dismissed status (optional, default is false).
 * @returns {React.Element} The component rendered in the DOM.
 */
const AlertsDemandListView = ({ tenantId, branch, dismissed = false }) => {
  const { data, isLoading, error } = useFetchAlertsDemand(tenantId, branch, dismissed);

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
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

/**
 * @module src/views/AlertsDemandDetailView.js
 * @description Contains the component for displaying and dismissing an alert demand.
 */

const AlertsDemandDetailView = ({ id }) => {
  const queryClient = useQueryClient();

  /**
   * @function dismissDemandMutation
   * @description Mutation to dismiss an alert demand using a PATCH request.
   */
  const dismissDemandMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.patch(`/api/alerts/demand/${id}/dismiss/`, null, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch the alert demand data
      queryClient.invalidateQueries(['alertDemand', id]);
      console.log('Alert demand dismissed successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to dismiss alert demand:', error);
    }
  });

  /**
   * @function handleDismiss
   * @description Handles the dismissal of an alert demand.
   */
  const handleDismiss = () => {
    if (window.confirm('Are you sure you want to dismiss this alert demand?')) {
      dismissDemandMutation.mutate();
    }
  };

  return (
    <div>
      <h1>Alert Demand Detail</h1>
      {/* Render the alert demand details here */}
      <button onClick={handleDismiss} disabled={dismissDemandMutation.isPending}>
        {dismissDemandMutation.isPending ? 'Dismissing...' : 'Dismiss'}
      </button>
    </div>
  );
};

export default AlertsDemandDetailView;
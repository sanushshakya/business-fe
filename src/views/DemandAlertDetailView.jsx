// src/views/DemandAlertDetailView.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import useSyncManager from '../hooks/useSyncManager';

/**
 * DemandAlertDetailView component to display details of a specific demand alert.
 *
 * @returns {React.FC} - The DemandAlertDetailView component
 */
const DemandAlertDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Extract the alert ID from URL parameters

  const { fetchDemandAlert, demandAlertData } = useSyncManager(); // Use custom hook to manage synchronization and data fetching

  React.useEffect(() => {
    if (id) {
      fetchDemandAlert(id); // Fetch the specific demand alert when the component mounts
    }
  }, [id, fetchDemandAlert]);

  // Render the detail view of the demand alert
  return (
    <div>
      {demandAlertData ? (
        <div className="text-center mt-10">
          <h1 className="text-4xl font-bold">{demandAlertData.title}</h1>
          <p>{demandAlertData.description}</p>
          <p>Event Date: {new Date(demandAlertData.eventDate).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>Loading demand alert details...</p>
      )}
    </div>
  );
};

export default DemandAlertDetailView;
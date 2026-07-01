// src/components/EventCard.jsx

import React from 'react';
import { useInventory } from '../hooks/useInventory';

/**
 * EventCard Component — Displays event details and active DemandAlerts.
 *
 * @param {Object} props - The component props.
 * @param {string} props.eventId - The ID of the event to display.
 * @returns {JSX.Element} - The rendered EventCard component.
 */
const EventCard = ({ eventId }) => {
  const { inventory, isLoading, error } = useInventory(eventId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Function to handle the confirmation action
  const handleConfirmation = async () => {
    try {
      // Simulate sending a confirmation per UUID
      const response = await fetch(`/api/confirm/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm event');
      }

      // Update the synced field in RxDB
      await rxdbBatchService.updateSyncedStatus(eventId, true);

      alert('Event confirmed successfully!');
    } catch (error) {
      console.error('Error confirming event:', error);
      alert('Failed to confirm event. Please try again later.');
    }
  };

  return (
    <div className="event-card">
      <h2>{inventory.title}</h2>
      <p>Date: {new Date(inventory.date).toLocaleDateString()}</p>
      <p>Location: {inventory.location}</p>
      {/* Render DemandAlerts if available */}
      {inventory.demandAlerts && (
        <div className="demand-alerts">
          <h3>Demand Alerts</h3>
          <ul>
            {inventory.demandAlerts.map((alert) => (
              <li key={alert.id} className={`alert-${alert.status}`}>
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Add a button to trigger confirmation */}
      <button onClick={handleConfirmation}>Confirm Event</button>
    </div>
  );
};

export default EventCard;
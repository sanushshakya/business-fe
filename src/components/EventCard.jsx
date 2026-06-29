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
    </div>
  );
};

export default EventCard;
// src/components/RecentAlertsSummary.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import useSyncManager from '../hooks/useSyncManager';

/**
 * RecentAlertsSummary component to display the summary of recent alerts.
 *
 * This component fetches and displays the 5 most recent demand, stock, and freight alerts.
 *
 * @returns {React.FC} - The RecentAlertsSummary component
 */
const RecentAlertsSummary = () => {
  const { alerts } = useSyncManager();
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    if (alerts) {
      // Filter and sort the alerts to get the most recent ones
      const sortedAlerts = [...alerts].sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentAlerts(sortedAlerts.slice(0, 5));
    }
  }, [alerts]);

  return (
    <div>
      <h2>Recent Alerts</h2>
      <ul>
        {recentAlerts.map((alert, index) => (
          <li key={index}>
            {alert.type}: {alert.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentAlertsSummary;
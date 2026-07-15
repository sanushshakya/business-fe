import React from 'react';
import EmptyStateComponent from '../components/EmptyStateComponent'; // Import the new empty state component

/**
 * AlertsListPage - Displays a list of alerts or an empty state if no alerts are present.
 *
 * This component fetches the list of alerts and renders them. If the list is empty, it
 * displays an empty state message instead.
 */
const AlertsListPage = () => {
  // Placeholder for fetching alerts data
  const alerts = [];

  /**
   * renderAlerts - Renders the list of alerts if available.
   *
   * @returns {JSX.Element} - JSX to display the alerts or an empty state.
   */
  const renderAlerts = () => {
    if (alerts.length === 0) {
      return <EmptyStateComponent message="No alerts found." />;
    }

    // Render list of alerts here
    return (
      <ul>
        {alerts.map((alert, index) => (
          <li key={index}>{alert.message}</li>
        ))}
      </ul>
    );
  };

  return <div>{renderAlerts()}</div>;
};

export default AlertsListPage;
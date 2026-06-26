// src/views/DemandAlertsPage.jsx

import React from 'react';
import AlertCard from '../../components/AlertCard';

/**
 * @module src/views/DemandAlertsPage.js
 */

const DemandAlertsPage = ({ alerts }) => {
  /**
   * Renders a list of demand alert cards.
   *
   * @param {Array} alerts - An array of alert objects to be displayed as cards.
   * @returns {JSX.Element} - The rendered JSX for the demand alerts page.
   */

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          eventName={alert.eventName}
          productName={alert.productName}
          daysUntilEvent={alert.daysUntilEvent}
          recommendedOrderQuantity={alert.recommendedOrderQuantity}
          onDismiss={() => {
            // Handle dismiss action for the alert card
            console.log(`Dismissed alert: ${alert.eventName}`);
          }}
        />
      ))}
    </div>
  );
};

export default DemandAlertsPage;
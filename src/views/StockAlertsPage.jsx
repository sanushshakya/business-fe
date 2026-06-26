import React from 'react';
import { useInventory } from '../../hooks/useInventory';
import AlertCard from '../components/AlertCard';

/**
 * @module src/views/StockAlertsPage.jsx
 * 
 * Page component to display a list of stock alerts.
 */

const StockAlertsPage = () => {
  const { data: inventory, isLoading, isError } = useInventory();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading inventory data.</div>;

  /**
   * Render function to display the list of stock alerts.
   */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {inventory.stockAlerts.map((alert) => (
        <AlertCard
          key={alert.id}
          eventName={alert.eventName}
          productName={alert.productName}
          daysUntilEvent={alert.daysUntilEvent}
          recommendedOrderQuantity={alert.recommendedOrderQuantity}
          onDismiss={() => handleDismiss(alert.id)}
        />
      ))}
    </div>
  );
};

/**
 * Function to handle the dismissal of a stock alert.
 * @param {string} id - The ID of the alert to be dismissed.
 */
const handleDismiss = (id) => {
  // Logic to dismiss the alert, e.g., remove it from the inventory or mark as handled
  console.log(`Dismissing alert with ID: ${id}`);
};

export default StockAlertsPage;
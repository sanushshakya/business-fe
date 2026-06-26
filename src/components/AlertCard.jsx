// src/components/AlertCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AlertCard component displays details of an alert including event name, product name,
 * days until the event, recommended order quantity, and a Dismiss button.
 *
 * @param {Object} props - The component props
 * @param {string} props.eventName - The name of the event
 * @param {string} props.productName - The name of the product
 * @param {number} props.daysUntilEvent - The number of days until the event
 * @param {number} props.recommendedOrderQuantity - The recommended order quantity
 * @returns {JSX.Element} - The AlertCard component
 */
const AlertCard = ({
  eventName,
  productName,
  daysUntilEvent,
  recommendedOrderQuantity,
}) => {
  const navigate = useNavigate();

  /**
   * Handles the dismissal of an alert.
   *
   * @param {Object} event - The event object
   */
  const handleDismiss = (event) => {
    // Logic to dismiss the alert, e.g., update state or call API to mark as dismissed
    console.log('Alert dismissed:', eventName);
  };

  /**
   * Navigates to a detailed view of the product.
   *
   * @param {Object} event - The event object
   */
  const handleViewProduct = (event) => {
    // Navigate to the product detail page, e.g., /product/{productId}
    navigate(`/product/${eventName}`);
  };

  /**
   * Determines the urgency color based on the number of days until the event.
   *
   * @param {number} daysUntilEvent - The number of days until the event
   * @returns {string} - The CSS class for the urgency color
   */
  const getUrgencyColor = (daysUntilEvent) => {
    if (daysUntilEvent <= 3) return 'bg-red-500 text-white';
    if (daysUntilEvent <= 7) return 'bg-orange-400 text-white';
    return 'bg-yellow-300 text-black';
  };

  return (
    <div className="p-4 mb-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">{eventName}</h2>
      <p className="mt-2">Product: {productName}</p>
      <p className={`mt-2 ${getUrgencyColor(daysUntilEvent)}`}>
        Days until event: {daysUntilEvent}
      </p>
      <p className="mt-2">Recommended Order Quantity: {recommendedOrderQuantity}</p>
      <button
        onClick={handleDismiss}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Dismiss
      </button>
      <button
        onClick={handleViewProduct}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        View Product
      </button>
    </div>
  );
};

export default AlertCard;
// src/components/EventBanner.jsx

import React from 'react';

/**
 * EventBanner component displays a large event banner with the event name and remaining days.
 *
 * @param {Object} props - The component props.
 * @param {string} props.eventName - The name of the event to be displayed on the banner.
 * @param {number} props.daysRemaining - The number of days until the event.
 * @returns {React.FC} - The EventBanner component
 */
const EventBanner: React.FC<{ eventName: string, daysRemaining: number }> = ({ eventName, daysRemaining }) => {
  return (
    <div className="bg-blue-600 text-white p-4 rounded-lg shadow-md text-center">
      <h1 className="text-3xl font-bold">{eventName}</h1>
      <p className="mt-2 text-xl">Event in {daysRemaining} days</p>
    </div>
  );
};

export default EventBanner;
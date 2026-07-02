import React from 'react';

/**
 * FreightAlert component to display individual freight alerts.
 *
 * @component
 */
const FreightAlert = ({ lane, rateChangePercent, estimatedCostImpact }) => {
  /**
   * Calculate the color of the alert based on the rate change percent.
   *
   * @private
   * @returns {string} - The color value ('green' or 'red').
   */
  const getAlertColor = () => {
    if (rateChangePercent > 0) return 'text-green-500';
    if (rateChangePercent < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between">
      <div>
        <p className="font-semibold">{lane}</p>
        <p className="text-sm text-gray-600">Rate Change: {rateChangePercent}%</p>
      </div>
      <div className={getAlertColor()}>
        <p>Estimated Cost Impact: ${estimatedCostImpact.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default FreightAlert;
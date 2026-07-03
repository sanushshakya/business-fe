// src/components/Feature.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import { selectTotalStockValue, selectGrossMarginPercentage, selectActiveAlertsCount, selectWasteSavedBy } from '../stores/dashboardStore';

/**
 * Feature component to render the main Dashboard page with four KPI cards.
 *
 * @returns {React.FC} - The Feature component
 */
const Feature = () => {
  const totalStockValue = useSelector(selectTotalStockValue);
  const grossMarginPercentage = useSelector(selectGrossMarginPercentage);
  const activeAlertsCount = useSelector(selectActiveAlertsCount);
  const wasteSavedBy = useSelector(selectWasteSavedBy);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {/* KPI Card - Total Stock Value */}
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <h3 className="text-xl font-bold mb-2">Total Stock Value</h3>
        <p className="text-2xl font-semibold">${totalStockValue}</p>
      </div>

      {/* KPI Card - Gross Margin Percentage */}
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <h3 className="text-xl font-bold mb-2">Gross Margin %</h3>
        <p className="text-2xl font-semibold">{grossMarginPercentage}%</p>
      </div>

      {/* KPI Card - Active Alerts Count */}
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <h3 className="text-xl font-bold mb-2">Active Alerts Count</h3>
        <p className="text-2xl font-semibold">{activeAlertsCount}</p>
      </div>

      {/* KPI Card - Waste Saved by */}
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <h3 className="text-xl font-bold mb-2">Waste Saved by</h3>
        <p className="text-2xl font-semibold">${wasteSavedBy}</p>
      </div>
    </div>
  );
};

export default Feature;
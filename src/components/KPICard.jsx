// src/components/KPICard.jsx

import React from 'react';

/**
 * KPICard component to display a hero card with KPI data.
 *
 * @param {Object} props - The props for the KPICard component.
 * @param {string} title - The title of the KPI card.
 * @param {number} value - The value to display in the KPI card.
 * @param {string} icon - The icon class name for the card.
 * @returns {JSX.Element} - The rendered KPICard component.
 */
const KPICard = ({ title, value, icon }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 flex items-center space-x-4">
      <span className={icon}></span>
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default KPICard;
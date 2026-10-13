// src/components/KPICard.jsx

import React from 'react';

/**
 * A single headline figure. `icon` is any renderable node (e.g. an emoji or SVG).
 */
const KPICard = ({ title, value, icon, onClick }) => {
  const content = (
    <>
      {icon && <span aria-hidden="true">{icon}</span>}
      <div className="text-left">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </>
  );
  const className = 'flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm';

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
};

export default KPICard;

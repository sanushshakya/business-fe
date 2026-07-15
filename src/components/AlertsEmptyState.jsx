// src/components/AlertsEmptyState.jsx

import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/solid';

/**
 * Alerts Empty State Component - Displays a green checkmark and a message when there are no alerts.
 *
 * @component
 * @example
 * <AlertsEmptyState />
 */
const AlertsEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <CheckCircleIcon className="w-16 h-16 text-green-500" />
      <p className="text-gray-700 text-lg font-medium">No alerts to display.</p>
    </div>
  );
};

export default AlertsEmptyState;
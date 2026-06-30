// src/components/ConnectivityBadge.jsx

import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * ConnectivityBadge component to display the current network status.
 *
 * @component
 * @returns {JSX.Element} - The rendered ConnectivityBadge component.
 */
const ConnectivityBadge = () => {
  // Get the current network status using a custom hook
  const { isOnline, isSyncing } = useNetworkStatus();

  // Determine the badge color and content based on the network status
  let badgeColor, badgeContent;
  if (isSyncing) {
    badgeColor = 'yellow';
    badgeContent = <span className="animate-spin i-carbon-loading"></span>; // Assuming loading icon from carbon-icons
  } else if (isOnline) {
    badgeColor = 'green';
    badgeContent = 'Online';
  } else {
    badgeColor = 'red';
    badgeContent = 'Offline';
  }

  // Render the ConnectivityBadge component with appropriate classes and content
  return (
    <div className={`connectivity-badge ${badgeColor}`}>
      {badgeContent}
    </div>
  );
};

// Export the ConnectivityBadge component for use in other parts of the application
export default ConnectivityBadge;
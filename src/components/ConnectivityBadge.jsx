// src/components/ConnectivityBadge.jsx

import React from 'react';
import { Badge } from '@/components/ui';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Shows whether the browser is online.
 */
const ConnectivityBadge = () => {
  const isOnline = useNetworkStatus();
  return <Badge color={isOnline ? 'green' : 'red'}>{isOnline ? 'Online' : 'Offline'}</Badge>;
};

export default ConnectivityBadge;

// src/hooks/useNetworkStatus.js

import { useEffect, useState } from 'react';

/**
 * Tracks navigator.onLine and calls `callback` whenever the browser comes back online.
 *
 * @param {() => void} [callback]
 * @returns {boolean} The current online status.
 */
export function useNetworkStatus(callback) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (callback) callback();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [callback]);

  return isOnline;
}

export default useNetworkStatus;

// src/hooks/useNetworkStatus.js

import { useEffect, useState } from 'react';
import create from 'zustand';

/**
 * Zustand store for managing network status.
 */
const useNetworkStore = create((set) => ({
  isOnline: navigator.onLine,
  setOnline: (isOnline) => set({ isOnline }),
}));

/**
 * Custom hook to poll navigator.onLine every 5 seconds and store the status in Zustand.
 * @returns {boolean} - The current online status.
 */
export default function useNetworkStatus(callback = () => {}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const setOnlineStatus = useNetworkStore((state) => state.setOnline);

  useEffect(() => {
    const handleOnlineChange = () => {
      setIsOnline(navigator.onLine);
      setOnlineStatus(navigator.onLine);
      if (navigator.onLine) callback(); // Call the callback function if online
    };

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, [setOnlineStatus, callback]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
      setOnlineStatus(navigator.onLine);
    }, 5000);

    return () => clearInterval(interval);
  }, [setOnlineStatus]);

  return isOnline;
}
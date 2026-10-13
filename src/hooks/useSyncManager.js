// src/hooks/useSyncManager.js

import { useCallback, useEffect, useRef, useState } from 'react';
import { processBatch as defaultProcessBatch } from '../services/rxdbBatchService';

/**
 * Flushes queued offline batches whenever the browser comes back online.
 *
 * @param {{processBatch?: () => Promise<void>, onNetworkOnline?: () => void, onNetworkOffline?: () => void}} [options]
 * @returns {{isOnline: boolean, isSyncing: boolean, syncCount: number, error: Error|null}}
 */
const useSyncManager = ({ processBatch = defaultProcessBatch, onNetworkOnline, onNetworkOffline } = {}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [error, setError] = useState(null);

  // Handlers are read through a ref so the listeners never need re-registering.
  const handlers = useRef({});
  handlers.current = { processBatch, onNetworkOnline, onNetworkOffline };

  const handleOnline = useCallback(async () => {
    setIsOnline(true);
    handlers.current.onNetworkOnline?.();
    setIsSyncing(true);
    setError(null);
    try {
      await handlers.current.processBatch();
      setSyncCount((count) => count + 1);
    } catch (err) {
      setError(err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    handlers.current.onNetworkOffline?.();
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, isSyncing, syncCount, error };
};

export default useSyncManager;

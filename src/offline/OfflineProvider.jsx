// src/offline/OfflineProvider.jsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { initRxDB } from '../offlineDB';
import useSyncManager from '../hooks/useSyncManager';
import axios from '../utils/axios';
import { isRejection } from '../utils/http';

const OfflineContext = createContext(null);

// One database per page load: RxDB refuses to open the same name twice (React StrictMode mounts twice in dev).
let sharedDb;
const getSharedDb = () => (sharedDb ||= initRxDB());

const BATCH_URL = '/inventory/batches/';

/**
 * Keeps stock receipts captured offline in RxDB and sends them to the backend once the browser is online.
 *
 * A receipt is `{id, product, batch_number, quantity, expiration_date, synced, error?}`:
 * - network or 5xx failure: it stays queued and is retried on the next `online` event or `flush()`;
 * - 4xx (the server rejected it): it is marked with `error` so it is not retried forever; `retryFailed()` clears that.
 *
 * @param {{createDb?: () => Promise<import('rxdb').RxDatabase>}} props - `createDb` is for tests.
 */
export const OfflineProvider = ({ children, createDb = getSharedDb }) => {
  const queryClient = useQueryClient();
  const [db, setDb] = useState(null);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const flushing = useRef(null);

  useEffect(() => {
    let cancelled = false;
    createDb()
      .then((database) => !cancelled && setDb(database))
      .catch((error) => console.error('Offline database unavailable:', error));
    return () => {
      cancelled = true;
    };
  }, [createDb]);

  useEffect(() => {
    if (!db) return undefined;
    const subscription = db.stockReceipts.find({ selector: { synced: false } }).$.subscribe((docs) => {
      setFailed(docs.filter((doc) => doc.error).length);
      setPending(docs.filter((doc) => !doc.error).length);
    });
    return () => subscription.unsubscribe();
  }, [db]);

  const flush = useCallback(() => {
    if (!db) return Promise.resolve();
    if (flushing.current) return flushing.current;

    flushing.current = (async () => {
      const docs = await db.stockReceipts.find({ selector: { synced: false } }).exec();
      let sent = 0;
      try {
        for (const doc of docs) {
          if (doc.error) continue;
          const { product, batch_number, quantity, expiration_date } = doc.toJSON();
          try {
            await axios.post(BATCH_URL, { product, batch_number, quantity, expiration_date });
            await doc.patch({ synced: true });
            sent += 1;
          } catch (error) {
            if (isRejection(error)) {
              await doc.patch({ error: `Rejected by the server (${error.response.status})` });
              continue;
            }
            throw error; // offline or server trouble: stop and keep the rest queued
          }
        }
      } finally {
        flushing.current = null;
        if (sent > 0) queryClient.invalidateQueries({ queryKey: ['list'] });
      }
    })();
    return flushing.current;
  }, [db, queryClient]);

  const { isOnline, isSyncing } = useSyncManager({ processBatch: flush });

  // Send anything left over from an earlier session as soon as the database is ready.
  useEffect(() => {
    if (db && navigator.onLine) flush().catch(() => {});
  }, [db, flush]);

  const queueReceipt = useCallback(
    async (receipt) => {
      if (!db) throw new Error('Offline storage is not available.');
      await db.stockReceipts.insert({ id: uuidv4(), ...receipt, synced: false });
    },
    [db]
  );

  const retryFailed = useCallback(async () => {
    if (!db) return;
    const docs = await db.stockReceipts.find({ selector: { synced: false } }).exec();
    await Promise.all(docs.filter((doc) => doc.error).map((doc) => doc.patch({ error: undefined })));
    flush().catch(() => {});
  }, [db, flush]);

  const value = useMemo(
    () => ({ ready: Boolean(db), isOnline, isSyncing, pending, failed, queueReceipt, flush, retryFailed }),
    [db, isOnline, isSyncing, pending, failed, queueReceipt, flush, retryFailed]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used inside <OfflineProvider>');
  return context;
};

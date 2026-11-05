// src/offline/OfflineProvider.jsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { initRxDB } from '../offlineDB';
import useSyncManager from '../hooks/useSyncManager';
import axios from '../utils/axios';
import { isRejection } from '../utils/http';
import useAuthStore from '../stores/authStore';
import { retrySalesWithErrors, sendOfflineSales } from './sendQueue';

const SEND_EVERY_MS = 60_000;

const OfflineContext = createContext(null);

// One database per page load: RxDB refuses to open the same name twice (React StrictMode mounts twice in dev).
let sharedDb;
const getSharedDb = () => (sharedDb ||= initRxDB());

const BATCH_URL = '/inventory/batches/';

/**
 * Keeps stock receipts captured offline in RxDB and sends them to the backend once the browser is online.
 *
 * A receipt is `{id, product, batch_number, quantity, expiration_date, location?, synced, error?}`:
 * - network or 5xx failure: it stays queued and is retried on the next `online` event or `flush()`;
 * - 4xx (the server rejected it): it is marked with `error` so it is not retried forever; `retryFailed()` clears that.
 *
 * @param {{createDb?: () => Promise<import('rxdb').RxDatabase>}} props - `createDb` is for tests.
 */
export const OfflineProvider = ({ children, createDb = getSharedDb }) => {
  const queryClient = useQueryClient();
  const [db, setDb] = useState(null);
  const [dbFailed, setDbFailed] = useState(false);
  const [sending, setSending] = useState(false); // a flush (receipts, then offline sales) is running
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const flushing = useRef(null);

  useEffect(() => {
    let cancelled = false;
    createDb()
      .then((database) => !cancelled && setDb(database))
      .catch((error) => {
        console.error('Offline database unavailable:', error);
        if (!cancelled) setDbFailed(true); // e.g. IndexedDB blocked: screens that can work without it say so
      });
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

    setSending(true);
    flushing.current = (async () => {
      const docs = await db.stockReceipts.find({ selector: { synced: false } }).exec();
      let sent = 0;
      try {
        for (const doc of docs) {
          if (doc.error) continue;
          const { product, batch_number, quantity, expiration_date, location, supplier } = doc.toJSON();
          const body = { product, batch_number, quantity, expiration_date };
          if (location != null) body.location = location; // receipts queued before G13 have none
          if (supplier != null) body.supplier = supplier; // optional (G24)
          try {
            await axios.post(BATCH_URL, body);
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
        // Then the till's offline sales (G28), once someone is signed in; what the server recorded leaves here.
        if (useAuthStore.getState().accessToken) sent += (await sendOfflineSales(db, axios.post)).sent;
      } finally {
        flushing.current = null;
        setSending(false);
        if (sent > 0) queryClient.invalidateQueries({ queryKey: ['list'] });
      }
    })();
    return flushing.current;
  }, [db, queryClient]);

  const { isOnline, isSyncing } = useSyncManager({ processBatch: flush });

  // Send anything left over from an earlier session as soon as the database is ready, then every minute: an
  // outage of the server alone fires no `online` event.
  useEffect(() => {
    if (!db) return undefined;
    // Sales the server could not record last time (e.g. a VAT rate missing then) are tried again once per start.
    retrySalesWithErrors(db)
      .catch(() => {})
      .then(() => navigator.onLine && flush().catch(() => {}));
    const timer = setInterval(() => navigator.onLine && flush().catch(() => {}), SEND_EVERY_MS);
    return () => clearInterval(timer);
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
    await retrySalesWithErrors(db);
    flush().catch(() => {});
  }, [db, flush]);

  const value = useMemo(
    () => ({
      db,
      dbFailed,
      ready: Boolean(db),
      isOnline,
      isSyncing,
      sending,
      pending,
      failed,
      queueReceipt,
      flush,
      retryFailed,
    }),
    [db, dbFailed, isOnline, isSyncing, sending, pending, failed, queueReceipt, flush, retryFailed]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used inside <OfflineProvider>');
  return context;
};

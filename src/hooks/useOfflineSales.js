import { useCallback, useEffect, useState } from 'react';
import { useOffline } from '../offline/OfflineProvider';
import { queueSale, voidQueued } from '../offline/salesQueue';

/**
 * This till's offline sales (G27): the live list (newest first), `queue(args)` for `salesQueue.queueSale` and
 * `voidSale(clientRef, reason)`. `available` is false when the browser database could not open, so nothing can be
 * kept offline.
 */
export default function useOfflineSales(tillId) {
  const { db, dbFailed } = useOffline();
  const [sales, setSales] = useState([]);

  useEffect(() => {
    setSales([]);
    if (!db || !tillId) return undefined;
    const subscription = db.offlineSales
      .find({ selector: { till: Number(tillId) } })
      .$.subscribe((docs) =>
        setSales(
          docs
            .map((doc) => ({ ...doc.toJSON().data, status: doc.status }))
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
        )
      );
    return () => subscription.unsubscribe();
  }, [db, tillId]);

  const queue = useCallback((args) => queueSale(db, args), [db]);
  const voidSale = useCallback((clientRef, reason, userId) => voidQueued(db, clientRef, reason, userId), [db]);
  return { available: Boolean(db), failed: Boolean(dbFailed), sales, queue, voidSale };
}

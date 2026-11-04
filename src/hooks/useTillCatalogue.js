import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOffline } from '../offline/OfflineProvider';
import { applyCatalogue, clearCatalogue, readCatalogue, readSession, saveSession } from '../offline/catalogue';
import useAuthStore from '../stores/authStore';
import axios from '../utils/axios';
import { ruleFromApi } from '../utils/barcodes';
import { tokenUserId } from '../utils/jwt';

export const CATALOGUE_URL = '/sales/catalogue/';
const REFRESH_MS = 60_000;

async function fetchInto(db) {
  const { meta } = await readCatalogue(db);
  const { data } = await axios.get(CATALOGUE_URL, { params: meta?.cursor ? { since: meta.cursor } : {} });
  const result = await applyCatalogue(db, data);
  if (result.needsFull) await applyCatalogue(db, (await axios.get(CATALOGUE_URL, { params: {} })).data);
  return true;
}

/**
 * The till's catalogue (G26, ADR 0001): products, barcode rules, VAT rates, tills, branches and till settings, read
 * from RxDB so the till keeps finding and pricing products while the server can't be reached. Refreshed from
 * `GET /sales/catalogue/` (only changes after the first load) on mount, every minute and on `refresh()`; a failed
 * refresh keeps what is cached and sets `error`. A cache belonging to another user (by the access token's
 * `user_id`) is wiped before anything is shown.
 */
export default function useTillCatalogue() {
  const { db } = useOffline();
  const userId = tokenUserId(useAuthStore((state) => state.accessToken));
  const [checked, setChecked] = useState(false);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!db || userId === null) return undefined;
    let cancelled = false;
    const subscriptions = [];
    (async () => {
      const cached = (await readCatalogue(db)).meta;
      if (cached && cached.owner?.user !== userId) await clearCatalogue(db);
      if (cancelled) return;
      subscriptions.push(
        db.catalogueProducts.find().$.subscribe((docs) => setProducts(docs.map((doc) => doc.toJSON().data))),
        db.catalogueMeta.findOne('catalogue').$.subscribe((doc) => setMeta(doc ? doc.toJSON().value : null))
      );
      setChecked(true);
    })();
    return () => {
      cancelled = true;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [db, userId]);

  const query = useQuery({
    queryKey: ['tillCatalogue', userId],
    enabled: Boolean(db && checked),
    queryFn: () => fetchInto(db),
    refetchInterval: REFRESH_MS,
    retry: false,
  });
  const { refetch } = query;
  const refresh = useCallback(() => refetch(), [refetch]);
  const rules = useMemo(() => (meta?.barcodeRules ?? []).map(ruleFromApi), [meta]);
  const saveTillSession = useCallback((tillId, session) => db && saveSession(db, tillId, session), [db]);
  const readTillSession = useCallback((tillId) => (db ? readSession(db, tillId) : Promise.resolve(null)), [db]);

  return {
    ready: checked,
    products: checked ? products : [],
    rules,
    vatRates: meta?.vatRates ?? [],
    tills: meta?.tills ?? [],
    branches: meta?.branches ?? [],
    settings: meta?.settings ?? null,
    refreshedAt: meta?.refreshedAt ?? null,
    refresh,
    isRefreshing: query.isFetching,
    error: query.error,
    saveSession: saveTillSession,
    readSession: readTillSession,
  };
}

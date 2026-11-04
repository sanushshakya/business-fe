import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOffline } from '../offline/OfflineProvider';
import { applyCatalogue, clearCatalogue, readMeta, readSession, saveSession } from '../offline/catalogue';
import useAuthStore from '../stores/authStore';
import axios from '../utils/axios';
import { ruleFromApi } from '../utils/barcodes';
import { tokenUserId } from '../utils/jwt';

export const CATALOGUE_URL = '/sales/catalogue/';
const REFRESH_MS = 60_000;
// A full load now and then repairs anything a delta missed (a change committed long after it was stamped, a
// category deleted): deltas are cheap, but they are only as good as the versions behind them.
const FULL_EVERY_MS = 6 * 3_600_000;

const get = async (since) => (await axios.get(CATALOGUE_URL, { params: since ? { since } : {} })).data;

async function fetchInto(db, userId) {
  const meta = await readMeta(db);
  const due = !meta?.cursor || Date.now() - (meta.lastFullAt ?? 0) > FULL_EVERY_MS;
  let data = await get(due ? null : meta.cursor);
  if (data.user !== userId) return false; // signed in as someone else meanwhile: not this cache's answer
  if ((await applyCatalogue(db, data)).needsFull) {
    data = await get(null);
    if (data.user === userId) await applyCatalogue(db, data);
  }
  return true;
}

const asMeta = (data, refreshedAt) =>
  data && {
    refreshedAt,
    vatRates: data.vat_rates,
    barcodeRules: data.barcode_rules,
    tills: data.tills,
    branches: data.branches,
    settings: data.settings,
  };

/**
 * The till's catalogue (G26, ADR 0001): products, barcode rules, VAT rates, tills, branches and till settings, read
 * from RxDB so the till keeps finding and pricing products while the server can't be reached. Refreshed from
 * `GET /sales/catalogue/` (only changes, with a full load every 6 hours) on mount, every minute and on `refresh()`;
 * a failed refresh keeps what is cached and sets `error`. A cache belonging to another user (by the access token's
 * `user_id`) is wiped before anything is shown. If the browser database can't open, the catalogue is kept in memory
 * only (the till works online, not offline).
 */
export default function useTillCatalogue() {
  const { db, dbFailed } = useOffline();
  const userId = tokenUserId(useAuthStore((state) => state.accessToken));
  const [checkedFor, setCheckedFor] = useState(null);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const inMemory = !db && dbFailed;

  useEffect(() => {
    setCheckedFor(null);
    setProducts([]);
    setMeta(null);
    if (!db || userId === null) return undefined;
    let cancelled = false;
    const subscriptions = [];
    (async () => {
      const cached = await readMeta(db);
      if (cached && cached.owner?.user !== userId) await clearCatalogue(db);
      if (cancelled) return;
      subscriptions.push(
        db.catalogueProducts.find().$.subscribe((docs) => setProducts(docs.map((doc) => doc.toJSON().data))),
        db.catalogueMeta.findOne('catalogue').$.subscribe((doc) => setMeta(doc ? doc.toJSON().value : null))
      );
      setCheckedFor(userId);
    })();
    return () => {
      cancelled = true;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [db, userId]);

  const checked = userId !== null && checkedFor === userId;
  const query = useQuery({
    queryKey: ['tillCatalogue', userId, inMemory],
    enabled: userId !== null && (checked || inMemory),
    queryFn: () => (inMemory ? get(null) : fetchInto(db, userId)),
    refetchInterval: REFRESH_MS,
    retry: false,
  });
  const memory = inMemory && query.data?.user === userId ? query.data : null;
  const current = inMemory ? asMeta(memory, query.dataUpdatedAt) : meta;

  const { refetch } = query;
  const refresh = useCallback(() => refetch(), [refetch]);
  const rules = useMemo(() => (current?.barcodeRules ?? []).map(ruleFromApi), [current?.barcodeRules]);
  const saveTillSession = useCallback(
    (tillId, session) => (db ? saveSession(db, tillId, session) : Promise.resolve()),
    [db]
  );
  const readTillSession = useCallback((tillId) => (db ? readSession(db, tillId) : Promise.resolve(undefined)), [db]);

  return {
    ready: checked || inMemory,
    products: inMemory ? (memory?.products ?? []) : checked ? products : [],
    rules,
    vatRates: current?.vatRates ?? [],
    tills: current?.tills ?? [],
    branches: current?.branches ?? [],
    settings: current?.settings ?? null,
    refreshedAt: current?.refreshedAt ?? null,
    refresh,
    isRefreshing: query.isFetching,
    error: query.error,
    saveSession: saveTillSession,
    readSession: readTillSession,
  };
}

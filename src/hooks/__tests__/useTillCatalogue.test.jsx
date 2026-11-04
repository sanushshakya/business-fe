import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initRxDB } from '../../offlineDB';
import { OfflineProvider } from '../../offline/OfflineProvider';
import { applyCatalogue } from '../../offline/catalogue';
import useAuthStore from '../../stores/authStore';
import axios from '../../utils/axios';
import useTillCatalogue, { CATALOGUE_URL } from '../useTillCatalogue';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const token = (userId) => `x.${Buffer.from(JSON.stringify({ user_id: userId })).toString('base64url')}.y`;
const rice = { id: 1, name: 'Fake Rice', barcode: '5012345678900', price: '2.50', sold_by: 'each', stock_quantity: 4 };
const body = (overrides = {}) => ({
  cursor: '2026-11-04T12:00:00+00:00',
  full: true,
  user: 7,
  company: 3,
  products: [rice],
  removed: [],
  vat_rates: [],
  barcode_rules: [
    { id: 4, name: 'Fake', prefix: '21', item_code_length: 5, value_type: 'weight', decimals: 3, is_active: true },
  ],
  tills: [{ id: 9, branch: 5, number: 1, is_active: true }],
  branches: [{ id: 5, name: 'Fake High Street' }],
  settings: { manual_weight_max_kg: '25', offline_warn_hours: 4, offline_confirm_hours: 24, offline_stop_hours: 72 },
  ...overrides,
});

let db;
let catalogue;
const Probe = () => {
  catalogue = useTillCatalogue();
  return null;
};
const setup = async () => {
  db = await initRxDB({ name: `h${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <OfflineProvider createDb={async () => db}>
        <Probe />
      </OfflineProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().setTokens({ access_token: token(7), refresh_token: 'r' });
});
afterEach(async () => {
  await db?.destroy();
  db = null;
});

describe('useTillCatalogue', () => {
  it('loads everything first, then asks only for changes since the cursor', async () => {
    axios.get.mockResolvedValueOnce({ data: body() });
    await setup();
    await waitFor(() => expect(catalogue.products.map((p) => p.name)).toEqual(['Fake Rice']));
    expect(axios.get).toHaveBeenCalledWith(CATALOGUE_URL, { params: {} });
    expect(catalogue.rules).toHaveLength(1);
    expect(catalogue.tills).toEqual([{ id: 9, branch: 5, number: 1, is_active: true }]);
    expect(catalogue.refreshedAt).toEqual(expect.any(Number));

    axios.get.mockResolvedValueOnce({
      data: body({ full: false, cursor: '2026-11-04T12:01:00+00:00', products: [{ ...rice, price: '2.75' }] }),
    });
    await act(() => catalogue.refresh());
    expect(axios.get).toHaveBeenLastCalledWith(CATALOGUE_URL, { params: { since: '2026-11-04T12:00:00+00:00' } });
    await waitFor(() => expect(catalogue.products[0].price).toBe('2.75'));
  });

  it('keeps the cached data when a refresh fails, and says so', async () => {
    db = await initRxDB({ name: `h${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
    await applyCatalogue(db, body());
    const cached = db;
    axios.get.mockRejectedValue(new Error('Network Error'));
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <OfflineProvider createDb={async () => cached}>
          <Probe />
        </OfflineProvider>
      </QueryClientProvider>
    );
    await waitFor(() => expect(catalogue.error).toBeTruthy());
    expect(catalogue.products.map((p) => p.name)).toEqual(['Fake Rice']);
    expect(catalogue.settings.offline_warn_hours).toBe(4);
  });

  it('asks for everything when a delta cannot be applied', async () => {
    axios.get
      .mockResolvedValueOnce({ data: body({ full: false }) }) // a delta with nothing cached
      .mockResolvedValueOnce({ data: body() });
    await setup();
    await waitFor(() => expect(catalogue.products).toHaveLength(1));
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenLastCalledWith(CATALOGUE_URL, { params: {} });
  });

  it('loads everything again when the last full load is over 6 hours old (a safety net for missed changes)', async () => {
    db = await initRxDB({ name: `h${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
    const realNow = Date.now;
    Date.now = () => realNow() - 7 * 3_600_000;
    await applyCatalogue(db, body());
    Date.now = realNow;
    const cached = db;
    axios.get.mockResolvedValue({ data: body({ cursor: '2026-11-04T19:00:00+00:00' }) });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <OfflineProvider createDb={async () => cached}>
          <Probe />
        </OfflineProvider>
      </QueryClientProvider>
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(axios.get).toHaveBeenCalledWith(CATALOGUE_URL, { params: {} });
  });

  it('ignores an answer meant for another user', async () => {
    axios.get.mockResolvedValue({ data: body({ user: 8, company: 4 }) });
    await setup();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    await waitFor(() => expect(catalogue.isRefreshing).toBe(false));
    expect(catalogue.products).toEqual([]);
  });

  it('works from memory when the browser database cannot open', async () => {
    axios.get.mockResolvedValue({ data: body() });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <OfflineProvider createDb={() => Promise.reject(new Error('IndexedDB blocked'))}>
          <Probe />
        </OfflineProvider>
      </QueryClientProvider>
    );
    await waitFor(() => expect(catalogue.products.map((p) => p.name)).toEqual(['Fake Rice']));
    expect(catalogue.ready).toBe(true);
    expect(catalogue.tills).toHaveLength(1);
    expect(axios.get).toHaveBeenCalledWith(CATALOGUE_URL, { params: {} });
  });

  it("drops another user's cache before anything is shown", async () => {
    db = await initRxDB({ name: `h${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
    await applyCatalogue(db, body({ user: 8, company: 4 }));
    const cached = db;
    axios.get.mockRejectedValue(new Error('Network Error'));
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <OfflineProvider createDb={async () => cached}>
          <Probe />
        </OfflineProvider>
      </QueryClientProvider>
    );
    await waitFor(() => expect(catalogue.ready).toBe(true));
    expect(catalogue.products).toEqual([]);
    expect(catalogue.refreshedAt).toBeNull();
  });
});

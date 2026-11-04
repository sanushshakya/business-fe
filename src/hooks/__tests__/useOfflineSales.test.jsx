import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initRxDB } from '../../offlineDB';
import { OfflineProvider } from '../../offline/OfflineProvider';
import useOfflineSales from '../useOfflineSales';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

let db;
let offline;
const Probe = ({ till }) => {
  offline = useOfflineSales(till);
  return null;
};
afterEach(async () => {
  await db?.destroy();
  db = null;
});

describe('useOfflineSales', () => {
  it('queues, lists live and voids this till’s sales', async () => {
    db = await initRxDB({ name: `s${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OfflineProvider createDb={async () => db}>
          <Probe till="3" />
        </OfflineProvider>
      </QueryClientProvider>
    );
    await waitFor(() => expect(offline.available).toBe(true));
    await act(() =>
      offline.queue({
        sale: { client_ref: 'r1', session: 9, body: {}, receipt: { total: '2.50' } },
        tillId: 3,
        branchCode: 'HS',
        tillNumber: 1,
      })
    );
    await waitFor(() => expect(offline.sales.map((s) => s.client_ref)).toEqual(['r1']));
    await act(() => offline.voidSale('r1', 'Fake: wrong'));
    await waitFor(() => expect(offline.sales[0].status).toBe('voided'));
  });
});

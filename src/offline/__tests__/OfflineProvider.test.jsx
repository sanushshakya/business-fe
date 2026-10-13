import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SyncStatus from '../../components/SyncStatus';
import { initRxDB } from '../../offlineDB';
import axios from '../../utils/axios';
import { OfflineProvider, useOffline } from '../OfflineProvider';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const receipt = (n) => ({ product: 1, batch_number: `B-${n}`, quantity: 5, expiration_date: '2027-01-01' });

let offline;
let db;
const Probe = () => {
  offline = useOffline();
  return <SyncStatus />;
};

const setup = async () => {
  const createDb = vi.fn(async () => {
    db = await initRxDB({ name: `t${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
    return db;
  });
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <OfflineProvider createDb={createDb}>
        <Probe />
      </OfflineProvider>
    </QueryClientProvider>
  );
  await waitFor(() => expect(offline.ready).toBe(true));
  return { invalidate };
};

const setOnline = (value) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });

beforeEach(() => {
  vi.clearAllMocks();
  setOnline(false);
});
afterEach(async () => {
  await db?.destroy();
  db = null;
  setOnline(true);
});

describe('OfflineProvider', () => {
  it('queues receipts and shows how many are waiting', async () => {
    await setup();
    await act(() => offline.queueReceipt(receipt(1)));
    await act(() => offline.queueReceipt(receipt(2)));
    expect(await screen.findByText('2 waiting to sync')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sends queued receipts when the browser comes back online and refreshes lists', async () => {
    axios.post.mockResolvedValue({});
    const { invalidate } = await setup();
    await act(() => offline.queueReceipt(receipt(1)));

    setOnline(true);
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith('/inventory/batches/', receipt(1));
    await waitFor(() => expect(screen.queryByText(/waiting to sync/)).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['list'] });
    expect((await db.stockReceipts.find().exec())[0].synced).toBe(true);
  });

  it('keeps everything queued when the network drops mid-sync', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));
    await setup();
    await act(() => offline.queueReceipt(receipt(1)));
    await act(() => offline.queueReceipt(receipt(2)));

    await act(async () => {
      await offline.flush().catch(() => {});
    });

    expect(axios.post).toHaveBeenCalledTimes(1); // stopped at the first failure
    expect(await screen.findByText('2 waiting to sync')).toBeInTheDocument();
  });

  it('treats a 5xx as retryable, not as a rejection', async () => {
    axios.post.mockRejectedValue({ response: { status: 503 } });
    await setup();
    await act(() => offline.queueReceipt(receipt(1)));
    await act(async () => {
      await offline.flush().catch(() => {});
    });
    expect(await screen.findByText('1 waiting to sync')).toBeInTheDocument();
    expect(screen.queryByText(/rejected/)).toBeNull();
  });

  it('marks a rejected receipt instead of retrying it forever, and can retry on request', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 400 } });
    axios.post.mockResolvedValue({});
    await setup();
    await act(() => offline.queueReceipt(receipt(1)));
    await act(() => offline.queueReceipt(receipt(2)));

    await act(async () => {
      await offline.flush();
    });
    expect(axios.post).toHaveBeenCalledTimes(2); // the second still went through
    expect(await screen.findByText('1 rejected')).toBeInTheDocument();

    await act(async () => {
      await offline.flush();
    });
    expect(axios.post).toHaveBeenCalledTimes(2); // rejected one is not retried automatically

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.queryByText('1 rejected')).toBeNull());
  });

  it('does not send the same receipt twice for overlapping flushes', async () => {
    let release;
    axios.post.mockImplementation(() => new Promise((resolve) => (release = resolve)));
    await setup();
    await act(() => offline.queueReceipt(receipt(1)));

    let first;
    let second;
    act(() => {
      first = offline.flush();
      second = offline.flush();
    });
    expect(first).toBe(second);
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    await act(async () => {
      release({});
      await first;
    });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe('useOffline', () => {
  it('requires the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('inside <OfflineProvider>');
    vi.restoreAllMocks();
  });
});

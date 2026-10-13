import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useSyncManager from '../useSyncManager';

describe('useSyncManager', () => {
  it('flushes queued batches when the browser comes back online', async () => {
    const processBatch = vi.fn().mockResolvedValue();
    const onNetworkOnline = vi.fn();
    const onNetworkOffline = vi.fn();
    const { result } = renderHook(() => useSyncManager({ processBatch, onNetworkOnline, onNetworkOffline }));

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(onNetworkOffline).toHaveBeenCalledTimes(1);
    expect(result.current.isOnline).toBe(false);
    expect(processBatch).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(onNetworkOnline).toHaveBeenCalledTimes(1);
    expect(processBatch).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.syncCount).toBe(1));
    expect(result.current.isSyncing).toBe(false);
  });

  it('exposes a failed sync without counting it', async () => {
    const processBatch = vi.fn().mockRejectedValue(new Error('server down'));
    const { result } = renderHook(() => useSyncManager({ processBatch }));
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.error.message).toBe('server down');
    expect(result.current.syncCount).toBe(0);
  });

  it('stops listening after unmount', () => {
    const processBatch = vi.fn().mockResolvedValue();
    const { unmount } = renderHook(() => useSyncManager({ processBatch }));
    unmount();
    window.dispatchEvent(new Event('online'));
    expect(processBatch).not.toHaveBeenCalled();
  });
});

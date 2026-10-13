import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useNetworkStatus from '../useNetworkStatus';

const setOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });
  window.dispatchEvent(new Event(value ? 'online' : 'offline'));
};

describe('useNetworkStatus', () => {
  it('follows online/offline events and calls back when reconnecting', () => {
    setOnline(true);
    const onReconnect = vi.fn();
    const { result } = renderHook(() => useNetworkStatus(onReconnect));
    expect(result.current).toBe(true);

    act(() => setOnline(false));
    expect(result.current).toBe(false);
    expect(onReconnect).not.toHaveBeenCalled();

    act(() => setOnline(true));
    expect(result.current).toBe(true);
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });
});

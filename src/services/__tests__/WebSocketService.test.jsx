import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useWebSocketService from '../WebSocketService';

let instances;

class FakeSocket {
  constructor(url) {
    this.url = url;
    this.close = vi.fn(() => this.onclose?.());
    instances.push(this);
  }
}

beforeEach(() => {
  instances = [];
  vi.stubGlobal('WebSocket', FakeSocket);
});
afterEach(() => vi.unstubAllGlobals());

describe('useWebSocketService', () => {
  it('opens nothing without a url', () => {
    renderHook(() => useWebSocketService(undefined));
    expect(instances).toHaveLength(0);
  });

  it('connects on mount, reports open, and closes on unmount', () => {
    const { result, unmount } = renderHook(() => useWebSocketService('ws://localhost/ws/sync/'));
    expect(instances).toHaveLength(1);
    expect(result.current.isOpen).toBe(false);

    act(() => instances[0].onopen());
    expect(result.current.isOpen).toBe(true);

    unmount();
    expect(instances[0].close).toHaveBeenCalled();
  });

  it('reconnects with a fresh socket after disconnect', () => {
    const { result } = renderHook(() => useWebSocketService('ws://localhost/ws/sync/'));
    act(() => result.current.disconnect());
    expect(result.current.socket).toBeNull();
    act(() => result.current.connect());
    expect(instances).toHaveLength(2);
    expect(result.current.socket).toBe(instances[1]);
  });
});

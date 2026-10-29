import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useStorefrontSync, { socketUrl } from '../useStorefrontSync';

class FakeSocket {
  static instances = [];

  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.closed = false;
    FakeSocket.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  open() {
    this.onopen?.();
  }

  message(data) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  drop(code = 1006) {
    this.onclose?.({ code });
  }
}

describe('useStorefrontSync', () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('builds the socket url from the page or VITE_API_URL', () => {
    expect(socketUrl('', { protocol: 'https:', host: 'iq.example' })).toBe('wss://iq.example/ws/sync/');
    expect(socketUrl('http://localhost:8000', { protocol: 'https:', host: 'x' })).toBe('ws://localhost:8000/ws/sync/');
  });

  it('opens nothing without a token', () => {
    renderHook(() => useStorefrontSync(null));
    expect(FakeSocket.instances).toHaveLength(0);
  });

  it('sends the token as a subprotocol and keeps the latest status', () => {
    const { result } = renderHook(() => useStorefrontSync('tok'));
    const socket = FakeSocket.instances[0];
    expect(socket.protocols).toEqual(['bearer', 'tok']);
    act(() => {
      socket.open();
      socket.message({ type: 'sync.status', state: 'amber', backlog: 2 });
    });
    expect(result.current.status.state).toBe('amber');
    expect(result.current.disconnected).toBe(false);
    act(() => socket.message({ type: 'other' }));
    expect(result.current.status.state).toBe('amber');
  });

  it('reconnects after a drop, waiting longer each time', () => {
    const { result } = renderHook(() => useStorefrontSync('tok'));
    act(() => FakeSocket.instances[0].drop());
    expect(result.current.disconnected).toBe(true);
    act(() => vi.advanceTimersByTime(999));
    expect(FakeSocket.instances).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(FakeSocket.instances).toHaveLength(2);
    act(() => FakeSocket.instances[1].drop());
    act(() => vi.advanceTimersByTime(1999));
    expect(FakeSocket.instances).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1));
    expect(FakeSocket.instances).toHaveLength(3);
  });

  it('asks for a new token instead of retrying when the server says sign in again (4401)', () => {
    const signInAgain = vi.fn();
    const { result } = renderHook(() => useStorefrontSync('old', signInAgain));
    act(() => FakeSocket.instances[0].drop(4401));
    expect(signInAgain).toHaveBeenCalledTimes(1);
    expect(result.current.disconnected).toBe(true);
    act(() => vi.advanceTimersByTime(60000));
    expect(FakeSocket.instances).toHaveLength(1); // the refreshed token reopens it, not a timer
  });

  it('ignores a status older than the one it already has', () => {
    const { result } = renderHook(() => useStorefrontSync('tok'));
    const socket = FakeSocket.instances[0];
    act(() => {
      socket.message({ type: 'sync.status', state: 'green', as_of: '2026-10-29T10:00:02+00:00' });
      socket.message({ type: 'sync.status', state: 'amber', as_of: '2026-10-29T10:00:01+00:00' });
    });
    expect(result.current.status.state).toBe('green');
  });

  it('closes the socket on unmount and when the token changes', () => {
    const { rerender, unmount } = renderHook(({ token }) => useStorefrontSync(token), { initialProps: { token: 'a' } });
    rerender({ token: 'b' });
    expect(FakeSocket.instances[0].closed).toBe(true);
    expect(FakeSocket.instances[1].protocols).toEqual(['bearer', 'b']);
    unmount();
    expect(FakeSocket.instances[1].closed).toBe(true);
    act(() => vi.advanceTimersByTime(60000));
    expect(FakeSocket.instances).toHaveLength(2);
  });
});

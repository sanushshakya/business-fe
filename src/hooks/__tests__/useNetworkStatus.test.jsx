import { renderHook, act } from '@testing-library/react-hooks';
import useNetworkStatus from '../useNetworkStatus';

describe('useNetworkStatus hook', () => {
  it('should return initial network status as true', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('should update network status to false when offline event is dispatched', () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    waitForNextUpdate();
    expect(result.current.isOnline).toBe(false);
  });

  it('should update network status to true when online event is dispatched', () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    waitForNextUpdate();
    expect(result.current.isOnline).toBe(true);
  });
});
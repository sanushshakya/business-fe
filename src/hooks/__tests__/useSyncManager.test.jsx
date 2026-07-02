// src/hooks/__tests__/useSyncManager.test.jsx

import { renderHook, act } from '@testing-library/react-hooks';
import useSyncManager from '../useSyncManager';

describe('useSyncManager Hook', () => {
  test('should update syncing state correctly during record count update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSyncManager());

    // Initial state should be 'idle'
    expect(result.current.syncingState).toBe('idle');

    // Simulate updating record count
    act(() => {
      result.current.updateRecordCount(10);
    });

    // State should now be 'syncing'
    await waitForNextUpdate();
    expect(result.current.syncingState).toBe('syncing');

    // Simulate completion of update
    act(() => {
      result.current.completeUpdate();
    });

    // State should return to 'idle' after completion
    await waitForNextUpdate();
    expect(result.current.syncingState).toBe('idle');
  });
});
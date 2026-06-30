import React from 'react';
import useSyncManager from '../useSyncManager';

describe('useSyncManager', () => {
  it('should call onNetworkOnline when network status changes to online', async () => {
    const mockOnNetworkOnline = jest.fn();
    const { networkStatus } = useSyncManager({ onNetworkOnline: mockOnNetworkOnline });

    // Simulate network status change to online
    networkStatus.set(true);

    expect(mockOnNetworkOnline).toHaveBeenCalled();
  });

  it('should call onNetworkOffline when network status changes to offline', async () => {
    const mockOnNetworkOffline = jest.fn();
    const { networkStatus } = useSyncManager({ onNetworkOffline: mockOnNetworkOffline });

    // Simulate network status change to offline
    networkStatus.set(false);

    expect(mockOnNetworkOffline).toHaveBeenCalled();
  });

  it('should call both callbacks when network status changes', async () => {
    const mockOnNetworkOnline = jest.fn();
    const mockOnNetworkOffline = jest.fn();
    const { networkStatus } = useSyncManager({ onNetworkOnline: mockOnNetworkOnline, onNetworkOffline: mockOnNetworkOffline });

    // Simulate network status change to online
    networkStatus.set(true);
    expect(mockOnNetworkOnline).toHaveBeenCalled();

    // Simulate network status change to offline
    networkStatus.set(false);
    expect(mockOnNetworkOffline).toHaveBeenCalled();
  });
});
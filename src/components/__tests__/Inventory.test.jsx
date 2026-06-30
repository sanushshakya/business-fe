import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Inventory from '../Inventory';

// Mock the useNetworkStatus hook to simulate network status changes
jest.mock('../../hooks/useNetworkStatus');

describe('Inventory Component Test', () => {
  beforeEach(() => {
    // Reset mock implementations before each test
    jest.clearAllMocks();
  });

  it('should render inventory list when Wi-Fi is disabled', async () => {
    // Mock useNetworkStatus to return false (Wi-Fi is disabled)
    const useNetworkStatusMock = require('../../hooks/useNetworkStatus');
    useNetworkStatusMock.useNetworkStatus.mockReturnValue(false);

    // Render the Inventory component
    render(<Inventory />);

    // Wait for the inventory list to be visible
    await waitFor(() => {
      const inventoryItems = screen.getAllByTestId('inventory-item');
      expect(inventoryItems).toHaveLength(3); // Assuming there are 3 items in the inventory list
    });
  });

  it('should display an error message when Wi-Fi is disabled and data cannot be fetched', async () => {
    // Mock useNetworkStatus to return false (Wi-Fi is disabled)
    const useNetworkStatusMock = require('../../hooks/useNetworkStatus');
    useNetworkStatusMock.useNetworkStatus.mockReturnValue(false);

    // Render the Inventory component
    render(<Inventory />);

    // Wait for the error message to be visible
    await waitFor(() => {
      const errorMessage = screen.getByText('Failed to load inventory. Please check your Wi-Fi connection.');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should show a loading state when Wi-Fi is enabled but data is still being fetched', async () => {
    // Mock useNetworkStatus to return true (Wi-Fi is enabled)
    const useNetworkStatusMock = require('../../hooks/useNetworkStatus');
    useNetworkStatusMock.useNetworkStatus.mockReturnValue(true);

    // Render the Inventory component
    render(<Inventory />);

    // Wait for the loading state to be visible
    await waitFor(() => {
      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeInTheDocument();
    });
  });
});
```

This Jest test case ensures that the `Inventory` component renders correctly when Wi-Fi is disabled and handles both successful data fetching and error scenarios. The mock for `useNetworkStatus` is used to simulate different network states, allowing us to verify the behavior of the component in each scenario.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EventCard from '../EventCard';
import useInventory from '../../../hooks/useInventory';

jest.mock('../../../hooks/useInventory', () => {
  return jest.fn();
});

describe('EventCard Component', () => {
  const mockData = [
    {
      id: '1',
      name: 'Event A',
      date: new Date('2023-10-01T12:00:00Z'),
      location: 'Location X',
    },
    {
      id: '2',
      name: 'Event B',
      date: new Date('2023-10-15T14:00:00Z'),
      location: 'Location Y',
    },
  ];

  beforeEach(() => {
    useInventory.mockImplementation(() => ({
      inventoryData: mockData,
      isLoading: false,
      error: null,
    }));
  });

  it('renders the EventCard component with data fetched from RxDB', async () => {
    render(<EventCard />);

    await waitFor(() => {
      expect(screen.getByText('Event A')).toBeInTheDocument();
      expect(screen.getByText('Event B')).toBeInTheDocument();
      expect(screen.getByText('Location X')).toBeInTheDocument();
      expect(screen.getByText('Location Y')).toBeInTheDocument();
    });
  });

  it('displays loading state while data is being fetched', () => {
    useInventory.mockImplementation(() => ({
      inventoryData: [],
      isLoading: true,
      error: null,
    }));

    render(<EventCard />);

    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });

  it('displays error message if an error occurs while fetching data', () => {
    useInventory.mockImplementation(() => ({
      inventoryData: [],
      isLoading: false,
      error: 'An error occurred',
    }));

    render(<EventCard />);

    expect(screen.getByText(/an error occurred/)).toBeInTheDocument();
  });
});
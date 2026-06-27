import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventDates from '../EventDates'; // Import the component to be tested

// Mock the useFetch hook to simulate fetching data
jest.mock('../hooks/useFetch', () => ({
  useFetch: jest.fn(),
}));

describe('EventDates Component', () => {
  beforeEach(() => {
    // Reset mock implementations before each test
    jest.clearAllMocks();
  });

  it('should render loading state while fetching event dates', async () => {
    // Mock the useFetch hook to return a loading state
    (useFetch as jest.Mock).mockReturnValue({
      isLoading: true,
      error: null,
      data: null,
    });

    render(<EventDates />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display event dates when fetched successfully', async () => {
    // Mock the useFetch hook to return successful data
    const mockEvents = [
      { date: '2023-10-01', description: 'Event A' },
      { date: '2023-10-05', description: 'Event B' },
    ];
    (useFetch as jest.Mock).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockEvents,
    });

    render(<EventDates />);

    // Check if the event dates are displayed
    mockEvents.forEach((event) => {
      expect(screen.getByText(event.description)).toBeInTheDocument();
    });
  });

  it('should display an error message when fetching fails', async () => {
    // Mock the useFetch hook to return an error state
    (useFetch as jest.Mock).mockReturnValue({
      isLoading: false,
      error: 'Failed to fetch event dates',
      data: null,
    });

    render(<EventDates />);

    expect(screen.getByText('Failed to fetch event dates')).toBeInTheDocument();
  });
});
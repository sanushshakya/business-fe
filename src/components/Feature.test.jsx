// src/components/Feature.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Feature from './Feature';

describe('Feature Component', () => {
  it('renders the KPI cards with correct data', () => {
    // Mock the data for the KPI cards
    const mockData = {
      totalStockValue: '$100,000',
      grossMarginPercentage: '25%',
      activeAlertsCount: '5',
      wasteSavedByWasteSaver: '30%'
    };

    // Render the Feature component with the mocked data
    render(<Feature {...mockData} />);

    // Check if the KPI cards are rendered correctly
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('displays an error message if the data fails to load', () => {
    // Mock a failure scenario where data loading fails
    const mockData = {
      totalStockValue: null,
      grossMarginPercentage: null,
      activeAlertsCount: null,
      wasteSavedByWasteSaver: null
    };

    // Render the Feature component with the mocked data
    render(<Feature {...mockData} />);

    // Check if the error message is displayed
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('calls the onRefresh function when the refresh button is clicked', () => {
    // Mock the onRefresh function
    const mockOnRefresh = jest.fn();

    // Render the Feature component with the mocked onRefresh function
    render(<Feature onRefresh={mockOnRefresh} />);

    // Find the refresh button and click it
    fireEvent.click(screen.getByText('Refresh'));

    // Check if the onRefresh function is called
    expect(mockOnRefresh).toHaveBeenCalled();
  });
});
// tests/RecentAlertsSummary.test.jsx

import React from 'react';
import { render } from '@testing-library/react';
import RecentAlertsSummary from '../src/views/RecentAlertsSummary';

describe('RecentAlertsSummary', () => {
  it('renders the component with no alerts', () => {
    const { getByText } = render(<RecentAlertsSummary alerts={[]} />);
    expect(getByText(/No recent alerts/i)).toBeInTheDocument();
  });

  it('renders the component with demand alerts', () => {
    const demandAlerts = [
      { id: '1', type: 'demand', title: 'High Demand Alert' },
      { id: '2', type: 'demand', title: 'Medium Demand Alert' },
    ];
    const { getByText } = render(<RecentAlertsSummary alerts={demandAlerts} />);
    expect(getByText('High Demand Alert')).toBeInTheDocument();
    expect(getByText('Medium Demand Alert')).toBeInTheDocument();
  });

  it('renders the component with stock alerts', () => {
    const stockAlerts = [
      { id: '1', type: 'stock', title: 'Low Stock Alert' },
      { id: '2', type: 'stock', title: 'Out of Stock Alert' },
    ];
    const { getByText } = render(<RecentAlertsSummary alerts={stockAlerts} />);
    expect(getByText('Low Stock Alert')).toBeInTheDocument();
    expect(getByText('Out of Stock Alert')).toBeInTheDocument();
  });

  it('renders the component with freight alerts', () => {
    const freightAlerts = [
      { id: '1', type: 'freight', title: 'Freight Delay Alert' },
      { id: '2', type: 'freight', title: 'Freight Damaged Alert' },
    ];
    const { getByText } = render(<RecentAlertsSummary alerts={freightAlerts} />);
    expect(getByText('Freight Delay Alert')).toBeInTheDocument();
    expect(getByText('Freight Damaged Alert')).toBeInTheDocument();
  });

  it('renders the component with a mix of alerts', () => {
    const mixedAlerts = [
      { id: '1', type: 'demand', title: 'High Demand Alert' },
      { id: '2', type: 'stock', title: 'Low Stock Alert' },
      { id: '3', type: 'freight', title: 'Freight Delay Alert' },
    ];
    const { getByText } = render(<RecentAlertsSummary alerts={mixedAlerts} />);
    expect(getByText('High Demand Alert')).toBeInTheDocument();
    expect(getByText('Low Stock Alert')).toBeInTheDocument();
    expect(getByText('Freight Delay Alert')).toBeInTheDocument();
  });
});
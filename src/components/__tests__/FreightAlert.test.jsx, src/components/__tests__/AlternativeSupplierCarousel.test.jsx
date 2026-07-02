// src/components/__tests__/FreightAlert.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import FreightAlert from '../../components/FreightAlert';

// Mock data for testing the FreightAlert component
const mockFreightAlert = {
  id: '1',
  type: 'Disruption',
  description: 'A disruption is expected on route ABC.',
  impact: 'High',
  timestamp: new Date().toISOString(),
};

describe('FreightAlert Component', () => {
  it('renders the alert information correctly', () => {
    render(<FreightAlert alert={mockFreightAlert} />);

    expect(screen.getByText(/A disruption is expected on route ABC./i)).toBeInTheDocument();
    expect(screen.getByText(/High impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Disruption/i)).toBeInTheDocument();
  });
});

// src/components/__tests__/AlternativeSupplierCarousel.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import AlternativeSupplierCarousel from '../../components/AlternativeSupplierCarousel';

// Mock data for testing the AlternativeSupplierCarousel component
const mockSuppliers = [
  {
    id: '1',
    name: 'Supplier A',
    address: '123 Street, City',
    phone: '123-456-7890',
  },
  {
    id: '2',
    name: 'Supplier B',
    address: '456 Street, City',
    phone: '098-765-4321',
  },
];

describe('AlternativeSupplierCarousel Component', () => {
  it('renders the carousel with supplier information correctly', async () => {
    render(<AlternativeSupplierCarousel suppliers={mockSuppliers} />);

    expect(screen.getByText(/Supplier A/i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier B/i)).toBeInTheDocument();

    // Verify that the carousel is displaying both suppliers
    const carousels = await screen.findAllByRole('listitem');
    expect(carousels).toHaveLength(mockSuppliers.length);
  });
});
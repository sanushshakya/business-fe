import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Feature from './Feature';

describe('Feature component', () => {
  it('renders the company tab correctly', () => {
    render(<Feature activeTab="company" />);
    
    // Check if the Company tab content is rendered
    expect(screen.getByText(/Company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/edit name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/registration number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/logo upload/i)).toBeInTheDocument();
  });

  it('renders the branches tab correctly', () => {
    render(<Feature activeTab="branches" />);
    
    // Check if the Branches tab content is rendered
    expect(screen.getByText(/Branches/i)).toBeInTheDocument();
    // Assuming there's a list or table for branches
    expect(screen.getAllByRole('row')).toHaveLength(2); // 1 header row + 1 data row
  });

  it('renders the integrations tab correctly', () => {
    render(<Feature activeTab="integrations" />);
    
    // Check if the Integrations tab content is rendered
    expect(screen.getByText(/Integrations/i)).toBeInTheDocument();
    expect(screen.getByText(/Shopify connection status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
  });
});
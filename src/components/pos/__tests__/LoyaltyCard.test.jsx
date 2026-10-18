import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoyaltyCard from '../LoyaltyCard';
import Receipt from '../Receipt';

const customer = { first_name: 'Amira', points_balance: 240, tier: 'Bronze', points_gbp_value: '2.40' };

describe('LoyaltyCard', () => {
  it('submits the scanned code on Enter', () => {
    const onScan = vi.fn();
    render(<LoyaltyCard value={null} status="idle" onScan={onScan} onClear={() => {}} />);
    const input = screen.getByLabelText('Loyalty card');
    fireEvent.change(input, { target: { value: ' 2995520383161 ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onScan).toHaveBeenCalledWith('2995520383161');
    expect(input).toHaveValue('');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onScan).toHaveBeenCalledTimes(1); // nothing typed, nothing looked up
  });

  it('shows name and balance when found, and can be removed', () => {
    const onClear = vi.fn();
    render(<LoyaltyCard value={customer} status="found" onScan={() => {}} onClear={onClear} />);
    expect(screen.getByText('Amira')).toBeInTheDocument();
    expect(screen.getByText(/240 points/)).toHaveTextContent('240 points (£2.40)');
    expect(screen.queryByLabelText('Loyalty card')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove card' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('shows unavailable message', () => {
    render(<LoyaltyCard value={null} status="unavailable" onScan={() => {}} onClear={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loyalty unavailable — sale will go through without points');
    expect(screen.getByLabelText('Loyalty card')).toBeInTheDocument(); // can scan again
  });

  it('shows not found, loading and other errors', () => {
    const { rerender } = render(<LoyaltyCard value={null} status="not_found" onScan={() => {}} onClear={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Card not recognised');
    rerender(<LoyaltyCard value={null} status="loading" onScan={() => {}} onClear={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Looking up card…');
    rerender(
      <LoyaltyCard
        value={null}
        status="error"
        message="Loyalty is not connected."
        onScan={() => {}}
        onClear={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loyalty is not connected.');
  });
});

describe('Receipt loyalty line', () => {
  const sale = {
    receipt_number: 'S-000001',
    created_at: '2026-10-14T09:05:00Z',
    status: 'completed',
    payment_method: 'card',
    total: '5.00',
    amount_tendered: '5.00',
    items: [],
  };

  it('says points will be added only for a loyalty sale', () => {
    const { rerender } = render(<Receipt sale={sale} loyalty={customer} />);
    expect(screen.getByText('Loyalty: Amira · points will be added')).toBeInTheDocument();
    rerender(<Receipt sale={sale} />);
    expect(screen.queryByText(/Loyalty:/)).not.toBeInTheDocument();
  });
});

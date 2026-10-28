import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PendingPriceChanges from '../PendingPriceChanges';

const pending = {
  id: 4,
  product: 1,
  old_price: '1.99',
  new_price: '1.79',
  reason: 'nearly out of date',
  source: 'decay_markdown',
  requested_by_name: null,
  changed_at: '2026-10-19T09:00:00Z',
  is_approved: false,
  is_rejected: false,
};
const manual = {
  ...pending,
  id: 5,
  product: 2,
  reason: 'new supplier price',
  source: 'manual',
  requested_by_name: 'Sam',
};
const approved = { ...pending, id: 3, is_approved: true };
const rejected = { ...pending, id: 2, is_rejected: true };
const names = { 1: 'Shin Ramyun', 2: 'Basmati 5kg' };

describe('PendingPriceChanges', () => {
  it('lists only changes still waiting for a decision', () => {
    render(<PendingPriceChanges logs={[pending, approved, rejected, manual]} productNames={names} />);
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + the two pending ones
    expect(screen.getByText('Shin Ramyun')).toBeInTheDocument();
    expect(screen.getAllByText(/£1\.99 → £1\.79/)).toHaveLength(2);
    expect(screen.getAllByText('(-10%)')).toHaveLength(2);
  });

  it('shows the reason, the source and who asked', () => {
    render(<PendingPriceChanges logs={[pending, manual]} productNames={names} />);
    expect(screen.getByText('nearly out of date')).toBeInTheDocument();
    expect(screen.getByText('Near-expiry markdown')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Nightly job')).toBeInTheDocument(); // a markdown has no person behind it
  });

  it('calls back with the change and the optional note', async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <PendingPriceChanges logs={[pending, manual]} productNames={names} onApprove={onApprove} onReject={onReject} />
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Note for Shin Ramyun' }), 'fine for the weekend');
    await userEvent.click(screen.getByRole('button', { name: 'Approve Shin Ramyun' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reject Basmati 5kg' }));
    expect(onApprove).toHaveBeenCalledWith(pending, 'fine for the weekend');
    expect(onReject).toHaveBeenCalledWith(manual, '');
  });

  it('disables the buttons while a decision is saving', () => {
    render(<PendingPriceChanges logs={[pending]} busyId={4} />);
    expect(screen.getByRole('button', { name: 'Approve Product #1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Approve Product #1' })).toHaveTextContent('Saving…');
    expect(screen.getByRole('button', { name: 'Reject Product #1' })).toBeDisabled();
  });

  it('says when nothing is waiting', () => {
    render(<PendingPriceChanges logs={[approved, rejected]} />);
    expect(screen.getByText('No price changes waiting for a decision.')).toBeInTheDocument();
  });
});

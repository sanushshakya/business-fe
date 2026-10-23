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
  reason: 'decay_markdown',
  changed_at: '2026-10-19T09:00:00Z',
  is_approved: false,
};
const approved = { ...pending, id: 3, is_approved: true };

describe('PendingPriceChanges', () => {
  it('lists only changes waiting for approval', () => {
    render(<PendingPriceChanges logs={[pending, approved]} productNames={{ 1: 'Shin Ramyun' }} />);
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + the pending one
    expect(screen.getByText('Shin Ramyun')).toBeInTheDocument();
    expect(screen.getByText(/£1\.99 → £1\.79/)).toBeInTheDocument();
    expect(screen.getByText('(-10%)')).toBeInTheDocument();
    expect(screen.getByText('Near-expiry markdown')).toBeInTheDocument();
  });

  it('hides the decision buttons from non-staff', () => {
    render(<PendingPriceChanges logs={[pending]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Product #1')).toBeInTheDocument();
  });

  it('calls back with the change on approve and reject', async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <PendingPriceChanges
        logs={[pending]}
        productNames={{ 1: 'Shin Ramyun' }}
        canDecide
        onApprove={onApprove}
        onReject={onReject}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Approve Shin Ramyun' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reject Shin Ramyun' }));
    expect(onApprove).toHaveBeenCalledWith(pending);
    expect(onReject).toHaveBeenCalledWith(pending);
  });

  it('disables the buttons while a decision is saving', () => {
    render(<PendingPriceChanges logs={[pending]} canDecide busyId={4} />);
    expect(screen.getByRole('button', { name: 'Approve Product #1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Approve Product #1' })).toHaveTextContent('Saving…');
    expect(screen.getByRole('button', { name: 'Reject Product #1' })).toBeDisabled();
  });

  it('says when nothing is waiting', () => {
    render(<PendingPriceChanges logs={[approved]} />);
    expect(screen.getByText('No price changes waiting for approval.')).toBeInTheDocument();
  });
});

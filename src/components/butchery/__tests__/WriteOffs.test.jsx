import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WriteOffForm from '../WriteOffForm';
import WriteOffList from '../WriteOffList';

const LOCATIONS = [{ id: 7, code: 'SHOP-1', name: 'Fake shop floor', type: 'shop_floor', is_active: true }];
const PRODUCTS = [
  { id: 1, name: 'Fake Rice', sold_by: 'each', is_catch_weight: false },
  { id: 2, name: 'Fake Mince', sold_by: 'weight', is_catch_weight: false },
];
const BATCHES = [
  { id: 40, product: 1, batch_number: 'RICE-1', quantity: 10, weight_kg: '0.000', expiration_date: '2026-11-20' },
  { id: 41, product: 2, batch_number: 'MINCE-1', quantity: 0, weight_kg: '5.000', expiration_date: '2026-11-08' },
];
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const renderForm = (onSubmit = vi.fn().mockResolvedValue({ status: 'written_off', reference: 'WO-000001' })) => {
  render(
    <WriteOffForm
      locations={LOCATIONS}
      location={7}
      onLocationChange={vi.fn()}
      batches={BATCHES}
      products={PRODUCTS}
      onSubmit={onSubmit}
    />
  );
  return onSubmit;
};

describe('WriteOffForm', () => {
  it('asks for a quantity for each products and sends it', async () => {
    const onSubmit = renderForm();
    type('Batch', '40');
    expect(screen.queryByLabelText('Weight (kg)')).toBeNull();
    type('Quantity', '3');
    type('Reason', 'damaged');
    type('Note (optional)', ' Fake: dropped ');
    fireEvent.click(screen.getByRole('button', { name: 'Write off' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ batch: 40, reason: 'damaged', quantity: 3, note: 'Fake: dropped' })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('WO-000001 written off.');
  });

  it('asks for kg for loose products and says when it waits for approval', async () => {
    const onSubmit = renderForm(
      vi.fn().mockResolvedValue({ status: 'pending', reference: 'WO-000002', cost: '60.00' })
    );
    type('Batch', '41');
    expect(screen.queryByLabelText('Quantity')).toBeNull();
    type('Weight (kg)', '1,25');
    type('Reason', 'expired');
    fireEvent.click(screen.getByRole('button', { name: 'Write off' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ batch: 41, reason: 'expired', weight_kg: '1.250', note: '' })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('WO-000002 is waiting for a manager to approve it.');
  });

  it('needs a batch, a reason and an amount', () => {
    const onSubmit = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Write off' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a batch and a reason.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

const WRITE_OFF = {
  id: 5,
  reference: 'WO-000005',
  product_name: 'Fake Mince',
  batch_number: 'MINCE-1',
  reason: 'expired',
  quantity: 0,
  weight_kg: '1.250',
  cost: '60.00',
  status: 'pending',
  created_by: 3,
  created_at: '2026-11-04T10:00:00Z',
};

describe('WriteOffList', () => {
  it('lets staff approve or reject what someone else raised', () => {
    const onDecide = vi.fn();
    render(<WriteOffList writeOffs={[WRITE_OFF]} me={{ id: 9, is_staff: true }} onDecide={onDecide} />);
    expect(screen.getByText('1.250 kg')).toBeInTheDocument();
    expect(screen.getByText('£60.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Approve WO-000005' }));
    expect(onDecide).toHaveBeenCalledWith(WRITE_OFF, 'approve');
    fireEvent.click(screen.getByRole('button', { name: 'Reject WO-000005' }));
    expect(onDecide).toHaveBeenCalledWith(WRITE_OFF, 'reject');
  });

  it('hides the decision from whoever raised it and from the stock role', () => {
    const { rerender } = render(
      <WriteOffList writeOffs={[WRITE_OFF]} me={{ id: 3, is_staff: true }} onDecide={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /Approve/ })).toBeNull();
    expect(screen.getByText('Needs another manager')).toBeInTheDocument();
    rerender(
      <WriteOffList writeOffs={[WRITE_OFF]} me={{ id: 4, is_staff: false, role: 'stock' }} onDecide={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /Approve/ })).toBeNull();
  });

  it('shows "No cost" when the batch had none', () => {
    render(
      <WriteOffList
        writeOffs={[{ ...WRITE_OFF, cost: null, status: 'written_off' }]}
        me={{ id: 9 }}
        onDecide={vi.fn()}
      />
    );
    expect(screen.getByText('No cost')).toBeInTheDocument();
  });
});

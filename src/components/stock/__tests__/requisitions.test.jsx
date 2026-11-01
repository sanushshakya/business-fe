import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FulfilForm from '../FulfilForm';
import RequisitionForm from '../RequisitionForm';
import RequisitionTable from '../RequisitionTable';
import { LOCATIONS, PRODUCTS } from './fixtures';

const requisition = (fields = {}) => ({
  id: 3,
  reference: 'R-000003',
  location: 7,
  status: 'partly_fulfilled',
  note: '',
  transfers: [5],
  lines: [
    { id: 31, product: 4, quantity: 10, fulfilled_quantity: 4, open_quantity: 6 },
    { id: 32, product: 5, quantity: 2, fulfilled_quantity: 2, open_quantity: 0 },
  ],
  ...fields,
});

describe('RequisitionForm', () => {
  it('offers only store locations and sends the lines', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<RequisitionForm locations={LOCATIONS} products={PRODUCTS} onSubmit={onSubmit} />);
    const store = screen.getByLabelText('Store');
    expect(within(store).queryByText('WH-1 · Fake warehouse')).toBeNull();
    fireEvent.change(store, { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Product 1'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Quantity 1'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Raise requisition' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ location: 8, note: '', lines: [{ product: 4, quantity: 10 }] })
    );
  });

  it('needs a store', () => {
    const onSubmit = vi.fn();
    render(<RequisitionForm locations={LOCATIONS} products={PRODUCTS} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Raise requisition' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose the store that needs the stock.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('FulfilForm', () => {
  const renderForm = (onSubmit) =>
    render(<FulfilForm requisition={requisition()} locations={LOCATIONS} products={PRODUCTS} onSubmit={onSubmit} />);

  it('pre-fills what is open, skips closed lines and sends from the chosen source', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);
    expect(screen.getByLabelText('Send Fake dates')).toHaveValue(6);
    expect(screen.queryByLabelText('Send Fake rice')).toBeNull();
    expect(within(screen.getByLabelText('Send from')).queryByText('SHOP-1 · Fake shop floor')).toBeNull();
    fireEvent.change(screen.getByLabelText('Send from'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Send Fake dates'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make transfer' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ source_location: 9, lines: [{ line: 31, quantity: 4 }] })
    );
  });

  it('refuses nothing to send, or more than is open', () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    fireEvent.change(screen.getByLabelText('Send from'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Send Fake dates'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make transfer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Send at least one unit.');
    fireEvent.change(screen.getByLabelText('Send Fake dates'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make transfer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fake dates: send between 0 and 6.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('RequisitionTable', () => {
  it('shows what is open and offers fulfil only while something is', () => {
    const onFulfil = vi.fn();
    render(
      <RequisitionTable
        requisitions={[requisition(), requisition({ id: 4, reference: 'R-000004', status: 'fulfilled' })]}
        locations={LOCATIONS}
        products={PRODUCTS}
        transferReferences={{ 5: 'T-000005' }}
        onFulfil={onFulfil}
      />
    );
    const row = screen.getByText('R-000003').closest('tr');
    expect(row).toHaveTextContent('SHOP-1');
    expect(row).toHaveTextContent('Fake dates: 6 open of 10');
    expect(row).toHaveTextContent('T-000005');
    fireEvent.click(within(row).getByRole('button', { name: 'Fulfil' }));
    expect(onFulfil).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
    expect(within(screen.getByText('R-000004').closest('tr')).queryByRole('button')).toBeNull();
  });
});

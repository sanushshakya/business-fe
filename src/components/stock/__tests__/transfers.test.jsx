import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReceiveTransferForm from '../ReceiveTransferForm';
import TransferForm from '../TransferForm';
import TransferTable from '../TransferTable';
import { LOCATIONS, PRODUCTS } from './fixtures';

const transfer = (fields = {}) => ({
  id: 5,
  reference: 'T-000005',
  source_location: 9,
  destination_location: 7,
  status: 'draft',
  note: '',
  lines: [
    { id: 51, product: 4, quantity: 6, received_quantity: null, difference_reason: '' },
    { id: 52, product: 5, quantity: 2, received_quantity: null, difference_reason: '' },
  ],
  ...fields,
});

describe('TransferForm', () => {
  const fill = () => {
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Product 1'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Quantity 1'), { target: { value: '6' } });
  };

  it('sends the route and lines', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TransferForm locations={LOCATIONS} products={PRODUCTS} onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Add product' }));
    fireEvent.change(screen.getByLabelText('Product 2'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Quantity 2'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Weekly top-up' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        source_location: 9,
        destination_location: 7,
        note: 'Weekly top-up',
        lines: [
          { product: 4, quantity: 6 },
          { product: 5, quantity: 2 },
        ],
      })
    );
  });

  it('does not offer the source as the destination, and needs a product', () => {
    const onSubmit = vi.fn();
    render(<TransferForm locations={LOCATIONS} products={PRODUCTS} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '9' } });
    expect(within(screen.getByLabelText('To')).queryByText('WH-1 · Fake warehouse')).toBeNull();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add at least one product.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses a product listed twice', () => {
    const onSubmit = vi.fn();
    render(<TransferForm locations={LOCATIONS} products={PRODUCTS} onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Add product' }));
    fireEvent.change(screen.getByLabelText('Product 2'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Quantity 2'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fake dates is listed twice.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ReceiveTransferForm', () => {
  it('pre-fills what was sent and receives it all', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ReceiveTransferForm transfer={transfer({ status: 'dispatched' })} products={PRODUCTS} onSubmit={onSubmit} />);
    expect(screen.getByLabelText('Received Fake dates')).toHaveValue(6);
    expect(screen.queryByLabelText('Reason for Fake dates')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        lines: [
          { line: 51, received_quantity: 6, reason: '' },
          { line: 52, received_quantity: 2, reason: '' },
        ],
      })
    );
  });

  it('needs a reason when what arrived differs', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ReceiveTransferForm transfer={transfer({ status: 'dispatched' })} products={PRODUCTS} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Received Fake dates'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fake dates: say why 5 of 6 arrived.');
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Reason for Fake dates'), { target: { value: 'One damaged' } });
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        lines: [
          { line: 51, received_quantity: 5, reason: 'One damaged' },
          { line: 52, received_quantity: 2, reason: '' },
        ],
      })
    );
  });

  it('refuses more than was sent', () => {
    const onSubmit = vi.fn();
    render(<ReceiveTransferForm transfer={transfer({ status: 'dispatched' })} products={PRODUCTS} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Received Fake rice'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Receive' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Fake rice: received must be between 0 and 2.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('TransferTable', () => {
  const renderTable = (transfers, handlers = {}) =>
    render(
      <TransferTable
        transfers={transfers}
        locations={LOCATIONS}
        products={PRODUCTS}
        onDispatch={handlers.onDispatch || vi.fn()}
        onCancel={handlers.onCancel || vi.fn()}
        onReceive={handlers.onReceive || vi.fn()}
      />
    );

  it('shows the route, lines and the actions for each status', () => {
    const onDispatch = vi.fn();
    renderTable(
      [
        transfer(),
        transfer({ id: 6, reference: 'T-000006', status: 'dispatched' }),
        transfer({ id: 7, reference: 'T-000007', status: 'received' }),
      ],
      { onDispatch }
    );
    const draft = screen.getByText('T-000005').closest('tr');
    expect(draft).toHaveTextContent('WH-1 → SHOP-1');
    expect(draft).toHaveTextContent('6 × Fake dates');
    expect(within(draft).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    fireEvent.click(within(draft).getByRole('button', { name: 'Dispatch' }));
    expect(onDispatch).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));

    const dispatched = screen.getByText('T-000006').closest('tr');
    expect(within(dispatched).getByRole('button', { name: 'Receive' })).toBeInTheDocument();
    expect(within(dispatched).queryByRole('button', { name: 'Dispatch' })).toBeNull();

    const received = screen.getByText('T-000007').closest('tr');
    expect(within(received).queryAllByRole('button')).toHaveLength(0);
  });

  it('shows received counts once received', () => {
    renderTable([
      transfer({
        status: 'received',
        lines: [{ id: 51, product: 4, quantity: 6, received_quantity: 5, difference_reason: 'One damaged' }],
      }),
    ]);
    expect(screen.getByText('T-000005').closest('tr')).toHaveTextContent('5 of 6 × Fake dates');
  });
});

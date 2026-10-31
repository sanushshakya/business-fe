import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import TransfersPage from '../TransfersPage';
import { LOCATIONS, PRODUCTS } from '../../components/stock/__tests__/fixtures';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const page = (results) => ({ data: { results, next: null } });
const DRAFT = {
  id: 5,
  reference: 'T-000005',
  source_location: 9,
  destination_location: 7,
  status: 'draft',
  note: '',
  lines: [{ id: 51, product: 4, quantity: 6, received_quantity: null, difference_reason: '' }],
};
let transfers;

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TransfersPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  transfers = [DRAFT];
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/inventory/locations/')) return Promise.resolve(page(LOCATIONS));
    if (url.startsWith('/inventory/products/')) return Promise.resolve(page(PRODUCTS));
    return Promise.resolve(page(transfers));
  });
});

describe('TransfersPage', () => {
  it('creates a transfer', async () => {
    axios.post.mockResolvedValue({ data: DRAFT });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'New transfer' }));
    const dialog = screen.getByRole('dialog');
    await within(dialog).findAllByRole('option', { name: 'WH-1 · Fake warehouse' });
    fireEvent.change(within(dialog).getByLabelText('From'), { target: { value: '9' } });
    fireEvent.change(within(dialog).getByLabelText('To'), { target: { value: '7' } });
    fireEvent.change(within(dialog).getByLabelText('Product 1'), { target: { value: '4' } });
    fireEvent.change(within(dialog).getByLabelText('Quantity 1'), { target: { value: '6' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create transfer' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/inventory/transfers/', {
        source_location: 9,
        destination_location: 7,
        note: '',
        lines: [{ product: 4, quantity: 6 }],
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('dispatches, then receives with a reason', async () => {
    axios.post.mockImplementation((url) => {
      if (url.endsWith('/dispatch/')) transfers = [{ ...DRAFT, status: 'dispatched' }];
      return Promise.resolve({ data: {} });
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Dispatch' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/inventory/transfers/5/dispatch/'));

    fireEvent.click(await screen.findByRole('button', { name: 'Receive' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Received Fake dates'), { target: { value: '5' } });
    fireEvent.change(within(dialog).getByLabelText('Reason for Fake dates'), { target: { value: 'One damaged' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Receive' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/inventory/transfers/5/receive/', {
        lines: [{ line: 51, received_quantity: 5, reason: 'One damaged' }],
      })
    );
  });

  it("shows the server's reason when a dispatch is refused", async () => {
    axios.post.mockRejectedValue({
      response: { status: 400, data: { lines: ['Fake dates: only 4 available at WH-1.'] } },
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Dispatch' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Fake dates: only 4 available at WH-1.');
  });

  it('filters by status', async () => {
    renderPage();
    await screen.findByText('T-000005');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'dispatched' } });
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith('/inventory/transfers/?status=dispatched', expect.anything())
    );
  });
});

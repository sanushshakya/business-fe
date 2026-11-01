import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import RequisitionsPage from '../RequisitionsPage';
import { LOCATIONS, PRODUCTS } from '../../components/stock/__tests__/fixtures';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const page = (results) => ({ data: { results, next: null } });
const OPEN = {
  id: 3,
  reference: 'R-000003',
  location: 7,
  status: 'open',
  note: '',
  transfers: [],
  lines: [{ id: 31, product: 4, quantity: 10, fulfilled_quantity: 0, open_quantity: 10 }],
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RequisitionsPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/inventory/locations/')) return Promise.resolve(page(LOCATIONS));
    if (url.startsWith('/inventory/products/')) return Promise.resolve(page(PRODUCTS));
    if (url.startsWith('/inventory/transfers/')) return Promise.resolve(page([]));
    return Promise.resolve(page([OPEN]));
  });
});

describe('RequisitionsPage', () => {
  it('raises a requisition', async () => {
    axios.post.mockResolvedValue({ data: OPEN });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'New requisition' }));
    const dialog = screen.getByRole('dialog');
    await within(dialog).findAllByRole('option', { name: 'SHOP-1 · Fake shop floor' });
    fireEvent.change(within(dialog).getByLabelText('Store'), { target: { value: '7' } });
    fireEvent.change(within(dialog).getByLabelText('Product 1'), { target: { value: '4' } });
    fireEvent.change(within(dialog).getByLabelText('Quantity 1'), { target: { value: '10' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Raise requisition' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/inventory/requisitions/', {
        location: 7,
        note: '',
        lines: [{ product: 4, quantity: 10 }],
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('fulfils into a draft transfer and says what to do next', async () => {
    axios.post.mockResolvedValue({ data: { id: 9, reference: 'T-000009', status: 'draft' } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Fulfil' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Send from'), { target: { value: '9' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Make transfer' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/inventory/requisitions/3/fulfil/', {
        source_location: 9,
        lines: [{ line: 31, quantity: 10 }],
      })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Draft T-000009 made. Dispatch it on Transfers.');
  });

  it("shows the server's reason when fulfilling is refused", async () => {
    axios.post.mockRejectedValue({ response: { status: 400, data: { lines: ['Fake dates: send between 0 and 4.'] } } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Fulfil' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Send from'), { target: { value: '9' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Make transfer' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Fake dates: send between 0 and 4.');
  });
});

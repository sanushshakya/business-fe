import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import SyncExceptionsPage from '../SyncExceptionsPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const ROWS = [
  {
    id: 1,
    kind: 'price',
    kind_label: 'Price differs',
    receipt_number: 'S-000019',
    offline_number: 'HS-T99-ABC-000002',
    sold_at: '2026-11-05T09:40:00Z',
    product_name: 'Fake Rice',
    expected: '5.00',
    charged: '4.00',
    quantity: null,
    weight_kg: null,
    detail: '',
    resolved_at: null,
  },
  {
    id: 2,
    kind: 'stock',
    kind_label: 'Not enough stock',
    receipt_number: 'S-000019',
    offline_number: 'HS-T99-ABC-000002',
    sold_at: '2026-11-05T09:40:00Z',
    product_name: 'Fake Rice',
    expected: null,
    charged: null,
    quantity: 2,
    weight_kg: null,
    detail: 'Sold offline without enough stock here; booked from adjustment.',
    resolved_at: null,
  },
];
const page = (results) => ({ data: { count: results.length, next: null, results } });
const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SyncExceptionsPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockResolvedValue(page(ROWS));
});

describe('SyncExceptionsPage (G29)', () => {
  it('lists the open exceptions with what differed', async () => {
    renderPage();
    const price = (await screen.findByRole('cell', { name: 'Price differs' })).closest('tr');
    expect(within(price).getByText('HS-T99-ABC-000002')).toBeInTheDocument();
    expect(within(price).getByText('S-000019')).toBeInTheDocument();
    expect(within(price).getByText('Charged £4.00, price £5.00')).toBeInTheDocument();
    const stock = screen.getByRole('cell', { name: 'Not enough stock' }).closest('tr');
    expect(within(stock).getByText('2 short')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(
      '/sales/exceptions/',
      expect.objectContaining({ params: expect.objectContaining({ page: 1 }) })
    );
  });

  it('marks one handled', async () => {
    axios.post.mockResolvedValue({ data: { ...ROWS[0], resolved_at: '2026-11-05T10:00:00Z' } });
    renderPage();
    const price = (await screen.findByRole('cell', { name: 'Price differs' })).closest('tr');
    fireEvent.click(within(price).getByRole('button', { name: 'Mark handled' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/sales/exceptions/1/resolve/'));
  });

  it('shows handled ones and filters by kind', async () => {
    renderPage();
    await screen.findByRole('cell', { name: 'Price differs' });
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'true' } });
    await waitFor(() =>
      expect(axios.get).toHaveBeenLastCalledWith(
        '/sales/exceptions/',
        expect.objectContaining({ params: expect.objectContaining({ resolved: 'true' }) })
      )
    );
    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'stock' } });
    await waitFor(() =>
      expect(axios.get).toHaveBeenLastCalledWith(
        '/sales/exceptions/',
        expect.objectContaining({ params: expect.objectContaining({ kind: 'stock' }) })
      )
    );
  });

  it('says when there is nothing to review', async () => {
    axios.get.mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('Nothing to review')).toBeInTheDocument();
  });

  it('says it is for managers when the server refuses (not staff)', async () => {
    axios.get.mockRejectedValue({ response: { status: 403, data: { detail: 'Fake: no' } } });
    renderPage();
    expect(await screen.findByText(/Only managers can review sync exceptions/)).toBeInTheDocument();
  });
});

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../../utils/axios';
import { openPdf } from '../../../utils/pdf';
import PickingPage from '../PickingPage';
import PickPage from '../PickPage';

vi.mock('../../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../utils/pdf', () => ({ openPdf: vi.fn(() => Promise.resolve()), default: vi.fn() }));

const page = (results) => ({ data: { results, next: null } });
const LINE = {
  id: 31,
  product: 4,
  product_name: 'Fake Rice',
  quantity: 5,
  weight_kg: null,
  zone: 'ambient',
  picks: [],
  substitution: '',
};
let order;

const renderAt = (path) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/b2b/picking" element={<PickingPage />} />
          <Route path="/dashboard/b2b/picking/:id" element={<PickPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  order = {
    id: 12,
    number_display: 'SO-000012',
    customer_name: 'E2E Fake Bistro Ltd',
    status: 'picking',
    delivery_date: '2026-11-08',
    lines: [LINE],
  };
  axios.get.mockImplementation((url, config) => {
    if (url === '/auth/me/') return Promise.resolve({ data: { is_staff: false, role: 'stock' } });
    if (url.startsWith('/inventory/products/'))
      return Promise.resolve(page([{ id: 4, name: 'Fake Rice', sold_by: 'each' }]));
    if (url === '/wholesale/orders/12/') return Promise.resolve({ data: order });
    const status = config?.params?.status;
    return Promise.resolve(
      page(
        status === 'confirmed'
          ? [{ ...order, id: 13, number_display: 'SO-000013', status: 'confirmed', delivery_date: '2026-11-09' }]
          : [order]
      )
    );
  });
  axios.post.mockResolvedValue({ data: {} });
  axios.delete.mockResolvedValue({});
});

describe('Picking pages', () => {
  it('lists orders to pick by delivery date', async () => {
    renderAt('/dashboard/b2b/picking');
    const links = await screen.findAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard/b2b/picking/12',
      '/dashboard/b2b/picking/13',
    ]);
  });

  it('starts a confirmed order', async () => {
    order = { ...order, status: 'confirmed' };
    renderAt('/dashboard/b2b/picking/12');
    fireEvent.click(await screen.findByRole('button', { name: 'Start picking' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/start-pick/', {}));
  });

  it('records a scan, shows a refusal, finishes and opens the pick list', async () => {
    renderAt('/dashboard/b2b/picking/12');
    fireEvent.change(await screen.findByLabelText('Quantity'), { target: { value: '5' } });
    const box = screen.getByLabelText('Scan');
    fireEvent.change(box, { target: { value: 'RICE-1' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/picks/', {
        line: 31,
        batch_number: 'RICE-1',
        quantity: 5,
      })
    );
    axios.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: '5 ordered; that would pick 10.' } } });
    fireEvent.change(box, { target: { value: 'RICE-1' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(await screen.findByText('5 ordered; that would pick 10.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Finish picking' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/finish-pick/', {}));
    fireEvent.click(screen.getByRole('button', { name: 'Pick list' }));
    expect(openPdf).toHaveBeenCalledWith('/wholesale/orders/12/pick-list/');
  });

  it('removes a pick and leaves approval to staff', async () => {
    order = {
      ...order,
      lines: [
        { ...LINE, picks: [{ id: 90, batch_number: 'RICE-1', quantity: 2, weight_kg: null }] },
        { ...LINE, id: 40, product: 7, product_name: 'Fake Thighs', substitute_for: 31, substitution: 'proposed' },
      ],
    };
    renderAt('/dashboard/b2b/picking/12');
    fireEvent.click(await screen.findByRole('button', { name: 'Remove pick RICE-1' }));
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/wholesale/orders/12/picks/90/'));
    expect(screen.getByText('Waiting for approval')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Approve swap Fake Thighs' })).toBeNull(); // a stock operator
  });
});

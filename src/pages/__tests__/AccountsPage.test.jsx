import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import AccountsPage from '../AccountsPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../../utils/dateUtils', () => ({ ukToday: () => '2026-11-10' }));

const BOXES = {
  box1: '20.00',
  box2: '0.00',
  box3: '20.00',
  box4: '5.00',
  box5: '15.00',
  net_direction: 'pay',
  box6: '100',
  box7: '25',
  box8: '0',
  box9: '0',
  filed: null,
};
let staff;

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AccountsPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  staff = true;
  axios.get.mockReset();
  axios.post.mockReset();
  axios.get.mockImplementation((url) => {
    if (url === '/auth/me/') return Promise.resolve({ data: { id: 1, is_staff: staff } });
    if (url === '/accounting/reports/profit-and-loss/')
      return Promise.resolve({
        data: { income: [], expenses: [], total_income: '0.00', total_expenses: '0.00', net_profit: '0.00' },
      });
    if (url === '/accounting/vat-return/') return Promise.resolve({ data: BOXES });
    return Promise.reject(new Error(url));
  });
});

describe('AccountsPage', () => {
  it('opens on this month’s profit and loss', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Net profit')).toBeTruthy());
    expect(axios.get).toHaveBeenCalledWith('/accounting/reports/profit-and-loss/', {
      params: { from: '2026-11-01', to: '2026-11-10' },
    });
  });

  it('files last quarter’s VAT return and shows a refusal', async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 400, data: { detail: 'These months are in a return filed already.' } },
    });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'VAT return' }));
    fireEvent.click(screen.getByRole('button', { name: 'Last quarter' }));
    await waitFor(() => expect(screen.getByText('Net VAT (to pay)')).toBeTruthy());
    expect(axios.get).toHaveBeenCalledWith('/accounting/vat-return/', {
      params: { from: '2026-07-01', to: '2026-09-30' },
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark as filed' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Mark as filed' }));
    fireEvent.click(screen.getByRole('button', { name: /Yes, mark as filed/ }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/accounting/vat-returns/', { from: '2026-07-01', to: '2026-09-30' })
    );
    expect(await screen.findByText('These months are in a return filed already.')).toBeTruthy();
  });

  it('offers filing to staff only', async () => {
    staff = false;
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'VAT return' }));
    await waitFor(() => expect(screen.getByText('Net VAT (to pay)')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Mark as filed' })).toBeNull();
  });
});

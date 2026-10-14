import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import SalesPage from '../SalesPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const sale = {
  id: 4,
  receipt_number: 'S-000004',
  created_at: '2026-10-14T09:05:00Z',
  branch_name: 'High Street',
  till_number: 1,
  cashier_email: 'a@b.test',
  payment_method: 'cash',
  total: '25.00',
  amount_tendered: '30.00',
  change_due: '5.00',
  status: 'completed',
  items: [{ id: 1, product: 1, product_name: 'Rice', quantity: 2, unit_price: '12.50', line_total: '25.00' }],
};
const shift = {
  id: 2,
  till_number: 1,
  branch_name: 'High Street',
  opened_by_email: 'a@b.test',
  opened_at: '2026-10-14T08:00:00Z',
  closed_at: '2026-10-14T17:00:00Z',
  is_open: false,
  opening_float: '50.00',
  counted_cash: '74.00',
  summary: { sales_count: 1, sales_total: '25.00', expected_cash: '75.00', variance: '-1.00' },
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SalesPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockImplementation((url) =>
    Promise.resolve({
      data:
        url === '/sales/sales/'
          ? { count: 1, next: null, results: [sale] }
          : { count: 1, next: null, results: [shift] },
    })
  );
});

describe('SalesPage', () => {
  it('lists sales and sends the filters to the server', async () => {
    renderPage();
    expect(await screen.findByText('S-000004')).toBeInTheDocument();
    expect(screen.getAllByText('Completed')).toHaveLength(2); // the filter option and the row badge
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'voided' } });
    await waitFor(() =>
      expect(axios.get).toHaveBeenLastCalledWith('/sales/sales/', {
        params: { status: 'voided', page: 1, page_size: 20 },
      })
    );
  });

  it('voids a sale with a reason and shows it as voided', async () => {
    axios.post.mockResolvedValue({ data: { ...sale, status: 'voided', void_reason: 'Wrong item' } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'View S-000004' }));
    fireEvent.change(screen.getByLabelText('Void reason (optional)'), { target: { value: ' Wrong item ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Void sale' }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/sales/sales/4/void/', { reason: 'Wrong item' }));
    expect(await screen.findByText('Void reason: Wrong item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Void sale' })).not.toBeInTheDocument();
  });

  it('explains why a void was refused', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 403,
        data: { code: 'permission_denied', message: 'Only the cashier who made this sale, or staff, can void it.' },
      },
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'View S-000004' }));
    fireEvent.click(screen.getByRole('button', { name: 'Void sale' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Only the cashier who made this sale');
  });

  it('shows till sessions with their variance', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Till sessions' }));
    expect(await screen.findByText('−£1.00')).toBeInTheDocument();
    expect(screen.getByText('£75.00')).toBeInTheDocument();
    expect(screen.getByText('£74.00')).toBeInTheDocument();
  });
});

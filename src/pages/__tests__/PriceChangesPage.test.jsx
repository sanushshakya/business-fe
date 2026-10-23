import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import PriceChangesPage from '../PriceChangesPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

const pending = {
  id: 4,
  product: 1,
  old_price: '1.99',
  new_price: '1.79',
  reason: 'decay_markdown',
  changed_at: '2026-10-19T09:00:00Z',
  is_approved: false,
};

let logs;
const serve = ({ isStaff = true } = {}) =>
  axios.get.mockImplementation(async (url) => {
    if (url.startsWith('/auth/me/')) return { data: { id: 9, is_staff: isStaff } };
    if (url.startsWith('/inventory/products/'))
      return { data: { results: [{ id: 1, name: 'Shin Ramyun' }], next: null } };
    return { data: { results: logs, next: null } };
  });

let client;
const renderPage = () => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PriceChangesPage />
    </QueryClientProvider>
  );
};
// Let refetches started by the last action finish inside the test.
const settled = () => waitFor(() => expect(client.isFetching() + client.isMutating()).toBe(0));

describe('PriceChangesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logs = [pending];
  });

  it('approves a pending change and refreshes the list', async () => {
    serve();
    axios.post.mockImplementation(async () => {
      logs = [{ ...pending, is_approved: true }];
      return { data: logs[0] };
    });
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Approve Shin Ramyun' }));
    expect(axios.post).toHaveBeenCalledWith('/pricing/price-changes/4/approve/');
    expect(await screen.findByText('No price changes waiting for approval.')).toBeInTheDocument();
    await settled();
  });

  it('rejects a pending change by deleting it', async () => {
    serve();
    axios.delete.mockImplementation(async () => {
      logs = [];
      return {};
    });
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Reject Shin Ramyun' }));
    expect(axios.delete).toHaveBeenCalledWith('/pricing/price-changes/4/');
    await waitFor(() => expect(screen.queryByRole('button', { name: /Reject/ })).not.toBeInTheDocument());
    await settled();
  });

  it("shows the server's reason when approval is refused", async () => {
    serve();
    axios.post.mockRejectedValue({
      response: {
        status: 409,
        data: { detail: 'The price is now 2.49, not 1.99. Delete this change and request a new one.' },
      },
    });
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Approve Shin Ramyun' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The price is now 2.49, not 1.99.');
    await settled();
  });

  it('shows pending changes without buttons to non-staff', async () => {
    serve({ isStaff: false });
    renderPage();

    expect(await screen.findByText(/£1\.99 → £1\.79/)).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/auth/me/'));
    expect(screen.queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument();
    await settled();
  });
});

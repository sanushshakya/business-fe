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
  source: 'decay_markdown',
  changed_at: '2026-10-19T09:00:00Z',
  is_approved: false,
  is_rejected: false,
};

let logs;
const serve = ({ isStaff = true, role = '' } = {}) =>
  axios.get.mockImplementation(async (url) => {
    if (url.startsWith('/auth/me/')) return { data: { id: 9, is_staff: isStaff, role } };
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
      logs = [{ ...pending, is_approved: true, decided_by_name: 'Priya', decided_at: '2026-10-20T10:00:00Z' }];
      return { data: logs[0] };
    });
    renderPage();

    await userEvent.type(await screen.findByRole('textbox', { name: 'Note for Shin Ramyun' }), 'ok');
    await userEvent.click(screen.getByRole('button', { name: 'Approve Shin Ramyun' }));
    expect(axios.post).toHaveBeenCalledWith('/pricing/price-changes/4/approve/', { note: 'ok' });
    expect(await screen.findByText('No price changes waiting for a decision.')).toBeInTheDocument();
    expect(await screen.findByText('Priya')).toBeInTheDocument(); // now under recent decisions
    await settled();
  });

  it('rejects a pending change, keeping it as a decision', async () => {
    serve();
    axios.post.mockImplementation(async () => {
      logs = [{ ...pending, is_rejected: true, decided_by_name: 'Priya', decided_at: '2026-10-20T10:00:00Z' }];
      return { data: logs[0] };
    });
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Reject Shin Ramyun' }));
    expect(axios.post).toHaveBeenCalledWith('/pricing/price-changes/4/reject/', { note: '' });
    expect(axios.delete).not.toHaveBeenCalled();
    expect(await screen.findByText('Rejected')).toBeInTheDocument();
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

  it('hides pending changes and decisions from operators', async () => {
    serve({ isStaff: false, role: 'stock' });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Waste reduction' })).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/auth/me/'));
    await settled();
    expect(screen.queryByRole('heading', { name: 'Pending price changes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recent decisions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve|Reject/ })).not.toBeInTheDocument();
  });
});

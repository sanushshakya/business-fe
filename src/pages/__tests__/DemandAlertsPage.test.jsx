import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import DemandAlertsPage from '../DemandAlertsPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const alert = {
  id: 7,
  product: 'Basmati rice',
  branch: 'Leeds',
  requested_qty: 40,
  created_at: '2026-10-01T10:00:00Z',
  is_handled: false,
};

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DemandAlertsPage />
    </QueryClientProvider>
  );
};

describe('DemandAlertsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists open alerts and dismisses one', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { results: [alert], next: null } })
      .mockResolvedValue({ data: { results: [], next: null } });
    axios.post.mockResolvedValue({});
    renderPage();

    expect(await screen.findByText('Basmati rice')).toBeInTheDocument();
    expect(screen.getByText('40 requested')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(axios.post).toHaveBeenCalledWith('/common/api/alerts/demand/dismiss/7/');
    expect(await screen.findByText('No open demand alerts.')).toBeInTheDocument();
  });

  it('shows an error when dismissing fails', async () => {
    axios.get.mockResolvedValue({ data: { results: [alert], next: null } });
    axios.post.mockRejectedValue(new Error('boom'));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not dismiss'));
  });
});

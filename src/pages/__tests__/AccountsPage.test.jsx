import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import AccountsPage from '../AccountsPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
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

const renderPage = (path = '/dashboard/accounts') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AccountsPage />
      </QueryClientProvider>
    </MemoryRouter>
  );

const OBLIGATION = {
  periodKey: '26C3',
  start: '2026-07-01',
  end: '2026-09-30',
  due: '2026-11-07',
  status: 'O',
  filed_in_iq: false,
};

const withHmrc = () => {
  const plain = axios.get.getMockImplementation();
  axios.get.mockImplementation((url, options) => {
    if (url === '/accounting/hmrc/')
      return Promise.resolve({
        data: { environment: 'sandbox', connected: true, vrn: '123456789', connected_at: null },
      });
    if (url === '/accounting/hmrc/returns/') return Promise.resolve({ data: [] });
    return plain(url, options);
  });
  axios.post.mockImplementation((url) => {
    if (url === '/accounting/hmrc/obligations/') return Promise.resolve({ data: [OBLIGATION] });
    if (url === '/accounting/hmrc/returns/')
      return Promise.resolve({ data: { id: 1, status: 'accepted', form_bundle_number: '256660290587' } });
    return Promise.reject(new Error(url));
  });
};

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

  it('forgets a half-confirmed filing and an old error when the period changes', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: 'Fake refusal.' } } });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'VAT return' }));
    fireEvent.click(screen.getByRole('button', { name: 'Last quarter' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Mark as filed' }));
    fireEvent.click(screen.getByRole('button', { name: /Yes, mark as filed/ }));
    expect(await screen.findByText('Fake refusal.')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'Mark as filed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Last month' }));
    expect(screen.queryByText('Fake refusal.')).toBeNull();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark as filed' })).toBeTruthy());
    expect(screen.queryByRole('button', { name: /Yes, mark as filed/ })).toBeNull();
  });

  it('offers filing to staff only', async () => {
    staff = false;
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'VAT return' }));
    await waitFor(() => expect(screen.getByText('Net VAT (to pay)')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Mark as filed' })).toBeNull();
  });

  it('files through HMRC when MTD filing is on: no "Mark as filed", the obligation sets the period', async () => {
    withHmrc();
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'VAT return' }));
    const period = await screen.findByRole('button', { name: /1 Jul 2026 to 30 Sep 2026/ });
    expect(screen.queryByRole('button', { name: 'Mark as filed' })).toBeNull();
    const [, body] = axios.post.mock.calls.find(([url]) => url === '/accounting/hmrc/obligations/');
    expect(body.client.device_id).toMatch(/^[0-9a-f-]{36}$/);
    fireEvent.click(period);
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith('/accounting/vat-return/', {
        params: { from: '2026-07-01', to: '2026-09-30' },
      })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /true and complete/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit to HMRC' }));
    fireEvent.click(screen.getByRole('button', { name: /Yes, submit to HMRC/ }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        '/accounting/hmrc/returns/',
        expect.objectContaining({ period_key: '26C3', start: '2026-07-01', end: '2026-09-30', declaration: true })
      )
    );
  });

  it('says so when HMRC sent the browser back connected, or with an error', async () => {
    withHmrc();
    const { unmount } = renderPage('/dashboard/accounts?hmrc=connected');
    expect((await screen.findByRole('status')).textContent).toMatch(/Connected to HMRC/);
    unmount();
    renderPage('/dashboard/accounts?hmrc=error&reason=denied');
    expect((await screen.findAllByRole('alert'))[0].textContent).toMatch(/not granted/);
  });
});

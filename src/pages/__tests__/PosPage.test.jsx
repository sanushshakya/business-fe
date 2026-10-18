import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import PosPage from '../PosPage';

let online = true;
vi.mock('../../offline/OfflineProvider', () => ({ useOffline: () => ({ isOnline: online }) }));
vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const page = (results) => ({ data: { count: results.length, next: null, results } });
const session = {
  id: 9,
  till: 3,
  till_number: 1,
  branch_name: 'High Street',
  opened_by_email: 'a@b.test',
  opened_at: '2026-10-14T09:00:00Z',
  opening_float: '50.00',
  summary: {
    sales_count: 0,
    sales_total: '0.00',
    cash_total: '0.00',
    card_total: '0.00',
    voided_count: 0,
    voided_total: '0.00',
    expected_cash: '50.00',
    variance: null,
  },
};
const sale = {
  id: 1,
  receipt_number: 'S-000001',
  created_at: '2026-10-14T09:05:00Z',
  branch_name: 'High Street',
  till_number: 1,
  cashier_email: 'a@b.test',
  payment_method: 'card',
  total: '25.00',
  amount_tendered: '25.00',
  change_due: '0.00',
  status: 'completed',
  items: [{ id: 1, product: 1, product_name: 'Rice', quantity: 2, unit_price: '12.50', line_total: '25.00' }],
};

let openSession;
const serve = () =>
  axios.get.mockImplementation((url) => {
    if (url === '/tenants/tills/') return Promise.resolve(page([{ id: 3, branch: 1, number: 1, is_active: true }]));
    if (url === '/tenants/branches/') return Promise.resolve(page([{ id: 1, name: 'High Street' }]));
    if (url === '/inventory/products/')
      return Promise.resolve(page([{ id: 1, name: 'Rice', price: '12.50', stock_quantity: 5 }]));
    if (url === '/sales/sessions/') return Promise.resolve(page(openSession ? [openSession] : []));
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });

const renderPage = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
    >
      <PosPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  online = true;
  openSession = session;
  serve();
});

describe('PosPage', () => {
  it('opens a till that has no session', async () => {
    openSession = null;
    localStorage.setItem('pos_till', '3');
    axios.post.mockResolvedValue({ data: session });
    renderPage();
    await screen.findByRole('option', { name: 'High Street – Till 1' });
    fireEvent.change(screen.getByLabelText('Opening float'), { target: { value: '75' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open till' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/sales/sessions/', { till: 3, opening_float: '75.00' })
    );
  });

  it('rings up a card sale, repricing nothing on the client, and shows the receipt', async () => {
    localStorage.setItem('pos_till', '3');
    axios.post.mockResolvedValue({ data: sale });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /^Rice £12\.50/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Rice £12\.50/ }));
    expect(screen.getByTestId('cart-total')).toHaveTextContent('£25.00');
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Charge £25.00' }));

    await screen.findByText('Receipt S-000001');
    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, body] = axios.post.mock.calls[0];
    expect(url).toBe('/sales/sales/');
    expect(body).toMatchObject({ session: 9, payment_method: 'card', items: [{ product: 1, quantity: 2 }] });
    expect(body.client_ref).toMatch(/^[0-9a-f-]{36}$/);
    expect(body).not.toHaveProperty('total');

    fireEvent.click(screen.getByRole('button', { name: 'New sale' }));
    expect(screen.getByText(/basket is empty/i)).toBeInTheDocument();
  });

  it('keeps the basket and shows the server message when a sale is refused, resending with the same reference', async () => {
    localStorage.setItem('pos_till', '3');
    axios.post
      .mockRejectedValueOnce({ response: { status: 400, data: { items: ['Rice: only 1 in date, 2 requested.'] } } })
      .mockResolvedValueOnce({ data: sale });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /^Rice £12\.50/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Rice £12\.50/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Charge £25.00' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Rice: only 1 in date, 2 requested.');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('£25.00');

    fireEvent.click(screen.getByRole('button', { name: 'Charge £25.00' }));
    await screen.findByText('Receipt S-000001');
    expect(axios.post.mock.calls[1][1].client_ref).toBe(axios.post.mock.calls[0][1].client_ref);
  });

  it('pauses charging while offline', async () => {
    online = false;
    localStorage.setItem('pos_till', '3');
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /^Rice £12\.50/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);
    expect(screen.getByRole('button', { name: 'Charge £12.50' })).toBeDisabled();
  });

  it('cashes up and reports the variance', async () => {
    localStorage.setItem('pos_till', '3');
    axios.post.mockResolvedValue({
      data: {
        ...session,
        expected_cash: '50.00',
        counted_cash: '49.00',
        summary: { ...session.summary, variance: '-1.00' },
      },
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Close till' }));
    fireEvent.change(screen.getByLabelText('Counted cash'), { target: { value: '49' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Close till' }).at(-1));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/sales/sessions/9/close/', { counted_cash: '49.00', note: '' })
    );
    expect(await screen.findByTestId('closed-variance')).toHaveTextContent('Short by £1.00.');
  });

  describe('loyalty cards', () => {
    const customer = { first_name: 'Amira', points_balance: 24, tier: 'Bronze', points_gbp_value: '0.24' };
    const respond = (lookup) =>
      axios.post.mockImplementation((url) => {
        if (url === '/sync/loyalty/lookup/') return lookup();
        if (url === '/sales/sales/') return Promise.resolve({ data: sale });
        return Promise.reject(new Error(`unexpected POST ${url}`));
      });
    const scan = (code) => {
      const input = screen.getByLabelText('Loyalty card');
      fireEvent.change(input, { target: { value: code } });
      fireEvent.keyDown(input, { key: 'Enter' });
    };
    const chargeCard = async () => {
      fireEvent.click(await screen.findByRole('button', { name: /^Rice £12\.50/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Card' }));
      fireEvent.click(screen.getByRole('button', { name: 'Charge £12.50' }));
      await screen.findByText('Receipt S-000001');
      return axios.post.mock.calls.find(([url]) => url === '/sales/sales/')[1];
    };

    it('sends loyalty_barcode with the charge', async () => {
      localStorage.setItem('pos_till', '3');
      respond(() => Promise.resolve({ data: customer }));
      renderPage();
      await screen.findByRole('button', { name: /^Rice £12\.50/ });
      scan('2995520383161');
      expect(await screen.findByText('Amira')).toBeInTheDocument();
      expect(axios.post).toHaveBeenCalledWith('/sync/loyalty/lookup/', { barcode: '2995520383161' });

      const body = await chargeCard();
      expect(body.loyalty_barcode).toBe('2995520383161');
      expect(screen.getByText('Loyalty: Amira · points will be added')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'New sale' }));
      expect(screen.getByLabelText('Loyalty card')).toBeInTheDocument(); // the next customer starts with no card
      expect(screen.queryByText('Amira')).not.toBeInTheDocument();
    });

    it('charges without loyalty when lookup fails', async () => {
      localStorage.setItem('pos_till', '3');
      respond(() => Promise.reject({ response: { status: 503, data: { code: 'loyalty_unavailable' } } }));
      renderPage();
      await screen.findByRole('button', { name: /^Rice £12\.50/ });
      scan('2995520383161');
      expect(await screen.findByText(/Loyalty unavailable/)).toBeInTheDocument();

      const body = await chargeCard();
      expect(body).not.toHaveProperty('loyalty_barcode');
      expect(screen.queryByText(/Loyalty:/)).not.toBeInTheDocument();
    });

    it('does not hold up charging while a lookup is in flight', async () => {
      localStorage.setItem('pos_till', '3');
      respond(() => new Promise(() => {}));
      renderPage();
      await screen.findByRole('button', { name: /^Rice £12\.50/ });
      scan('2995520383161');
      expect(await screen.findByText('Looking up card…')).toBeInTheDocument();
      const body = await chargeCard();
      expect(body).not.toHaveProperty('loyalty_barcode');
    });

    it('tells the cashier when a card is not recognised', async () => {
      localStorage.setItem('pos_till', '3');
      respond(() => Promise.reject({ response: { status: 404, data: { code: 'not_found' } } }));
      renderPage();
      await screen.findByRole('button', { name: /^Rice £12\.50/ });
      scan('0000000000000');
      expect(await screen.findByText('Card not recognised')).toBeInTheDocument();
    });
  });
});

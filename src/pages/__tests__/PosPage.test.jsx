import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import PosPage from '../PosPage';
import { ean13CheckDigit, ruleFromApi, valueCheckDigit } from '../../utils/barcodes';

let online = true;
vi.mock('../../offline/OfflineProvider', () => ({ useOffline: () => ({ isOnline: online }) }));
vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
let catalogue;
vi.mock('../../hooks/useTillCatalogue', () => ({ default: () => catalogue }));
let offlineSales;
vi.mock('../../hooks/useOfflineSales', () => ({ default: () => offlineSales }));
const makeOfflineSales = (overrides = {}) => ({
  available: true,
  sales: [],
  queue: vi.fn(async ({ sale }) => ({ ...sale, offline_number: 'HS-T01-QK-000001', status: 'queued' })),
  voidSale: vi.fn().mockResolvedValue(),
  ...overrides,
});

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

const PRODUCTS = [
  { id: 1, name: 'Rice', price: '12.50', stock_quantity: 5, barcode: '4006381333931' },
  { id: 4, name: 'Mince', price: '0.00', stock_quantity: 0, sold_by: 'weight', price_per_kg: '8.9900', plu: '42' },
];
const RULE = { id: 1, prefix: '21', item_code_length: 4, value_type: 'weight', decimals: 3, value_check_digit: true };
// The till's cached catalogue (G26): products, rules and tills come from here, not from live requests.
const makeCatalogue = (overrides = {}) => ({
  ready: true,
  products: PRODUCTS,
  rules: [ruleFromApi(RULE)],
  vatRates: [{ id: 1, code: 'zero', rate: '0.00', valid_from: '1973-04-01' }],
  tills: [{ id: 3, branch: 1, number: 1, is_active: true }],
  branches: [{ id: 1, name: 'High Street', code: 'HS' }],
  settings: { manual_weight_max_kg: '25', offline_warn_hours: 4, offline_confirm_hours: 24, offline_stop_hours: 72 },
  refreshedAt: Date.now(),
  refresh: vi.fn(),
  isRefreshing: false,
  error: null,
  saveSession: vi.fn().mockResolvedValue(),
  readSession: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

let openSession;
const serve = () =>
  axios.get.mockImplementation((url) => {
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
  catalogue = makeCatalogue();
  offlineSales = makeOfflineSales();
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

  describe('scanning labels', () => {
    // Prefix 21, PLU 0042, value check digit, 0.512 kg, EAN check digit.
    const LABEL = (() => {
      const body = `210042${valueCheckDigit('00512')}00512`;
      return body + ean13CheckDigit(body);
    })();
    const scan = async (code) => {
      const search = await screen.findByLabelText('Search products');
      fireEvent.change(search, { target: { value: code } });
      fireEvent.keyDown(search, { key: 'Enter' });
    };

    it('adds a weight label priced weight × £/kg and charges with only the barcode', async () => {
      localStorage.setItem('pos_till', '3');
      axios.post.mockResolvedValue({ data: sale });
      renderPage();
      await scan(LABEL);
      expect(await screen.findByText('0.512 kg × £8.99/kg')).toBeInTheDocument();
      expect(screen.getByTestId('cart-total')).toHaveTextContent('£4.60');
      fireEvent.click(screen.getByRole('button', { name: 'Card' }));
      fireEvent.click(screen.getByRole('button', { name: 'Charge £4.60' }));
      await screen.findByText('Receipt S-000001');
      expect(axios.post.mock.calls[0][1].items).toEqual([{ barcode: LABEL }]);
    });

    it('adds the product for an ordinary barcode', async () => {
      localStorage.setItem('pos_till', '3');
      renderPage();
      await scan('4006381333931');
      await waitFor(() => expect(screen.getByTestId('cart-total')).toHaveTextContent('£12.50'));
    });

    it('says why a label cannot be added', async () => {
      localStorage.setItem('pos_till', '3');
      renderPage();
      const unknown = (() => {
        const body = `210099${valueCheckDigit('00512')}00512`;
        return body + ean13CheckDigit(body);
      })();
      await scan(unknown);
      expect(await screen.findByText(/No product has PLU 99/)).toBeInTheDocument();
      expect(screen.getByTestId('cart-total')).toHaveTextContent('£0.00');
    });
  });

  describe('typed weights (G19)', () => {
    it('weighs a product by hand and charges its product, kg and nothing else', async () => {
      localStorage.setItem('pos_till', '3');
      axios.post.mockResolvedValue({ data: sale });
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Mince/ }));
      fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '0.512' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Mince' }));
      expect(await screen.findByText('0.512 kg × £8.99/kg · manual weight')).toBeInTheDocument();
      expect(screen.queryByLabelText('Weight (kg)')).not.toBeInTheDocument();
      expect(screen.getByTestId('cart-total')).toHaveTextContent('£4.60');
      fireEvent.click(screen.getByRole('button', { name: 'Card' }));
      fireEvent.click(screen.getByRole('button', { name: 'Charge £4.60' }));
      await screen.findByText('Receipt S-000001');
      expect(axios.post.mock.calls[0][1].items).toEqual([{ product: 4, weight_kg: '0.512' }]);
    });

    it('closes a weight panel left open once the sale is charged', async () => {
      localStorage.setItem('pos_till', '3');
      axios.post.mockResolvedValue({ data: sale });
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Rice/ }));
      fireEvent.click(screen.getByRole('button', { name: /Mince/ }));
      expect(screen.getByLabelText('Weight (kg)')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Card' }));
      fireEvent.click(screen.getByRole('button', { name: 'Charge £12.50' }));
      await screen.findByText('Receipt S-000001');
      expect(screen.queryByLabelText('Weight (kg)')).not.toBeInTheDocument();
    });

    it('shows the server refusing a weight over the limit and keeps the basket', async () => {
      localStorage.setItem('pos_till', '3');
      const message = 'Mince: 30.000 kg is over the 25 kg limit for a typed weight. Check it, or weigh it in parts.';
      axios.post.mockRejectedValue({ response: { status: 400, data: { items: [message] } } });
      // The till's copy of the limit is older (50): the server's answer still wins.
      catalogue = makeCatalogue({ settings: { ...makeCatalogue().settings, manual_weight_max_kg: '50' } });
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Mince/ }));
      fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '30' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Mince' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Card' }));
      fireEvent.click(screen.getByRole('button', { name: 'Charge £269.70' }));
      expect(await screen.findByText(new RegExp('over the 25 kg limit'))).toBeInTheDocument();
      expect(screen.getByText('30.000 kg × £8.99/kg · manual weight')).toBeInTheDocument();
    });

    it("refuses a typed weight over the till's copy of the limit (G27: also offline)", async () => {
      localStorage.setItem('pos_till', '3');
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Mince/ }));
      fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '30' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Mince' }));
      expect(screen.getByText(/Over the 25 kg limit for a typed weight/)).toBeInTheDocument();
      expect(screen.getByTestId('cart-total')).toHaveTextContent('£0.00');
    });
  });

  it('says sales are kept on the till while offline (G27)', async () => {
    online = false;
    localStorage.setItem('pos_till', '3');
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /^Rice £12\.50/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Offline: sales are kept on this till');
    expect(screen.getByRole('button', { name: 'Charge £12.50' })).toBeDisabled(); // cash: nothing tendered yet
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

describe('PosPage from the cached catalogue (G26)', () => {
  const unreachable = () => axios.get.mockRejectedValue(new Error('Network Error'));

  it('finds and prices products by name and by barcode with every request failing', async () => {
    unreachable();
    catalogue = makeCatalogue({ readSession: vi.fn().mockResolvedValue(session), error: new Error('Network Error') });
    localStorage.setItem('pos_till', '3');
    renderPage();
    const search = await screen.findByLabelText('Search products');
    fireEvent.change(search, { target: { value: 'ric' } });
    fireEvent.click(await screen.findByRole('button', { name: /Rice/ }));
    expect(screen.getByTestId('cart-total')).toHaveTextContent('£12.50');
    fireEvent.change(search, { target: { value: '4006381333931' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('cart-total')).toHaveTextContent('£25.00'));
    expect(catalogue.readSession).toHaveBeenCalledWith('3');
    expect(screen.getByText(/server not reachable, using this copy/)).toBeInTheDocument();
  });

  it('lists the cached tills when the server cannot be reached', async () => {
    unreachable();
    renderPage();
    expect(await screen.findByRole('option', { name: 'High Street – Till 1' })).toBeInTheDocument();
  });

  it('remembers the open session it found, without staff names or emails', async () => {
    localStorage.setItem('pos_till', '3');
    renderPage();
    await screen.findByLabelText('Search products');
    const [, saved] = catalogue.saveSession.mock.calls[0];
    expect(saved).toEqual(expect.objectContaining({ id: 9, till: 3, opening_float: '50.00' }));
    expect(JSON.stringify(saved)).not.toMatch(/a@b\.test|opened_by|closed_by/);
  });

  it('says a cached session is only the last known one', async () => {
    unreachable();
    catalogue = makeCatalogue({ readSession: vi.fn().mockResolvedValue({ ...session, opened_by_email: undefined }) });
    localStorage.setItem('pos_till', '3');
    renderPage();
    expect(await screen.findByText(/Last known state of this till/)).toBeInTheDocument();
  });

  it('trusts the server when saving the session copy fails', async () => {
    localStorage.setItem('pos_till', '3');
    catalogue = makeCatalogue({
      saveSession: vi.fn().mockRejectedValue(new Error('quota')),
      readSession: vi.fn().mockResolvedValue({ ...session, id: 1 }),
    });
    renderPage();
    await screen.findByLabelText('Search products');
    expect(catalogue.readSession).not.toHaveBeenCalled();
    expect(screen.queryByText(/Last known state/)).toBeNull();
  });

  it('shows loading, not "no products", before the first catalogue load', async () => {
    catalogue = makeCatalogue({ products: [], tills: [], refreshedAt: null, isRefreshing: false });
    renderPage();
    await waitFor(() => expect(axios.get).not.toHaveBeenCalledWith('/sales/sessions/', expect.anything()));
    expect(screen.queryByText(/No tills yet/)).toBeNull();
  });

  it('says when it has never seen the session of this till', async () => {
    unreachable();
    localStorage.setItem('pos_till', '3');
    renderPage();
    expect(await screen.findByText('Could not check this till.')).toBeInTheDocument();
  });

  it('refreshes the catalogue after a sale', async () => {
    localStorage.setItem('pos_till', '3');
    axios.post.mockResolvedValue({ data: sale });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Rice/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Charge £12.50' }));
    await screen.findByText('Receipt S-000001');
    expect(catalogue.refresh).toHaveBeenCalled();
  });
});

describe('selling offline (G27)', () => {
  const HOUR = 3_600_000;
  const addRice = async () => fireEvent.click(await screen.findByRole('button', { name: /Rice/ }));
  const payCash = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Exact' }));
    fireEvent.click(screen.getByRole('button', { name: 'Charge £12.50' }));
  };

  beforeEach(() => localStorage.setItem('pos_till', '3'));

  it("queues with the online attempt's client_ref when the server can't be reached", async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));
    renderPage();
    await addRice();
    payCash();
    expect(await screen.findByText('Receipt HS-T01-QK-000001')).toBeInTheDocument();
    expect(screen.getByText(/Offline sale: the receipt number will change/)).toBeInTheDocument();
    const [{ sale, tillId, branchCode, tillNumber }] = offlineSales.queue.mock.calls[0];
    expect(sale.client_ref).toBe(axios.post.mock.calls[0][1].client_ref);
    expect([tillId, branchCode, tillNumber]).toEqual(['3', 'HS', 1]);
    expect(sale.body).toEqual(
      expect.objectContaining({ session: 9, payment_method: 'cash', amount_tendered: '12.50' })
    );
    expect(sale.body.items).toEqual([{ product: 1, quantity: 1 }]);
    expect(sale.receipt).toEqual(expect.objectContaining({ total: '12.50', offline: true }));
    expect(screen.getByTestId('cart-total')).toHaveTextContent('£0.00');
  });

  it('queues straight away when the browser is offline', async () => {
    online = false;
    renderPage();
    await addRice();
    payCash();
    await screen.findByText('Receipt HS-T01-QK-000001');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('shows a refusal (4xx) and does not queue it', async () => {
    axios.post.mockRejectedValue({
      response: { status: 400, data: { items: ['Rice: only 0 in date, 1 requested.'] } },
    });
    renderPage();
    await addRice();
    payCash();
    expect(await screen.findByText(/only 0 in date/)).toBeInTheDocument();
    expect(offlineSales.queue).not.toHaveBeenCalled();
  });

  it('needs the terminal auth code for a card sale once the server is unreachable', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));
    renderPage();
    await addRice();
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Charge £12.50' }));
    expect(await screen.findByText(/enter the terminal's auth code/i)).toBeInTheDocument();
    expect(offlineSales.queue).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Terminal auth code'), { target: { value: 'a1b2c3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Charge £12.50' }));
    await screen.findByText('Receipt HS-T01-QK-000001');
    const [{ sale }] = offlineSales.queue.mock.calls[0];
    expect([sale.card_auth_code, sale.client_ref]).toEqual(['A1B2C3', axios.post.mock.calls[0][1].client_ref]);
  });

  it('refuses offline sales after offline_stop_hours', async () => {
    online = false;
    catalogue = makeCatalogue({ refreshedAt: Date.now() - 73 * HOUR });
    renderPage();
    await addRice();
    payCash();
    expect(await screen.findByText(/Reconnect to keep selling/)).toBeInTheDocument();
    expect(offlineSales.queue).not.toHaveBeenCalled();
  });

  it('asks once an hour after offline_confirm_hours, and records the confirmation', async () => {
    online = false;
    catalogue = makeCatalogue({ refreshedAt: Date.now() - 25 * HOUR });
    renderPage();
    await addRice();
    payCash();
    fireEvent.click(await screen.findByRole('button', { name: 'Keep selling offline' }));
    await screen.findByText('Receipt HS-T01-QK-000001');
    expect(offlineSales.queue.mock.calls[0][0].sale.confirmed_at).toEqual(expect.any(String));
    fireEvent.click(screen.getByRole('button', { name: 'New sale' }));
    await addRice();
    payCash();
    await waitFor(() => expect(offlineSales.queue).toHaveBeenCalledTimes(2)); // no second question within the hour
  });

  it('lists the waiting sales, voids one with a reason and reprints', async () => {
    offlineSales = makeOfflineSales({
      sales: [
        {
          client_ref: 'r1',
          offline_number: 'HS-T01-QK-000004',
          created_at: '2026-11-04T12:00:00Z',
          status: 'queued',
          receipt: { offline: true, total: '12.50', items: [], vat_summary: [], payment_method: 'cash' },
        },
      ],
    });
    renderPage();
    expect(await screen.findByText('Waiting to send (1)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Void' }));
    fireEvent.change(screen.getByLabelText('Why void HS-T01-QK-000004?'), { target: { value: 'Fake: wrong item' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm void' }));
    expect(offlineSales.voidSale).toHaveBeenCalledWith('r1', 'Fake: wrong item');
    fireEvent.click(screen.getByRole('button', { name: 'Reprint' }));
    expect(await screen.findByText('Receipt HS-T01-QK-000004')).toBeInTheDocument();
  });

  it('lets out-of-stock products be sold offline', async () => {
    online = false;
    catalogue = makeCatalogue({ products: [{ ...PRODUCTS[0], stock_quantity: 0 }, PRODUCTS[1]] });
    renderPage();
    await addRice();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('£12.50');
  });

  it('keeps an unchecked loyalty card with an offline sale', async () => {
    axios.post.mockImplementation((url) =>
      Promise.reject(url === '/sync/loyalty/lookup/' ? { response: { status: 503 } } : new Error('Network Error'))
    );
    renderPage();
    const box = await screen.findByLabelText(/loyalty card/i);
    fireEvent.change(box, { target: { value: '9900012345' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await addRice();
    payCash();
    await screen.findByText('Receipt HS-T01-QK-000001');
    expect(offlineSales.queue.mock.calls[0][0].sale.body.loyalty_barcode).toBe('9900012345');
  });

  it("says so when this browser can't keep offline sales", async () => {
    online = false;
    offlineSales = makeOfflineSales({ available: false });
    renderPage();
    await addRice();
    payCash();
    expect(await screen.findByText(/can't keep offline sales/)).toBeInTheDocument();
  });
});

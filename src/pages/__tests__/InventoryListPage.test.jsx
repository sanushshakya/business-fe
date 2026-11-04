import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import InventoryListPage from '../InventoryListPage';
import { LOCATIONS } from '../../components/stock/__tests__/fixtures';

const queueReceipt = vi.fn();
vi.mock('../../offline/OfflineProvider', () => ({ useOffline: () => ({ queueReceipt }) }));
vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const products = [{ id: 4, name: 'Dates', price: '8.99', stock_quantity: 50, reorder_threshold: 10, vat_code: 'zero' }];
const BATCHES_AT_WH = [
  { id: 1, product: 4, location: 9, quantity: 6 },
  { id: 2, product: 4, location: 9, quantity: 2 },
];
const page = (results) => ({ data: { results, next: null } });
const serve = (locations = LOCATIONS) =>
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/inventory/locations/')) return Promise.resolve(page(locations));
    if (url.startsWith('/inventory/suppliers/')) return Promise.resolve(page([]));
    if (url.startsWith('/inventory/batches/?location=9')) return Promise.resolve(page(BATCHES_AT_WH));
    if (url.startsWith('/inventory/batches/')) return Promise.resolve(page([]));
    return Promise.resolve(page(products));
  });
const setOnline = (value) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, networkMode: 'offlineFirst' },
            mutations: { networkMode: 'always' },
          },
        })
      }
    >
      <InventoryListPage />
    </QueryClientProvider>
  );

const fillAndSave = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Receive stock' }));
  await screen.findByRole('option', { name: 'Dates' });
  fireEvent.change(screen.getByLabelText('Product'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Batch number'), { target: { value: 'B-1' } });
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Expiration date'), { target: { value: '2027-01-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
};

const payload = { product: 4, batch_number: 'B-1', quantity: 3, expiration_date: '2027-01-31', location: 7 };

beforeEach(() => {
  vi.clearAllMocks();
  setOnline(true);
  serve();
});

describe('InventoryListPage receiving stock', () => {
  it('posts straight away when online', async () => {
    axios.post.mockResolvedValue({});
    renderPage();
    await fillAndSave();
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/inventory/batches/', payload));
    expect(queueReceipt).not.toHaveBeenCalled();
  });

  it('saves on the device and says so when offline', async () => {
    setOnline(false);
    renderPage();
    await fillAndSave();
    await waitFor(() => expect(queueReceipt).toHaveBeenCalledWith(payload));
    expect(axios.post).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('Saved on this device');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('queues instead when the request never reaches the server', async () => {
    axios.post.mockRejectedValue(new Error('Network Error')); // no .response
    renderPage();
    await fillAndSave();
    await waitFor(() => expect(queueReceipt).toHaveBeenCalledWith(payload));
  });

  it('queues when the server or a proxy answers 5xx, without also showing an error', async () => {
    axios.post.mockRejectedValue({ response: { status: 502 } });
    renderPage();
    await fillAndSave();
    await waitFor(() => expect(queueReceipt).toHaveBeenCalledWith(payload));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved on this device');
    expect(screen.queryByText('Could not record the stock.')).toBeNull();
  });

  it('does not queue a receipt the server rejected, and keeps the dialog open', async () => {
    axios.post.mockRejectedValue({ response: { status: 400 } });
    renderPage();
    await fillAndSave();
    expect(await within(screen.getByRole('dialog')).findByText('Could not record the stock.')).toBeInTheDocument();
    expect(queueReceipt).not.toHaveBeenCalled();
  });
});

describe('InventoryListPage locations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
    serve();
  });

  it('shows the stock at the chosen location', async () => {
    renderPage();
    const row = async () => (await screen.findByText('Dates')).closest('tr');
    expect(await row()).toHaveTextContent('50');
    await screen.findAllByRole('option', { name: 'WH-1 · Fake warehouse' });
    fireEvent.change(screen.getByLabelText('Stock at'), { target: { value: '9' } });
    await waitFor(async () => expect(await row()).toHaveTextContent('8'));
    expect(axios.get).toHaveBeenCalledWith('/inventory/batches/?location=9', expect.anything());
  });

  it('receives at the chosen location', async () => {
    axios.post.mockResolvedValue({});
    renderPage();
    await screen.findAllByRole('option', { name: 'WH-1 · Fake warehouse' });
    fireEvent.change(screen.getByLabelText('Stock at'), { target: { value: '9' } });
    await fillAndSave();
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/inventory/batches/', { ...payload, location: 9 }));
  });

  it("shows the server's reason inside the form when a receipt is refused", async () => {
    axios.post.mockRejectedValue({
      response: { status: 400, data: { location: ['This location is no longer in use.'] } },
    });
    renderPage();
    await fillAndSave();
    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('This location is no longer in use.');
  });

  it('shows no company-wide reorder badge while one location is shown', async () => {
    renderPage();
    await screen.findAllByRole('option', { name: 'WH-1 · Fake warehouse' });
    expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Stock at'), { target: { value: '9' } });
    await waitFor(() => expect(screen.queryByText('OK')).toBeNull());
    expect(screen.queryByText('Reorder')).toBeNull();
  });

  it('says so when the stock at a location cannot be loaded', async () => {
    axios.get.mockImplementation((url) => {
      if (url.startsWith('/inventory/locations/')) return Promise.resolve(page(LOCATIONS));
      if (url.startsWith('/inventory/batches/')) return Promise.reject({ response: { status: 500 } });
      return Promise.resolve(page(products));
    });
    renderPage();
    await screen.findAllByRole('option', { name: 'WH-1 · Fake warehouse' });
    fireEvent.change(screen.getByLabelText('Stock at'), { target: { value: '9' } });
    expect(await screen.findByText('Could not load the stock at this location.')).toBeInTheDocument();
    expect((await screen.findByText('Dates')).closest('tr')).toHaveTextContent('—');
  });

  it('requires a location when it cannot guess one', async () => {
    serve([...LOCATIONS, { id: 12, code: 'SHOP-2', name: 'Fake second shop', type: 'shop_floor', is_active: true }]);
    renderPage();
    await fillAndSave();
    expect(await screen.findByText('Location is required')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe('InventoryListPage VAT code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serve();
  });

  it('saves a new VAT code for a product', async () => {
    axios.patch.mockResolvedValue({ data: { ...products[0], vat_code: 'standard' } });
    renderPage();
    fireEvent.change(await screen.findByLabelText('VAT for Dates'), { target: { value: 'standard' } });
    await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/inventory/products/4/', { vat_code: 'standard' }));
  });

  it('says so when the VAT code cannot be saved', async () => {
    axios.patch.mockRejectedValue({ response: { status: 403 } });
    renderPage();
    fireEvent.change(await screen.findByLabelText('VAT for Dates'), { target: { value: 'standard' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not change the VAT code.');
  });
});

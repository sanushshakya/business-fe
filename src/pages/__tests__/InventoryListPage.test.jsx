import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import InventoryListPage from '../InventoryListPage';

const queueReceipt = vi.fn();
vi.mock('../../offline/OfflineProvider', () => ({ useOffline: () => ({ queueReceipt }) }));
vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const products = [{ id: 4, name: 'Dates', price: '8.99', stock_quantity: 50, reorder_threshold: 10, vat_code: 'zero' }];
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

const payload = { product: 4, batch_number: 'B-1', quantity: 3, expiration_date: '2027-01-31' };

beforeEach(() => {
  vi.clearAllMocks();
  setOnline(true);
  axios.get.mockResolvedValue({ data: { results: products, next: null } });
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
    expect(await screen.findByText('Could not record the stock.')).toBeInTheDocument();
    expect(queueReceipt).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('InventoryListPage VAT code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: { results: products, next: null } });
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

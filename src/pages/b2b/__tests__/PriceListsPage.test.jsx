import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../../utils/axios';
import PriceListsPage from '../PriceListsPage';

vi.mock('../../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const page = (results) => ({ data: { results, next: null } });
const PRODUCTS = [
  { id: 4, name: 'Fake Rice', sold_by: 'each', plu: '', barcode: '' },
  { id: 5, name: 'Fake Lamb', sold_by: 'weight', is_catch_weight: false, plu: '42', barcode: '' },
];
const CUSTOMERS = [{ id: 7, account_code: 'C-1', legal_name: 'E2E Fake Bistro Ltd', trading_name: '' }];
const GROUPS = [{ id: 3, name: 'Fake Restaurants' }];
const LIST = {
  id: 9,
  name: 'Restaurants 2026',
  priority: 5,
  is_active: true,
  valid_from: null,
  valid_to: null,
  customers: [7],
  groups: [],
  note: '',
  entries: [{ id: 1, product: 4, product_name: 'Fake Rice', min_quantity: '10.000', unit_price: '1.9000' }],
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PriceListsPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/inventory/products/')) return Promise.resolve(page(PRODUCTS));
    if (url.startsWith('/wholesale/customers/')) return Promise.resolve(page(CUSTOMERS));
    if (url.startsWith('/wholesale/groups/')) return Promise.resolve(page(GROUPS));
    return Promise.resolve(page([LIST]));
  });
});

const fill = (scope, label, value) => fireEvent.change(within(scope).getByLabelText(label), { target: { value } });

describe('PriceListsPage', () => {
  it('lists price lists', async () => {
    renderPage();
    const row = (await screen.findByText('Restaurants 2026')).closest('tr');
    expect(within(row).getByText('5')).toBeTruthy();
    expect(within(row).getByText('1 entry')).toBeTruthy();
  });

  it('creates a list with two entries and an assigned customer', async () => {
    axios.post.mockResolvedValue({ data: { ...LIST, id: 10 } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'New price list' }));
    const dialog = screen.getByRole('dialog');
    fill(dialog, 'Name', 'Fake Cafes');
    fill(dialog, 'Priority', '2');
    fill(dialog, 'Valid from', '2026-11-01');
    await within(dialog).findByLabelText('C-1 E2E Fake Bistro Ltd');
    fireEvent.click(within(dialog).getByLabelText('C-1 E2E Fake Bistro Ltd'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add entry' }));
    fill(dialog, 'Entry 1 product', '4');
    fill(dialog, 'Entry 1 from', '1');
    fill(dialog, 'Entry 1 price', '2.10');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add entry' }));
    fill(dialog, 'Entry 2 product', '5');
    fill(dialog, 'Entry 2 from', '0.5');
    fill(dialog, 'Entry 2 price', '8.80');
    expect(within(dialog).getByText('£ per kg')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save price list' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post.mock.calls[0]).toEqual([
      '/wholesale/price-lists/',
      {
        name: 'Fake Cafes',
        priority: 2,
        is_active: true,
        valid_from: '2026-11-01',
        valid_to: null,
        customers: [7],
        groups: [],
        note: '',
        entries: [
          { product: 4, min_quantity: '1', unit_price: '2.10' },
          { product: 5, min_quantity: '0.5', unit_price: '8.80' },
        ],
      },
    ]);
  });

  it('edits a list and shows a 400', async () => {
    axios.patch.mockRejectedValue({
      response: { status: 400, data: { entries: ['Each product has one price per minimum quantity.'] } },
    });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Restaurants 2026' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Entry 1 price').value).toBe('1.9000');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save price list' }));
    expect(await within(dialog).findByText(/one price per minimum quantity/)).toBeTruthy();
    expect(axios.patch.mock.calls[0][0]).toBe('/wholesale/price-lists/9/');
  });
});

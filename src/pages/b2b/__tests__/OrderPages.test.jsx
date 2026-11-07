import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../../utils/axios';
import { openPdf } from '../../../utils/pdf';
import OrderDetailPage from '../OrderDetailPage';
import OrderEntryPage from '../OrderEntryPage';
import OrdersPage from '../OrdersPage';

vi.mock('../../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../../../utils/pdf', () => ({ openPdf: vi.fn(() => Promise.resolve()), default: vi.fn() }));

const page = (results) => ({ data: { results, next: null } });
const ADDRESS = {
  id: 11,
  label: 'Kitchen',
  line1: '1 Fake Street',
  town: 'Testtown',
  postcode: 'TT1 1TT',
  is_default: true,
};
const CUSTOMERS = [
  {
    id: 7,
    account_code: 'C-1',
    legal_name: 'E2E Fake Bistro Ltd',
    trading_name: '',
    status: 'active',
    addresses: [ADDRESS],
  },
];
const PRODUCTS = [{ id: 4, name: 'Fake Rice', sold_by: 'each', plu: '', barcode: '' }];
const LINE = {
  id: 31,
  product: 4,
  product_name: 'Fake Rice',
  quantity: 5,
  weight_kg: null,
  unit_price: '2.0000',
  estimated_net: '10.00',
  reserved: '5',
  short: '0',
  picked_quantity: null,
  picked_weight_kg: null,
  substitution: '',
};
const order = (fields) => ({
  id: 12,
  number_display: 'SO-000012',
  customer_code: 'C-1',
  customer_name: 'E2E Fake Bistro Ltd',
  delivery_date: '2026-11-08',
  line1: '1 Fake Street',
  town: 'Testtown',
  postcode: 'TT1 1TT',
  customer_ref: '',
  off_delivery_day: false,
  is_short: false,
  estimated_net: '10.00',
  estimated_vat: '0.00',
  estimated_gross: '10.00',
  lines: [LINE],
  ...fields,
});
let current;
let invoices;
let returns;

const renderAt = (path) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/b2b/orders" element={<OrdersPage />} />
          <Route path="/dashboard/b2b/orders/new" element={<OrderEntryPage />} />
          <Route path="/dashboard/b2b/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  current = order({ status: 'draft', estimated_gross: null, unit_price: null });
  invoices = [];
  returns = [];
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/wholesale/customers/')) return Promise.resolve(page(CUSTOMERS));
    if (url.startsWith('/inventory/products/')) return Promise.resolve(page(PRODUCTS));
    if (url.startsWith('/wholesale/invoices/')) return Promise.resolve(page(invoices));
    if (url.startsWith('/wholesale/returns/')) return Promise.resolve(page(returns));
    if (url === '/wholesale/orders/12/') return Promise.resolve({ data: current });
    return Promise.resolve(page([current]));
  });
  axios.post.mockResolvedValue({ data: {} });
});

describe('Trade order pages', () => {
  it('saves and confirms a new order, then opens it', async () => {
    axios.post.mockImplementation((url) =>
      Promise.resolve({ data: url === '/wholesale/prices/resolve/' ? { lines: [] } : { id: 12 } })
    );
    renderAt('/dashboard/b2b/orders/new');
    const customer = await screen.findByLabelText('Customer');
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/inventory/products/', expect.anything()));
    fireEvent.change(customer, { target: { value: 'c-1' } });
    fireEvent.keyDown(customer, { key: 'Enter' });
    const search = screen.getByLabelText('Add product');
    fireEvent.change(search, { target: { value: 'rice' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and confirm' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/confirm/', {}));
    expect(axios.post).toHaveBeenCalledWith(
      '/wholesale/orders/',
      expect.objectContaining({ customer: 7, address: 11 })
    );
    expect(await screen.findByText(/SO-000012/)).toBeTruthy();
  });

  it('keeps a draft when the confirm is refused, and says why', async () => {
    axios.post.mockImplementation((url) => {
      if (url.endsWith('/confirm/'))
        return Promise.reject({ response: { status: 400, data: { detail: 'No trade price for: Fake Rice.' } } });
      return Promise.resolve({ data: url === '/wholesale/prices/resolve/' ? { lines: [] } : { id: 12 } });
    });
    renderAt('/dashboard/b2b/orders/new');
    const customer = await screen.findByLabelText('Customer');
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/inventory/products/', expect.anything()));
    fireEvent.change(customer, { target: { value: 'c-1' } });
    fireEvent.keyDown(customer, { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Add product'), { target: { value: 'rice' } });
    fireEvent.keyDown(screen.getByLabelText('Add product'), { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice'), { target: { value: '5' } });
    fireEvent.keyDown(screen.getByLabelText('Add product'), { key: 'Enter', ctrlKey: true });
    expect(await screen.findByText(/Saved as a draft, not confirmed: No trade price for: Fake Rice/)).toBeTruthy();
  });

  it('confirms a draft from the order', async () => {
    renderAt('/dashboard/b2b/orders/12');
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/confirm/', {}));
  });

  it('allocates and cancels a confirmed order (a reason is needed)', async () => {
    current = order({ status: 'confirmed', is_short: true, lines: [{ ...LINE, reserved: '3', short: '2' }] });
    renderAt('/dashboard/b2b/orders/12');
    expect(await screen.findByText('short 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Allocate' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/allocate/', {}));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    const go = screen.getByRole('button', { name: 'Cancel the order' });
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Rang to cancel' } });
    fireEvent.click(go);
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/cancel/', { reason: 'Rang to cancel' })
    );
  });

  it('makes, issues and opens the invoice of a picked order', async () => {
    current = order({ status: 'picked', lines: [{ ...LINE, picked_quantity: 5 }] });
    renderAt('/dashboard/b2b/orders/12');
    fireEvent.click(await screen.findByRole('button', { name: 'Create invoice' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/invoices/', { order: 12 }));
  });

  it('issues a draft invoice and opens its PDF', async () => {
    current = order({ status: 'delivered', lines: [{ ...LINE, picked_quantity: 5 }] });
    invoices = [
      { id: 40, status: 'draft', number_display: 'Draft #40', gross_total: '10.00', email_status: 'not_sent' },
    ];
    renderAt('/dashboard/b2b/orders/12');
    fireEvent.click(await screen.findByRole('button', { name: 'Issue invoice' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/invoices/40/issue/', {}));
    fireEvent.click(screen.getByRole('button', { name: 'Open PDF' }));
    expect(openPdf).toHaveBeenCalledWith('/wholesale/invoices/40/pdf/');
  });

  it('says so when the invoice PDF cannot be opened', async () => {
    openPdf.mockRejectedValueOnce({ response: { status: 403, data: { detail: 'You do not have permission.' } } });
    current = order({ status: 'delivered', lines: [{ ...LINE, picked_quantity: 5 }] });
    invoices = [{ id: 40, status: 'issued', number_display: 'INV-000001', gross_total: '10.00', email_status: 'sent' }];
    renderAt('/dashboard/b2b/orders/12');
    fireEvent.click(await screen.findByRole('button', { name: 'Open PDF' }));
    expect(await screen.findByText('You do not have permission.')).toBeTruthy();
  });

  it('refuses a return amount that is not whole units, without sending it', async () => {
    current = order({ status: 'delivered', lines: [{ ...LINE, picked_quantity: 5 }] });
    renderAt('/dashboard/b2b/orders/12');
    const form = (await screen.findByRole('button', { name: 'Record return' })).closest('form');
    fireEvent.change(within(form).getByLabelText('Return Fake Rice'), { target: { value: 'abc' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Record return' }));
    expect(await within(form).findByText('Fake Rice: give whole units.')).toBeTruthy();
    expect(axios.post).not.toHaveBeenCalledWith('/wholesale/orders/12/returns/', expect.anything());
  });

  it('records a return and drafts its credit note', async () => {
    current = order({ status: 'invoiced', lines: [{ ...LINE, picked_quantity: 5 }] });
    invoices = [{ id: 40, status: 'issued', number_display: 'INV-000001', gross_total: '10.00', email_status: 'sent' }];
    returns = [{ id: 70, number_display: 'RET-000001', kind: 'later', credit_note: null }];
    renderAt('/dashboard/b2b/orders/12');
    const form = (await screen.findByRole('button', { name: 'Record return' })).closest('form');
    fireEvent.change(within(form).getByLabelText('Return Fake Rice'), { target: { value: '2' } });
    fireEvent.change(within(form).getByLabelText('Reason Fake Rice'), { target: { value: 'damaged' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Record return' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/wholesale/orders/12/returns/', {
        lines: [{ line: 31, quantity: 2, reason: 'damaged' }],
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Draft credit note' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/credit-notes/', { customer_return: 70 }));
  });

  it('lists orders with a link to each', async () => {
    current = order({ status: 'confirmed' });
    renderAt('/dashboard/b2b/orders');
    const link = await screen.findByRole('link', { name: 'SO-000012' });
    expect(link.getAttribute('href')).toBe('/dashboard/b2b/orders/12');
    expect(screen.getByRole('link', { name: 'New order' })).toBeTruthy();
  });
});

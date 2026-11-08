import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../../utils/axios';
import CustomersPage from '../CustomersPage';

vi.mock('../../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const page = (results) => ({ data: { results, next: null } });
const GROUPS = [{ id: 3, name: 'Fake Restaurants', note: '' }];
const CUSTOMER = {
  id: 7,
  account_code: 'C-1',
  legal_name: 'E2E Fake Bistro Ltd',
  trading_name: 'Fake Bistro',
  vat_number: 'GB123456789',
  status: 'active',
  group: 3,
  payment_terms_days: 30,
  invoice_email: 'ap@example.test',
  delivery_days: ['mon', 'fri'],
  note: '',
  addresses: [
    {
      id: 1,
      label: 'Kitchen',
      line1: '1 Fake Street',
      line2: '',
      town: 'Testtown',
      postcode: 'TT1 1TT',
      instructions: '',
      is_default: true,
    },
  ],
  contacts: [],
};
let customers;

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CustomersPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  customers = [CUSTOMER];
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/wholesale/groups/')) return Promise.resolve(page(GROUPS));
    return Promise.resolve(page(customers));
  });
});

const fill = (scope, label, value) => fireEvent.change(within(scope).getByLabelText(label), { target: { value } });

describe('CustomersPage', () => {
  it('lists customers with their group', async () => {
    renderPage();
    const row = (await screen.findByText('C-1')).closest('tr');
    expect(within(row).getByText('Fake Bistro')).toBeTruthy();
    expect(within(row).getByText('Fake Restaurants')).toBeTruthy();
  });

  it('creates a customer with an address, a contact and a group', async () => {
    axios.post.mockResolvedValue({ data: { ...CUSTOMER, id: 8 } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'New customer' }));
    const dialog = screen.getByRole('dialog');
    fill(dialog, 'Account code', 'c-2');
    fill(dialog, 'Legal name', 'E2E Fake Cafe Ltd');
    fill(dialog, 'Invoice email', 'cafe@example.test');
    fill(dialog, 'Payment terms (days)', '14');
    await within(dialog).findByRole('option', { name: 'Fake Restaurants' });
    fill(dialog, 'Group', '3');
    fireEvent.click(within(dialog).getByLabelText('Tue'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add address' }));
    fill(dialog, 'Address 1 label', 'Back door');
    fill(dialog, 'Address 1 line 1', '2 Fake Road');
    fill(dialog, 'Address 1 town', 'Testtown');
    fill(dialog, 'Address 1 postcode', 'TT2 2TT');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add contact' }));
    fill(dialog, 'Contact 1 name', 'Fake Chef');
    fill(dialog, 'Contact 1 email', 'chef@example.test');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save customer' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    const [url, body] = axios.post.mock.calls[0];
    expect(url).toBe('/wholesale/customers/');
    expect(body).toMatchObject({
      account_code: 'c-2',
      legal_name: 'E2E Fake Cafe Ltd',
      invoice_email: 'cafe@example.test',
      payment_terms_days: 14,
      group: 3,
      delivery_days: ['tue'],
      addresses: [
        { label: 'Back door', line1: '2 Fake Road', town: 'Testtown', postcode: 'TT2 2TT', is_default: true },
      ],
      contacts: [{ name: 'Fake Chef', email: 'chef@example.test', is_primary: true }],
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('edits a customer and shows the server error on a 400, keeping the form', async () => {
    axios.patch.mockRejectedValue({ response: { status: 400, data: { vat_number: ['Not a UK VAT number.'] } } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit C-1' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Legal name').value).toBe('E2E Fake Bistro Ltd');
    fill(dialog, 'VAT number', 'FR1');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save customer' }));
    expect(await within(dialog).findByText(/Not a UK VAT number/)).toBeTruthy();
    expect(axios.patch.mock.calls[0][0]).toBe('/wholesale/customers/7/');
    expect(within(dialog).getByLabelText('VAT number').value).toBe('FR1');
  });

  it('renames a group', async () => {
    axios.patch.mockResolvedValue({ data: { id: 3, name: 'Fake Bistros' } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Rename Fake Restaurants' }));
    fireEvent.change(screen.getByLabelText('New name for Fake Restaurants'), { target: { value: 'Fake Bistros' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/wholesale/groups/3/', { name: 'Fake Bistros' }));
  });

  it('adds and deletes a group', async () => {
    axios.post.mockResolvedValue({ data: { id: 4, name: 'Fake Cafes' } });
    axios.delete.mockResolvedValue({});
    renderPage();
    fireEvent.change(await screen.findByLabelText('New group'), { target: { value: 'Fake Cafes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add group' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/groups/', { name: 'Fake Cafes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete group Fake Restaurants' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete Fake Restaurants' }));
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/wholesale/groups/3/'));
  });

  it('filters by search and status', async () => {
    renderPage();
    await screen.findByText('C-1');
    fireEvent.change(screen.getByLabelText('Search customers'), { target: { value: 'bis' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'on_hold' } });
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        '/wholesale/customers/',
        expect.objectContaining({ params: expect.objectContaining({ search: 'bis', status: 'on_hold' }) })
      )
    );
  });
});

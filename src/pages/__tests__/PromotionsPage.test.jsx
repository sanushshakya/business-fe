import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import PromotionsPage from '../PromotionsPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const page = (results) => ({ data: { results, next: null } });
const PRODUCTS = [
  { id: 1, name: 'Fake Wrap', sold_by: 'each' },
  { id: 3, name: 'Fake Crisps', sold_by: 'each' },
  { id: 4, name: 'Fake Cola', sold_by: 'each' },
  { id: 5, name: 'Fake Mince', sold_by: 'weight' },
];
const LIVE = {
  id: 7,
  name: 'Fake 3 for £5',
  kind: 'multi_buy',
  priority: 0,
  starts_on: '2026-06-01',
  ends_on: null,
  is_active: true,
  stacks: false,
  buy_quantity: 3,
  get_quantity: null,
  deal_price: '5.00',
  percent: null,
  products: [4],
  categories: [],
  branches: [],
  groups: [],
  status: 'live',
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PromotionsPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/inventory/products/')) return Promise.resolve(page(PRODUCTS));
    if (url.startsWith('/inventory/categories/')) return Promise.resolve(page([{ id: 9, name: 'Fake Drinks' }]));
    if (url.startsWith('/tenants/branches/')) return Promise.resolve(page([{ id: 2, name: 'Fake High St' }]));
    return Promise.resolve(page([LIVE]));
  });
});

const fill = (scope, label, value) => fireEvent.change(within(scope).getByLabelText(label), { target: { value } });

describe('PromotionsPage', () => {
  it('lists live promotions with what they give', async () => {
    renderPage();
    const row = (await screen.findByText('Fake 3 for £5')).closest('tr');
    expect(within(row).getByText('3 for £5.00')).toBeInTheDocument();
    expect(within(row).getByText('live')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(
      '/promotions/promotions/',
      expect.objectContaining({
        params: expect.objectContaining({ status: 'live' }),
      })
    );
  });

  it('creates a meal deal with its groups, offering only products sold each', async () => {
    axios.post.mockResolvedValue({ data: { ...LIVE, id: 8 } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'New promotion' }));
    const dialog = await screen.findByRole('dialog');
    fill(dialog, 'Name', 'Fake Meal Deal');
    fill(dialog, 'Kind', 'meal_deal');
    fill(dialog, 'Starts', '2026-06-10');
    fill(dialog, 'Deal price', '3.50');
    await within(dialog).findAllByLabelText('Fake Wrap');
    expect(within(dialog).queryByLabelText('Fake Mince')).toBeNull();
    const groups = within(dialog)
      .getAllByRole('group')
      .filter((g) => /products$/.test(g.querySelector('legend')?.textContent ?? ''));
    fireEvent.click(within(groups[0]).getByLabelText('Fake Wrap'));
    fireEvent.click(within(groups[1]).getByLabelText('Fake Crisps'));
    fireEvent.click(within(groups[2]).getByLabelText('Fake Cola'));
    fireEvent.click(within(dialog).getByLabelText('Fake High St'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save promotion' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post.mock.calls[0]).toEqual([
      '/promotions/promotions/',
      expect.objectContaining({
        name: 'Fake Meal Deal',
        kind: 'meal_deal',
        starts_on: '2026-06-10',
        ends_on: null,
        deal_price: '3.50',
        products: [],
        percent: null,
        branches: [2],
        groups: [
          { name: 'Main', products: [1] },
          { name: 'Snack', products: [3] },
          { name: 'Drink', products: [4] },
        ],
      }),
    ]);
  });

  it("shows the server's refusal and keeps the form", async () => {
    axios.post.mockRejectedValue({ response: { status: 400, data: { buy_quantity: ['A set is 2 to 99 items.'] } } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'New promotion' }));
    const dialog = await screen.findByRole('dialog');
    fill(dialog, 'Name', 'Fake bad');
    fill(dialog, 'Starts', '2026-06-10');
    fill(dialog, 'Buy', '1');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save promotion' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('A set is 2 to 99 items.');
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Fake bad');
  });

  it('ends a promotion on the second click', async () => {
    axios.post.mockResolvedValue({ data: { ...LIVE, status: 'ended' } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'End Fake 3 for £5' }));
    expect(axios.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm end Fake 3 for £5' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/promotions/promotions/7/end/'));
  });

  it('edits without changing the kind', async () => {
    axios.patch.mockResolvedValue({ data: LIVE });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Fake 3 for £5' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Kind')).toBeDisabled();
    fill(dialog, 'Deal price', '4.50');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save promotion' }));
    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith(
        '/promotions/promotions/7/',
        expect.objectContaining({ deal_price: '4.50', products: [4], buy_quantity: 3 })
      )
    );
  });
});

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import BreakdownsPage from '../BreakdownsPage';
import WriteOffsPage from '../WriteOffsPage';
import YieldWastePage from '../YieldWastePage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const page = (results) => ({ data: { results, next: null, count: results.length } });
const LOCATIONS = [
  { id: 5, code: 'BUTCH-1', name: 'Fake Butchery', type: 'butchery', is_active: true },
  { id: 7, code: 'SHOP-1', name: 'Fake shop floor', type: 'shop_floor', is_active: true },
];
const PRODUCTS = [
  { id: 1, name: 'Fake Side of Beef', sold_by: 'weight', is_catch_weight: false },
  { id: 2, name: 'Fake Rump Steak', sold_by: 'weight', is_catch_weight: false },
];
const TEMPLATES = [
  {
    id: 9,
    name: 'Fake side',
    input_product: 1,
    expected_loss_percent: '3.00',
    outputs: [{ id: 21, kind: 'product', product: 2, name: '', expected_percent: '97.00' }],
  },
];
const BATCHES = [
  { id: 70, product: 1, batch_number: 'SIDE-1', quantity: 0, weight_kg: '10.000', expiration_date: '2026-11-10' },
  { id: 73, product: 1, batch_number: 'EMPTY', quantity: 0, weight_kg: '0.000', expiration_date: '2026-11-10' },
];
const PENDING = {
  id: 5,
  reference: 'WO-000005',
  product_name: 'Fake Rump Steak',
  batch_number: 'SIDE-1',
  reason: 'expired',
  quantity: 0,
  weight_kg: '1.250',
  cost: '60.00',
  status: 'pending',
  created_by: 3,
};

const serve = (extra = {}) =>
  axios.get.mockImplementation((url) => {
    if (url === '/auth/me/') return Promise.resolve({ data: { id: 9, is_staff: true } });
    if (url.startsWith('/inventory/locations/')) return Promise.resolve(page(LOCATIONS));
    if (url.startsWith('/inventory/products/')) return Promise.resolve(page(PRODUCTS));
    if (url.startsWith('/inventory/yield-templates/')) return Promise.resolve(page(TEMPLATES));
    if (url.startsWith('/inventory/batches/')) return Promise.resolve(page(BATCHES));
    if (url.startsWith('/inventory/breakdowns/')) return Promise.resolve(page([]));
    if (url.startsWith('/inventory/write-offs/')) return Promise.resolve(page(extra.writeOffs ?? []));
    if (url.startsWith('/inventory/reports/')) return Promise.resolve({ data: extra.report });
    return Promise.reject(new Error(`unexpected ${url}`));
  });

const renderPage = (Page) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Page />
    </QueryClientProvider>
  );
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => vi.clearAllMocks());

describe('BreakdownsPage', () => {
  it('records a breakdown at the only butchery and says so', async () => {
    serve();
    axios.post.mockResolvedValue({ data: { id: 1, reference: 'BD-000001' } });
    renderPage(BreakdownsPage);
    await screen.findByRole('option', { name: 'Fake side' });
    expect(screen.getByLabelText('Butchery')).toHaveValue('5');
    type('Template', '9');
    await screen.findByRole('option', { name: /SIDE-1/ });
    expect(screen.queryByRole('option', { name: /EMPTY/ })).toBeNull(); // no stock left
    type('Input batch', '70');
    type('Fake Rump Steak (kg)', '9.700');
    fireEvent.click(screen.getByRole('button', { name: 'Record breakdown' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        '/inventory/breakdowns/',
        expect.objectContaining({ template: 9, location: 5, input_batch: 70, input_kg: '10.000' })
      )
    );
    expect(await screen.findByRole('status')).toHaveTextContent('BD-000001 recorded.');
  });

  it("shows the server's reason when it refuses", async () => {
    serve();
    axios.post.mockRejectedValue({ response: { status: 400, data: { loss_reason: ['Give a reason.'] } } });
    renderPage(BreakdownsPage);
    await screen.findByRole('option', { name: 'Fake side' });
    type('Template', '9');
    await screen.findByRole('option', { name: /SIDE-1/ });
    type('Input batch', '70');
    type('Fake Rump Steak (kg)', '5.000');
    fireEvent.click(screen.getByRole('button', { name: 'Record breakdown' }));
    expect(await screen.findByText(/Give a reason/)).toBeInTheDocument();
  });
});

describe('WriteOffsPage', () => {
  it('lets a manager approve a pending write-off raised by someone else', async () => {
    serve({ writeOffs: [PENDING] });
    axios.post.mockResolvedValue({ data: { ...PENDING, status: 'written_off' } });
    renderPage(WriteOffsPage);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve WO-000005' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/inventory/write-offs/5/approve/', {}));
  });

  it('filters by status', async () => {
    serve();
    renderPage(WriteOffsPage);
    await screen.findByText('No write-offs');
    type('Status', 'pending');
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith('/inventory/write-offs/', {
        params: { status: 'pending', page: 1, page_size: 20 },
      })
    );
  });
});

describe('YieldWastePage', () => {
  it('asks for the yield report by the chosen group and dates, then the waste report', async () => {
    serve({ report: { from: '2026-11-01', to: '2026-11-04', group: 'product', rows: [] } });
    renderPage(YieldWastePage);
    expect(await screen.findByText('No breakdowns in these dates.')).toBeInTheDocument();
    type('From', '2026-11-01');
    type('Group', 'supplier');
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith('/inventory/reports/yield/', {
        params: { group: 'supplier', from: '2026-11-01' },
      })
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Waste' }));
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith('/inventory/reports/waste/', {
        params: { group: 'reason', from: '2026-11-01' },
      })
    );
  });
});

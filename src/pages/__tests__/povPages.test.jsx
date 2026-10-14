import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import DemandPovPage from '../DemandPovPage';
import FreightPovPage from '../FreightPovPage';
import SupplierPovPage from '../SupplierPovPage';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const page = (results) => ({ data: { count: results.length, next: null, results } });
const serve = (routes) =>
  axios.get.mockImplementation((url) => {
    if (url in routes) return Promise.resolve(routes[url]);
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
const renderPage = (ui) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
    >
      {ui}
    </QueryClientProvider>
  );

beforeEach(() => vi.clearAllMocks());

describe('DemandPovPage', () => {
  it('shows alerts, upcoming events and what is running low', async () => {
    serve({
      '/common/api/alerts/demand/': page([
        {
          id: 1,
          product: 'Rice',
          branch: 'Leeds',
          requested_qty: 40,
          created_at: '2026-10-01T10:00:00Z',
          is_handled: false,
        },
        {
          id: 2,
          product: 'Ghee',
          branch: 'York',
          requested_qty: 10,
          created_at: '2026-10-02T10:00:00Z',
          is_handled: false,
        },
      ]),
      '/calendar/upcoming/': {
        data: [
          {
            month: 'November 2026',
            events: [
              {
                id: 3,
                name: 'Diwali',
                date_range: '08 Nov 2026 - 12 Nov 2026',
                product_categories: ['Sweets'],
                demand_multiplier: '2.50',
              },
            ],
          },
        ],
      },
      '/common/api/alerts/stock/': page([
        { id: 1, product: 7, current_qty: 0, threshold: 5 },
        { id: 2, product: 8, current_qty: 3, threshold: 5 },
      ]),
      '/inventory/products/': page([
        { id: 7, name: 'Dates' },
        { id: 8, name: 'Flour' },
      ]),
    });
    renderPage(<DemandPovPage />);

    expect(await screen.findByText('Diwali')).toBeInTheDocument();
    expect(screen.getByText('×2.5 demand')).toBeInTheDocument();
    expect(screen.getByText('Sweets')).toBeInTheDocument();
    expect(await screen.findByText('Dates')).toBeInTheDocument();
    expect(screen.getByText('Out')).toBeInTheDocument();
    expect(screen.getByText('3 left')).toBeInTheDocument();
    const kpis = screen.getByText('Open demand alerts').closest('div');
    expect(kpis).toHaveTextContent('2');
    expect(screen.getByText('Events in the next 90 days').closest('div')).toHaveTextContent('1');
    expect(await screen.findByText('40 requested')).toBeInTheDocument(); // the alerts list below
  });
});

describe('FreightPovPage', () => {
  const routes = () => ({
    '/logistics/freight-alerts/': page([
      {
        id: 1,
        shipping_lane: 'CN-UK-SEA',
        baseline_rate: '1000',
        current_rate: '1200',
        change_percent: 20,
        is_dismissed: false,
      },
      {
        id: 2,
        shipping_lane: 'IN-UK-AIR',
        baseline_rate: '5',
        current_rate: '4',
        change_percent: -20,
        is_dismissed: true,
      },
    ]),
    '/logistics/providers/': page([{ id: 4, name: 'DHL', address: 'x', phone_number: '0123' }]),
    '/logistics/deliveries/': page([
      { id: 9, provider: 4, shipment_date: '2026-10-20', status: 'In Transit' },
      { id: 10, provider: 4, shipment_date: '2026-10-01', status: 'Delivered' },
    ]),
    '/logistics/freight-rates/': page([
      { id: 1, service_code: 'CN-UK-SEA', rate: '1200.00', currency: 'GBP', last_updated: '2026-10-10T10:00:00Z' },
    ]),
  });

  it('summarises the lanes, carriers and deliveries', async () => {
    serve(routes());
    renderPage(<FreightPovPage />);
    expect(await screen.findByText('Current rates')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Deliveries in progress').closest('div')).toHaveTextContent('1'));
    expect(screen.getByText('Rate alerts').closest('div')).toHaveTextContent('1'); // the dismissed one is not counted
    expect(screen.getByText('£1200.00')).toBeInTheDocument();
    expect(screen.getAllByText('DHL').length).toBeGreaterThan(0);
  });

  it('changes a delivery status', async () => {
    serve(routes());
    axios.patch.mockResolvedValue({});
    renderPage(<FreightPovPage />);
    fireEvent.change(await screen.findByLabelText('Status of delivery 9'), { target: { value: 'Delivered' } });
    await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/logistics/deliveries/9/', { status: 'Delivered' }));
  });

  it('adds a carrier and keeps the form when it fails', async () => {
    serve(routes());
    axios.post.mockRejectedValueOnce({ response: { status: 400, data: { name: ['This field is required.'] } } });
    renderPage(<FreightPovPage />);
    await screen.findByText('Current rates');
    fireEvent.change(screen.getByLabelText('Carrier name'), { target: { value: 'UPS' } });
    fireEvent.change(screen.getByLabelText('Carrier address'), { target: { value: '1 Road' } });
    fireEvent.change(screen.getByLabelText('Carrier phone'), { target: { value: '0777' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add carrier' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This field is required.');
    expect(screen.getByLabelText('Carrier name')).toHaveValue('UPS');
    expect(axios.post).toHaveBeenCalledWith('/logistics/providers/', {
      name: 'UPS',
      address: '1 Road',
      phone_number: '0777',
    });
  });

  it('adds a delivery', async () => {
    serve(routes());
    axios.post.mockResolvedValue({});
    renderPage(<FreightPovPage />);
    const select = await screen.findByLabelText('Carrier');
    await within(select).findByRole('option', { name: 'DHL' });
    fireEvent.change(select, { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Shipment date'), { target: { value: '2026-11-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add delivery' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/logistics/deliveries/', { provider: 4, shipment_date: '2026-11-02' })
    );
  });
});

describe('SupplierPovPage', () => {
  const past = '2020-01-01';
  const future = '2999-01-01';
  const routes = () => ({
    '/logistics/suppliers/': page([
      { id: 1, name: 'Spice Co', country_of_origin: 'India', lead_time_days: 14, product_categories: ['Spices'] },
    ]),
    '/logistics/alternative-suppliers/': page([]),
    '/inventory/suppliers/': page([{ id: 5, name: 'Spice Co' }]),
    '/pricing/invoices/': page([
      {
        id: 1,
        invoice_number: 'INV-1',
        supplier: 5,
        total_amount: '100.50',
        due_date: past,
        payment_status: 'pending',
      },
      {
        id: 2,
        invoice_number: 'INV-2',
        supplier: 5,
        total_amount: '20.00',
        due_date: future,
        payment_status: 'pending',
      },
      { id: 3, invoice_number: 'INV-3', supplier: 5, total_amount: '999.00', due_date: past, payment_status: 'paid' },
    ]),
  });

  it('adds up what is owed and flags overdue invoices', async () => {
    serve(routes());
    renderPage(<SupplierPovPage />);
    expect(await screen.findByText('INV-1')).toBeInTheDocument();
    expect(screen.getByText('Owed (unpaid invoices)').closest('div')).toHaveTextContent('£120.50');
    expect(screen.getByText('Overdue invoices').closest('div')).toHaveTextContent('1');
    expect(screen.getAllByText('overdue').length).toBe(1); // INV-1 only: the future one is not late and the paid one is settled
    expect(screen.getAllByText('Spice Co').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Mark INV-3 paid' })).not.toBeInTheDocument();
  });

  it('marks an invoice paid', async () => {
    serve(routes());
    axios.patch.mockResolvedValue({});
    renderPage(<SupplierPovPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Mark INV-2 paid' }));
    await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/pricing/invoices/2/', { payment_status: 'paid' }));
  });

  it('says why when an invoice cannot be updated', async () => {
    serve(routes());
    axios.patch.mockRejectedValue({ response: { status: 403, data: { message: 'Not allowed.' } } });
    renderPage(<SupplierPovPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Mark INV-2 paid' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed.');
  });
});

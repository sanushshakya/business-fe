import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../../utils/axios';
import { openPdf } from '../../../utils/pdf';
import DriverPage from '../DriverPage';
import RunPage from '../RunPage';
import RunsPage from '../RunsPage';

vi.mock('../../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('../../../utils/pdf', () => ({ openPdf: vi.fn(() => Promise.resolve()), default: vi.fn() }));

const page = (results) => ({ data: { results, next: null } });
const STOP = {
  id: 61,
  position: 1,
  order: 12,
  order_number: 'SO-000012',
  customer_name: 'E2E Fake Bistro Ltd',
  line1: '1 Fake Street',
  town: 'Testtown',
  postcode: 'TT1 1TT',
  instructions: '',
  status: 'pending',
  has_photo: false,
  lines: [
    {
      id: 31,
      product_name: 'Fake Rice',
      sold_by: 'each',
      is_catch_weight: false,
      picked_quantity: 5,
      picked_weight_kg: null,
    },
  ],
};
let run;

const renderAt = (path) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/b2b/runs" element={<RunsPage />} />
          <Route path="/dashboard/b2b/runs/:id" element={<RunPage />} />
          <Route path="/dashboard/driver" element={<DriverPage />} />
          <Route path="/dashboard/driver/:id" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  run = {
    id: 3,
    number_display: 'RUN-000003',
    run_date: '2026-11-08',
    vehicle: 21,
    vehicle_code: 'VAN-1',
    driver: 51,
    driver_name: 'Fake Driver',
    status: 'planned',
    note: '',
    stops: [STOP],
  };
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/inventory/locations/'))
      return Promise.resolve(
        page([
          {
            id: 21,
            code: 'VAN-1',
            name: 'Fake van',
            type: 'van',
            is_active: true,
            sellable: false,
            online_sellable: false,
          },
          { id: 22, code: 'WH-1', name: 'Fake warehouse', type: 'warehouse', is_active: true },
        ])
      );
    if (url.startsWith('/tenants/operators/'))
      return Promise.resolve(
        page([
          { id: 51, name: 'Fake Driver', role: 'driver', is_active: true },
          { id: 52, name: 'Fake Stock', role: 'stock', is_active: true },
        ])
      );
    if (url.startsWith('/wholesale/orders/'))
      return Promise.resolve(page([{ id: 13, number_display: 'SO-000013', customer_name: 'E2E Fake Cafe Ltd' }]));
    if (url === '/wholesale/runs/3/') return Promise.resolve({ data: run });
    return Promise.resolve(page([run]));
  });
  axios.post.mockResolvedValue({ data: {} });
  axios.patch.mockResolvedValue({ data: {} });
});

describe('Run pages', () => {
  it('plans a run with only vans and drivers offered', async () => {
    axios.post.mockResolvedValue({ data: { id: 4 } });
    renderAt('/dashboard/b2b/runs');
    fireEvent.click(await screen.findByRole('button', { name: 'Plan a run' }));
    const dialog = screen.getByRole('dialog');
    await within(dialog).findByRole('option', { name: 'VAN-1 Fake van' });
    expect(within(dialog).queryByRole('option', { name: 'WH-1 Fake warehouse' })).toBeNull();
    expect(within(dialog).queryByRole('option', { name: 'Fake Stock' })).toBeNull();
    fireEvent.change(within(dialog).getByLabelText('Van'), { target: { value: '21' } });
    fireEvent.change(within(dialog).getByLabelText('Driver'), { target: { value: '51' } });
    fireEvent.click(await within(dialog).findByLabelText('SO-000013 E2E Fake Cafe Ltd'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save run' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        '/wholesale/runs/',
        expect.objectContaining({ vehicle: 21, driver: 51, orders: [13] })
      )
    );
  });

  it('starts, re-plans and prints a planned run; completes an out one', async () => {
    renderAt('/dashboard/b2b/runs/3');
    fireEvent.click(await screen.findByRole('button', { name: 'Manifest' }));
    expect(openPdf).toHaveBeenCalledWith('/wholesale/runs/3/manifest/');
    fireEvent.click(screen.getByRole('button', { name: 'Re-plan' }));
    fireEvent.click(await within(screen.getByRole('dialog')).findByLabelText('SO-000013 E2E Fake Cafe Ltd'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save run' }));
    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith('/wholesale/runs/3/', expect.objectContaining({ orders: [12, 13] }))
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start the run' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/runs/3/start/', {}));
  });

  it('shows a refused start and the run again', async () => {
    axios.post.mockRejectedValue({ response: { status: 400, data: { detail: 'This run is out.' } } });
    renderAt('/dashboard/b2b/runs/3');
    fireEvent.click(await screen.findByRole('button', { name: 'Start the run' }));
    expect(await screen.findByText('This run is out.')).toBeTruthy();
  });

  it('opens a stop photo and completes an out run', async () => {
    run = {
      ...run,
      status: 'out',
      stops: [
        {
          ...STOP,
          status: 'delivered',
          received_by: 'Fake Chef',
          delivered_at: '2026-11-08T10:15:00Z',
          has_photo: true,
        },
      ],
    };
    renderAt('/dashboard/b2b/runs/3');
    fireEvent.click(await screen.findByRole('button', { name: 'Photo' }));
    expect(openPdf).toHaveBeenCalledWith('/wholesale/runs/3/stops/61/photo/');
    fireEvent.click(screen.getByRole('button', { name: 'Complete the run' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/runs/3/complete/', {}));
  });
});

describe('Driver page', () => {
  it('lists the driver runs and records a delivery and a refusal to deliver', async () => {
    run = { ...run, status: 'out', stops: [STOP, { ...STOP, id: 62, position: 2, order_number: 'SO-000013' }] };
    renderAt('/dashboard/driver');
    expect((await screen.findByRole('link', { name: /RUN-000003/ })).getAttribute('href')).toBe('/dashboard/driver/3');
  });

  it('records a delivery and a stop not delivered, and keeps a refused delivery', async () => {
    run = { ...run, status: 'out', stops: [STOP, { ...STOP, id: 62, position: 2, order_number: 'SO-000013' }] };
    renderAt('/dashboard/driver/3');
    const [first, second] = await screen.findAllByRole('article');
    fireEvent.click(within(first).getByRole('button', { name: 'Delivered' }));
    fireEvent.change(within(first).getByLabelText('Received by'), { target: { value: 'Fake Chef' } });
    axios.post.mockRejectedValueOnce({
      response: { status: 400, data: { detail: 'The delivery time must be between the start of the run and now.' } },
    });
    fireEvent.click(within(first).getByRole('button', { name: 'Record delivery' }));
    expect(await within(first).findByText(/between the start of the run and now/)).toBeTruthy();
    expect(within(first).getByLabelText('Received by').value).toBe('Fake Chef');
    fireEvent.click(within(first).getByRole('button', { name: 'Record delivery' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenLastCalledWith('/wholesale/runs/3/stops/61/deliver/', {
        received_by: 'Fake Chef',
        notes: '',
      })
    );
    fireEvent.click(within(second).getByRole('button', { name: 'Not delivered' }));
    fireEvent.change(within(second).getByLabelText('Why not delivered'), { target: { value: 'Closed' } });
    fireEvent.click(within(second).getByRole('button', { name: 'Record not delivered' }));
    await waitFor(() =>
      expect(axios.post).toHaveBeenLastCalledWith('/wholesale/runs/3/stops/62/fail/', { reason: 'Closed' })
    );
  });
});

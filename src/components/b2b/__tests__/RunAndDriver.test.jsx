import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DriverStop from '../DriverStop';
import RunForm from '../RunForm';

const VANS = [{ id: 21, code: 'VAN-1', name: 'Fake van' }];
const DRIVERS = [{ id: 51, name: 'Fake Driver' }];
const ORDERS = [
  { id: 12, number_display: 'SO-000012', customer_name: 'E2E Fake Bistro Ltd', delivery_date: '2026-11-08' },
  { id: 13, number_display: 'SO-000013', customer_name: 'E2E Fake Cafe Ltd', delivery_date: '2026-11-08' },
];

describe('RunForm', () => {
  it('plans a run with the orders in driving order', () => {
    const onSubmit = vi.fn();
    render(<RunForm vans={VANS} drivers={DRIVERS} orders={ORDERS} today="2026-11-08" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Van'), { target: { value: '21' } });
    fireEvent.change(screen.getByLabelText('Driver'), { target: { value: '51' } });
    fireEvent.click(screen.getByLabelText('SO-000012 E2E Fake Bistro Ltd'));
    fireEvent.click(screen.getByLabelText('SO-000013 E2E Fake Cafe Ltd'));
    fireEvent.click(screen.getByRole('button', { name: 'Move SO-000013 up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save run' }));
    expect(onSubmit).toHaveBeenCalledWith({
      run_date: '2026-11-08',
      vehicle: 21,
      driver: 51,
      orders: [13, 12],
      note: '',
    });
  });

  it('keeps the current stops when re-planning', () => {
    const onSubmit = vi.fn();
    const run = {
      id: 3,
      run_date: '2026-11-08',
      vehicle: 21,
      driver: 51,
      note: '',
      stops: [{ order: 13 }, { order: 12 }],
    };
    render(<RunForm run={run} vans={VANS} drivers={DRIVERS} orders={ORDERS} today="2026-11-08" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save run' }));
    expect(onSubmit.mock.calls[0][0].orders).toEqual([13, 12]);
  });
});

const STOP = {
  id: 61,
  position: 1,
  order_number: 'SO-000012',
  customer_name: 'E2E Fake Bistro Ltd',
  line1: '1 Fake Street',
  town: 'Testtown',
  postcode: 'TT1 1TT',
  instructions: 'Back door',
  status: 'pending',
  lines: [
    {
      id: 31,
      product_name: 'Fake Rice',
      sold_by: 'each',
      is_catch_weight: false,
      picked_quantity: 5,
      picked_weight_kg: null,
    },
    {
      id: 32,
      product_name: 'Fake Lamb',
      sold_by: 'weight',
      is_catch_weight: false,
      picked_quantity: null,
      picked_weight_kg: '2.000',
    },
  ],
};

describe('DriverStop', () => {
  it('records a plain delivery as JSON', async () => {
    const onDeliver = vi.fn(() => Promise.resolve());
    render(<DriverStop stop={STOP} onDeliver={onDeliver} onFail={vi.fn()} />);
    expect(screen.getByText('Back door')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));
    fireEvent.change(screen.getByLabelText('Received by'), { target: { value: 'Fake Chef' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record delivery' }));
    await waitFor(() => expect(onDeliver).toHaveBeenCalledWith({ received_by: 'Fake Chef', notes: '' }));
  });

  it('sends a photo and refusals as a multipart form', async () => {
    const onDeliver = vi.fn(() => Promise.resolve());
    render(<DriverStop stop={STOP} onDeliver={onDeliver} onFail={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));
    fireEvent.change(screen.getByLabelText('Received by'), { target: { value: 'Fake Chef' } });
    const photo = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'door.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Photo'), { target: { files: [photo] } });
    fireEvent.click(screen.getByRole('button', { name: 'Refused something?' }));
    fireEvent.change(screen.getByLabelText('Refused Fake Rice'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Refused kg Fake Lamb'), { target: { value: '0.500' } });
    fireEvent.change(screen.getByLabelText('Reason Fake Lamb'), { target: { value: 'damaged' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record delivery' }));
    await waitFor(() => expect(onDeliver).toHaveBeenCalled());
    const form = onDeliver.mock.calls[0][0];
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('received_by')).toBe('Fake Chef');
    expect(form.get('photo')).toBe(photo);
    expect(JSON.parse(form.get('refused'))).toEqual([
      { line: 31, quantity: 1, reason: 'not_wanted' },
      { line: 32, weight_kg: '0.500', reason: 'damaged' },
    ]);
  });

  it('keeps what was typed when the server refuses it', async () => {
    const onDeliver = vi.fn(() => Promise.reject(new Error('400')));
    render(<DriverStop stop={STOP} error="The photo is larger than 5 MB." onDeliver={onDeliver} onFail={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));
    fireEvent.change(screen.getByLabelText('Received by'), { target: { value: 'Fake Chef' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record delivery' }));
    await waitFor(() => expect(onDeliver).toHaveBeenCalled());
    expect(screen.getByLabelText('Received by').value).toBe('Fake Chef');
    expect(screen.getByRole('alert').textContent).toBe('The photo is larger than 5 MB.');
  });

  it('records not delivered with a reason; a recorded stop is read-only', async () => {
    const onFail = vi.fn(() => Promise.resolve());
    const { rerender } = render(<DriverStop stop={STOP} onDeliver={vi.fn()} onFail={onFail} />);
    fireEvent.click(screen.getByRole('button', { name: 'Not delivered' }));
    const go = screen.getByRole('button', { name: 'Record not delivered' });
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Why not delivered'), { target: { value: 'Closed' } });
    fireEvent.click(go);
    await waitFor(() => expect(onFail).toHaveBeenCalledWith('Closed'));
    rerender(
      <DriverStop
        stop={{ ...STOP, status: 'delivered', received_by: 'Fake Chef' }}
        onDeliver={vi.fn()}
        onFail={onFail}
      />
    );
    expect(within(screen.getByRole('article')).getByText(/Delivered · Fake Chef/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Delivered' })).toBeNull();
  });
});

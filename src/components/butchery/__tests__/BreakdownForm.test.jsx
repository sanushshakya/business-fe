import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BreakdownForm from '../BreakdownForm';

const LOCATIONS = [{ id: 5, code: 'BUTCH-1', name: 'Fake Butchery', type: 'butchery', is_active: true }];
const PRODUCTS = [
  { id: 1, name: 'Fake Side of Beef', is_catch_weight: false },
  { id: 2, name: 'Fake Rump Steak', is_catch_weight: false },
  { id: 3, name: 'Fake Lamb Chops', is_catch_weight: true },
  { id: 4, name: 'Fake Lamb Carcass', is_catch_weight: true },
];
const TEMPLATES = [
  {
    id: 9,
    name: 'Fake side',
    input_product: 1,
    expected_loss_percent: '3.00',
    outputs: [
      { id: 21, kind: 'product', product: 2, name: '', expected_percent: '30.00' },
      { id: 22, kind: 'waste', product: null, name: 'Bone', expected_percent: '15.00' },
    ],
  },
  {
    id: 10,
    name: 'Fake lamb',
    input_product: 4,
    expected_loss_percent: '5.00',
    outputs: [{ id: 31, kind: 'product', product: 3, name: '', expected_percent: '95.00' }],
  },
];
const BATCHES = [
  { id: 70, product: 1, batch_number: 'SIDE-1', quantity: 0, weight_kg: '10.000', expiration_date: '2026-11-10' },
  { id: 71, product: 4, batch_number: 'LAMB-1', quantity: 4, weight_kg: '20.000', expiration_date: '2026-11-10' },
  { id: 72, product: 2, batch_number: 'OTHER', quantity: 0, weight_kg: '3.000', expiration_date: '2026-11-10' },
];

const renderForm = (props = {}) => {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue();
  const onLocationChange = vi.fn();
  render(
    <BreakdownForm
      locations={LOCATIONS}
      location="5"
      onLocationChange={onLocationChange}
      templates={TEMPLATES}
      batches={BATCHES}
      products={PRODUCTS}
      onSubmit={onSubmit}
      {...props}
    />
  );
  return { onSubmit, onLocationChange };
};
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('BreakdownForm', () => {
  it("offers only the template's input batches and a kg row per output", () => {
    renderForm();
    type('Template', '9');
    const batch = screen.getByLabelText('Input batch');
    expect(
      within(batch)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['Choose a batch', 'SIDE-1 · 10.000 kg · use by 10/11/2026']);
    expect(screen.getByLabelText('Fake Rump Steak (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Bone (kg)')).toBeInTheDocument();
  });

  it('shows the loss as input − outputs, against the expected loss', () => {
    renderForm();
    type('Template', '9');
    type('Input batch', '70');
    expect(screen.getByLabelText('Input (kg)')).toHaveValue('10.000'); // the whole batch by default
    type('Fake Rump Steak (kg)', '3');
    type('Bone (kg)', '6.5');
    expect(screen.getByText('Loss 0.500 kg (5.0%) · expected 3.0%')).toBeInTheDocument();
    type('Bone (kg)', '7.5');
    expect(screen.getByRole('alert')).toHaveTextContent('The outputs weigh 0.500 kg more than the input.');
  });

  it('sends the breakdown, skipping empty rows, with a client_ref reused on an unchanged retry', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('no answer')); // the form keeps what was typed
    renderForm({ onSubmit });
    type('Template', '9');
    type('Input batch', '70');
    type('Fake Rump Steak (kg)', '3.000');
    type('Loss reason', 'Fake drip');
    fireEvent.click(screen.getByRole('button', { name: 'Record breakdown' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const body = onSubmit.mock.calls[0][0];
    expect(body).toEqual({
      template: 9,
      location: 5,
      input_batch: 70,
      input_kg: '10.000',
      lines: [{ output: 21, weight_kg: '3.000' }],
      loss_reason: 'Fake drip',
      client_ref: expect.any(String),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record breakdown' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0].client_ref).toBe(body.client_ref);
    type('Fake Rump Steak (kg)', '3.100'); // a changed breakdown is a new one
    fireEvent.click(screen.getByRole('button', { name: 'Record breakdown' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(3));
    expect(onSubmit.mock.calls[2][0].client_ref).not.toBe(body.client_ref);
  });

  it('asks for pieces for catch-weight inputs and outputs', async () => {
    const { onSubmit } = renderForm();
    type('Template', '10');
    type('Input batch', '71');
    expect(screen.queryByLabelText('Input (kg)')).toBeNull();
    type('Input pieces', '2'); // 2 of 4 pieces: 10.000 kg
    type('Fake Lamb Chops (kg)', '9.500');
    type('Fake Lamb Chops (pieces)', '12');
    expect(screen.getByText('Loss 0.500 kg (5.0%) · expected 5.0%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Record breakdown' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          input_pieces: 2,
          lines: [{ output: 31, weight_kg: '9.500', pieces: 12 }],
        })
      )
    );
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('input_kg');
  });

  it('clears after it is recorded', async () => {
    renderForm();
    type('Template', '9');
    type('Input batch', '70');
    type('Fake Rump Steak (kg)', '3.000');
    fireEvent.click(screen.getByRole('button', { name: 'Record breakdown' }));
    await waitFor(() => expect(screen.getByLabelText('Template')).toHaveValue(''));
  });

  it('shows the server error it is given', () => {
    renderForm({ error: 'Loss is over the expected 3%: give a reason.' });
    expect(screen.getByRole('alert')).toHaveTextContent('give a reason');
  });

  it('changes the location through the page', () => {
    const { onLocationChange } = renderForm({ location: '' });
    type('Butchery', '5');
    expect(onLocationChange).toHaveBeenCalledWith(5);
  });
});

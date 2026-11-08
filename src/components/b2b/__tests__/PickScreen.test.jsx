import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PickScreen from '../PickScreen';

const RICE = {
  id: 31,
  product: 4,
  product_name: 'Fake Rice',
  quantity: 5,
  weight_kg: null,
  zone: 'ambient',
  picks: [],
  substitute_for: null,
  substitution: '',
};
const LAMB = {
  id: 32,
  product: 5,
  product_name: 'Fake Lamb',
  quantity: null,
  weight_kg: '2.000',
  zone: 'butchery',
  picks: [{ id: 90, batch_number: 'LAMB-1', expiration_date: '2026-11-20', quantity: 0, weight_kg: '1.000' }],
  substitute_for: null,
  substitution: '',
};
const CHOPS = {
  id: 33,
  product: 6,
  product_name: 'Fake Chops',
  quantity: 2,
  weight_kg: '1.000',
  zone: 'chilled',
  picks: [],
  substitute_for: null,
  substitution: '',
};
const ORDER = {
  id: 12,
  number_display: 'SO-000012',
  status: 'picking',
  customer_name: 'E2E Fake Bistro Ltd',
  lines: [RICE, LAMB, CHOPS],
};
const PRODUCTS = [
  { id: 4, name: 'Fake Rice', sold_by: 'each' },
  { id: 5, name: 'Fake Lamb', sold_by: 'weight', is_catch_weight: false },
  { id: 6, name: 'Fake Chops', sold_by: 'weight', is_catch_weight: true },
  { id: 7, name: 'Fake Thighs', sold_by: 'weight', is_catch_weight: false },
];
let handlers;

const renderScreen = (props = {}) =>
  render(<PickScreen order={ORDER} products={PRODUCTS} isStaff {...handlers} {...props} />);

const scan = (code) => {
  const box = screen.getByLabelText('Scan');
  fireEvent.change(box, { target: { value: code } });
  fireEvent.keyDown(box, { key: 'Enter' });
};

beforeEach(() => {
  handlers = {
    onScan: vi.fn(() => Promise.resolve()),
    onRemove: vi.fn(() => Promise.resolve()),
    onPropose: vi.fn(() => Promise.resolve()),
    onDecide: vi.fn(() => Promise.resolve()),
  };
});

describe('PickScreen', () => {
  it('groups lines by zone, ambient first, and keeps the scan box focused', () => {
    renderScreen();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Ambient', 'Chilled', 'Butchery']);
    expect(document.activeElement).toBe(screen.getByLabelText('Scan'));
    expect(screen.getByText('1.000 of 2.000 kg')).toBeTruthy();
  });

  it('sends a lot number with the amount for the selected line, then clears the box', async () => {
    renderScreen();
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    scan('RICE-1');
    await waitFor(() =>
      expect(handlers.onScan).toHaveBeenCalledWith({ line: 31, batch_number: 'RICE-1', quantity: 5 })
    );
    await waitFor(() => expect(screen.getByLabelText('Scan').value).toBe(''));
    expect(document.activeElement).toBe(screen.getByLabelText('Scan'));
  });

  it('sends a scale or GS1 label as a barcode for the line chosen', async () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /Fake Lamb/ }));
    scan('2100042012504');
    await waitFor(() => expect(handlers.onScan).toHaveBeenCalledWith({ line: 32, barcode: '2100042012504' }));
    scan('(01)05012345678900(3103)001250');
    await waitFor(() =>
      expect(handlers.onScan).toHaveBeenLastCalledWith({ line: 32, barcode: '(01)05012345678900(3103)001250' })
    );
  });

  it('lets the picker type an amount without the scan box taking the focus back', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /Fake Lamb/ }));
    const kg = screen.getByLabelText('Kg');
    kg.focus();
    fireEvent.change(kg, { target: { value: '2' } });
    fireEvent.change(kg, { target: { value: '2.6' } });
    expect(document.activeElement).toBe(kg);
  });

  it('clears the typed amount after a scan and when another line is chosen', async () => {
    renderScreen();
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    scan('RICE-1');
    await waitFor(() => expect(screen.getByLabelText('Quantity').value).toBe(''));
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Fake Chops/ }));
    expect(screen.getByLabelText('Pieces').value).toBe('');
  });

  it('sends raw GS1 digits as a label', async () => {
    renderScreen();
    scan('0105012345678900310300125010LOT7');
    await waitFor(() =>
      expect(handlers.onScan).toHaveBeenCalledWith({ line: 31, barcode: '0105012345678900310300125010LOT7' })
    );
  });

  it('asks for pieces and kg on a catch-weight line', async () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /Fake Chops/ }));
    fireEvent.change(screen.getByLabelText('Pieces'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Kg'), { target: { value: '1.040' } });
    scan('CHOP-1');
    await waitFor(() =>
      expect(handlers.onScan).toHaveBeenCalledWith({
        line: 33,
        batch_number: 'CHOP-1',
        quantity: 2,
        weight_kg: '1.040',
      })
    );
  });

  it('takes one scan at a time and shows a refusal', async () => {
    let finish;
    handlers.onScan.mockImplementation(() => new Promise((resolve, reject) => (finish = reject)));
    renderScreen({ error: null });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '1' } });
    scan('RICE-1');
    scan('RICE-1');
    expect(handlers.onScan).toHaveBeenCalledTimes(1);
    await act(async () => finish(new Error('refused')));
    expect(screen.getByLabelText('Scan').value).toBe('');
  });

  it('removes a pick', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Remove pick LAMB-1' }));
    expect(handlers.onRemove).toHaveBeenCalledWith(LAMB.picks[0]);
  });

  it('proposes a swap for the selected line; staff approve, others wait', async () => {
    const swap = {
      ...RICE,
      id: 40,
      product: 7,
      product_name: 'Fake Thighs',
      substitute_for: 31,
      substitution: 'proposed',
      quantity: null,
      weight_kg: '5.000',
    };
    const { rerender } = renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Propose a swap' }));
    fireEvent.change(screen.getByLabelText('Swap product'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Swap kg'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send the swap' }));
    await waitFor(() => expect(handlers.onPropose).toHaveBeenCalledWith({ line: 31, product: 7, weight_kg: '5' }));
    rerender(
      <PickScreen order={{ ...ORDER, lines: [...ORDER.lines, swap] }} products={PRODUCTS} isStaff {...handlers} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve swap Fake Thighs' }));
    expect(handlers.onDecide).toHaveBeenCalledWith(swap, true);
    rerender(
      <PickScreen
        order={{ ...ORDER, lines: [...ORDER.lines, swap] }}
        products={PRODUCTS}
        isStaff={false}
        {...handlers}
      />
    );
    expect(screen.queryByRole('button', { name: 'Approve swap Fake Thighs' })).toBeNull();
    expect(screen.getByText('Waiting for approval')).toBeTruthy();
  });
});

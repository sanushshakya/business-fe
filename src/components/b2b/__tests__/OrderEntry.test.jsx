import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrderEntry from '../OrderEntry';

const ADDRESS = {
  id: 11,
  label: 'Kitchen',
  line1: '1 Fake Street',
  town: 'Testtown',
  postcode: 'TT1 1TT',
  is_default: true,
};
const CUSTOMERS = [
  { id: 7, account_code: 'C-1', legal_name: 'E2E Fake Bistro Ltd', trading_name: 'Fake Bistro', addresses: [ADDRESS] },
  { id: 8, account_code: 'C-2', legal_name: 'E2E Fake Cafe Ltd', trading_name: '', addresses: [] },
];
const PRODUCTS = [
  { id: 4, name: 'Fake Rice 5kg', sold_by: 'each', plu: '', barcode: '5012345678900' },
  { id: 5, name: 'Fake Lamb Leg', sold_by: 'weight', is_catch_weight: false, plu: '42', barcode: '' },
  {
    id: 6,
    name: 'Fake Chicken',
    sold_by: 'weight',
    is_catch_weight: true,
    nominal_weight_kg: '1.500',
    plu: '',
    barcode: '',
  },
];

let onResolve;
let onSave;

const renderEntry = (props = {}) =>
  render(
    <OrderEntry
      customers={CUSTOMERS}
      products={PRODUCTS}
      onResolve={onResolve}
      onSave={onSave}
      today="2026-11-07"
      {...props}
    />
  );

const press = (element, key, extra = {}) => fireEvent.keyDown(element, { key, ...extra });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  onResolve = vi.fn().mockResolvedValue([]);
  onSave = vi.fn().mockResolvedValue({ id: 99 });
});
afterEach(() => vi.useRealTimers());

const chooseCustomer = () => {
  const customer = screen.getByLabelText('Customer');
  fireEvent.change(customer, { target: { value: 'c-1' } });
  press(customer, 'Enter');
  return screen.getByLabelText('Add product');
};

const addProduct = (text) => {
  const search = screen.getByLabelText('Add product');
  fireEvent.change(search, { target: { value: text } });
  press(search, 'Enter');
};

describe('OrderEntry', () => {
  it('runs from the keyboard: customer, product, quantity, back to search', async () => {
    renderEntry();
    const search = chooseCustomer();
    expect(screen.getByText('Fake Bistro')).toBeTruthy();
    expect(document.activeElement).toBe(search);
    addProduct('rice');
    const quantity = screen.getByLabelText('Quantity Fake Rice 5kg');
    expect(document.activeElement).toBe(quantity);
    fireEvent.change(quantity, { target: { value: '10' } });
    press(quantity, 'Enter');
    expect(document.activeElement).toBe(search);
    expect(search.value).toBe('');
    addProduct('42'); // a PLU
    expect(document.activeElement).toBe(screen.getByLabelText('Kg Fake Lamb Leg'));
    addProduct('5012345678900'); // a barcode already on the order: back to its line
    expect(document.activeElement).toBe(quantity);
  });

  it('shows the live trade price, no price, and a failed lookup', async () => {
    onResolve.mockResolvedValue([
      { product: 4, quantity: '10.000', unit_price: '1.9000', source: 'customer_list', price_list_name: 'Fake List' },
      { product: 5, quantity: '2.500', error: 'no_price' },
    ]);
    renderEntry();
    chooseCustomer();
    addProduct('rice');
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '10' } });
    addProduct('lamb');
    fireEvent.change(screen.getByLabelText('Kg Fake Lamb Leg'), { target: { value: '2.5' } });
    await act(async () => vi.advanceTimersByTime(400));
    await waitFor(() =>
      expect(onResolve).toHaveBeenLastCalledWith(7, '2026-11-08', [
        { product: 4, quantity: '10' },
        { product: 5, quantity: '2.5' },
      ])
    );
    expect(await screen.findByText('£1.9000 each')).toBeTruthy();
    expect(screen.getByText('Fake List')).toBeTruthy();
    expect(screen.getByText('No trade price')).toBeTruthy();
    onResolve.mockRejectedValue(new Error('offline'));
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '11' } });
    await act(async () => vi.advanceTimersByTime(400));
    expect(await screen.findAllByText('Price not checked')).toHaveLength(2);
  });

  it('prices catch-weight on the estimated kg', async () => {
    renderEntry();
    chooseCustomer();
    addProduct('chicken');
    fireEvent.change(screen.getByLabelText('Pieces Fake Chicken'), { target: { value: '3' } });
    await act(async () => vi.advanceTimersByTime(400));
    await waitFor(() =>
      expect(onResolve).toHaveBeenLastCalledWith(7, '2026-11-08', [{ product: 6, quantity: '4.500' }])
    );
  });

  it('leaves a catch-weight product with no nominal weight out of the lookup', async () => {
    renderEntry({
      products: [...PRODUCTS, { id: 7, name: 'Fake Duck', sold_by: 'weight', is_catch_weight: true, plu: '' }],
    });
    chooseCustomer();
    addProduct('duck');
    fireEvent.change(screen.getByLabelText('Pieces Fake Duck'), { target: { value: '2' } });
    addProduct('rice');
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '1' } });
    await act(async () => vi.advanceTimersByTime(400));
    await waitFor(() => expect(onResolve).toHaveBeenLastCalledWith(7, '2026-11-08', [{ product: 4, quantity: '1' }]));
    expect(screen.getByText('No nominal weight')).toBeTruthy();
  });

  it('adds a suggestion by clicking it, and never shows an old price for a new amount', async () => {
    onResolve.mockResolvedValue([{ product: 4, quantity: '1', unit_price: '2.0000', source: 'base' }]);
    renderEntry();
    chooseCustomer();
    fireEvent.change(screen.getByLabelText('Add product'), { target: { value: 'fake' } });
    fireEvent.click(screen.getByRole('button', { name: /Fake Rice 5kg/ }));
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '1' } });
    await act(async () => vi.advanceTimersByTime(400));
    expect(await screen.findByText('£2.0000 each')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '50' } });
    expect(screen.queryByText('£2.0000 each')).toBeNull(); // cleared until the new answer
  });

  it('checks units and kg as typed', () => {
    renderEntry();
    chooseCustomer();
    addProduct('rice');
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '1.5' } });
    expect(screen.getByText('Whole units')).toBeTruthy();
    addProduct('lamb');
    fireEvent.change(screen.getByLabelText('Kg Fake Lamb Leg'), { target: { value: '2,5' } });
    expect(screen.getByText('Kg to 3 decimal places')).toBeTruthy();
    press(screen.getByLabelText('Add product'), 's', { ctrlKey: true });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a draft with Ctrl+S and confirms with Ctrl+Enter, once', async () => {
    let finish;
    onSave.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    renderEntry();
    chooseCustomer();
    addProduct('rice');
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '10' } });
    addProduct('lamb');
    fireEvent.change(screen.getByLabelText('Kg Fake Lamb Leg'), { target: { value: '2.500' } });
    fireEvent.change(screen.getByLabelText('Your reference'), { target: { value: 'PO-77' } });
    const search = screen.getByLabelText('Add product');
    press(search, 'Enter', { ctrlKey: true });
    press(search, 'Enter', { ctrlKey: true }); // while the first is in flight
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      {
        customer: 7,
        delivery_date: '2026-11-08',
        address: 11,
        customer_ref: 'PO-77',
        note: '',
        lines: [
          { product: 4, quantity: 10 },
          { product: 5, weight_kg: '2.500' },
        ],
      },
      { confirm: true }
    );
    await act(async () => finish({ id: 99 }));
    press(search, 's', { ctrlKey: true });
    expect(onSave).toHaveBeenLastCalledWith(expect.any(Object), { confirm: false });
  });

  it('asks for an address when the customer has none', () => {
    renderEntry();
    const customer = screen.getByLabelText('Customer');
    fireEvent.change(customer, { target: { value: 'c-2' } });
    press(customer, 'Enter');
    expect(screen.getByText(/has no delivery address/)).toBeTruthy();
    addProduct('rice');
    fireEvent.change(screen.getByLabelText('Quantity Fake Rice 5kg'), { target: { value: '1' } });
    press(screen.getByLabelText('Add product'), 's', { ctrlKey: true });
    expect(onSave).not.toHaveBeenCalled();
  });
});

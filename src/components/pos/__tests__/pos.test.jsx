import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Cart from '../Cart';
import CashUpForm from '../CashUpForm';
import OpenTillForm from '../OpenTillForm';
import PaymentPanel from '../PaymentPanel';
import ProductPicker from '../ProductPicker';
import Receipt from '../Receipt';

const products = [
  { id: 1, name: 'Basmati Rice 5kg', price: '12.50', stock_quantity: 5, commodity_code: '1006' },
  { id: 2, name: 'Medjool Dates 1kg', price: '8.99', stock_quantity: 0 },
  { id: 3, name: 'Ghee 500g', price: '6.75', stock_quantity: 9 },
];

describe('ProductPicker', () => {
  it('adds a product when tapped and disables the ones out of stock', () => {
    const onAdd = vi.fn();
    render(<ProductPicker products={products} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /Basmati Rice/ }));
    expect(onAdd).toHaveBeenCalledWith(products[0]);
    expect(screen.getByRole('button', { name: /Medjool Dates/ })).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('filters by name or commodity code and Enter adds the first one in stock', () => {
    const onAdd = vi.fn();
    render(<ProductPicker products={products} onAdd={onAdd} />);
    const search = screen.getByLabelText('Search products');
    fireEvent.change(search, { target: { value: 'ghee' } });
    expect(screen.queryByText('Basmati Rice 5kg')).not.toBeInTheDocument();
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith(products[2]);
    expect(search).toHaveValue('');

    fireEvent.change(search, { target: { value: '1006' } });
    expect(screen.getByText('Basmati Rice 5kg')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'dates' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledTimes(1); // the only match is out of stock
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('No products match.')).toBeInTheDocument();
  });
});

describe('Cart', () => {
  const lines = [{ product: 1, name: 'Rice', unitCents: 1250, quantity: 2, max: 2 }];

  it('shows lines, the total and an empty state', () => {
    const { rerender } = render(<Cart lines={lines} totalCents={2500} onQuantity={() => {}} onRemove={() => {}} />);
    expect(screen.getByText('£25.00', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('£25.00');
    rerender(<Cart lines={[]} totalCents={0} onQuantity={() => {}} onRemove={() => {}} />);
    expect(screen.getByText(/basket is empty/i)).toBeInTheDocument();
  });

  it('changes quantity and removes, and stops at the stock limit', () => {
    const onQuantity = vi.fn();
    const onRemove = vi.fn();
    render(<Cart lines={lines} totalCents={2500} onQuantity={onQuantity} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText('Decrease Rice'));
    expect(onQuantity).toHaveBeenCalledWith(1, 1);
    expect(screen.getByLabelText('Increase Rice')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Remove Rice'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});

describe('PaymentPanel', () => {
  it('works out change and charges cash with the amount tendered', () => {
    const onCharge = vi.fn();
    render(<PaymentPanel totalCents={3175} onCharge={onCharge} />);
    const charge = screen.getByRole('button', { name: 'Charge £31.75' });
    expect(charge).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Cash tendered'), { target: { value: '20' } });
    expect(screen.getByTestId('change')).toHaveTextContent('Short by £11.75');
    expect(charge).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '£50.00' }));
    expect(screen.getByTestId('change')).toHaveTextContent('Change due £18.25');
    fireEvent.click(charge);
    expect(onCharge).toHaveBeenCalledWith({ payment_method: 'cash', amount_tendered: '50.00' });
  });

  it('offers the exact amount', () => {
    const onCharge = vi.fn();
    render(<PaymentPanel totalCents={3175} onCharge={onCharge} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exact' }));
    expect(screen.getByLabelText('Cash tendered')).toHaveValue('31.75');
    fireEvent.click(screen.getByRole('button', { name: 'Charge £31.75' }));
    expect(onCharge).toHaveBeenCalledWith({ payment_method: 'cash', amount_tendered: '31.75' });
  });

  it('charges a card without asking for cash', () => {
    const onCharge = vi.fn();
    render(<PaymentPanel totalCents={500} onCharge={onCharge} />);
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    expect(screen.queryByLabelText('Cash tendered')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Charge £5.00' }));
    expect(onCharge).toHaveBeenCalledWith({ payment_method: 'card' });
  });

  it('cannot charge when disabled, submitting or empty', () => {
    const { rerender } = render(<PaymentPanel totalCents={500} onCharge={() => {}} disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    expect(screen.getByRole('button', { name: 'Charge £5.00' })).toBeDisabled();
    rerender(<PaymentPanel totalCents={500} onCharge={() => {}} submitting />);
    expect(screen.getByRole('button', { name: 'Charging…' })).toBeDisabled();
    rerender(<PaymentPanel totalCents={0} onCharge={() => {}} />);
    expect(screen.getByRole('button', { name: 'Charge £0.00' })).toBeDisabled();
  });
});

describe('Receipt', () => {
  const sale = {
    receipt_number: 'S-000007',
    created_at: '2026-10-14T15:26:45Z',
    branch_name: 'High Street',
    till_number: 1,
    cashier_email: 'a@b.test',
    payment_method: 'cash',
    total: '31.75',
    amount_tendered: '50.00',
    change_due: '18.25',
    status: 'completed',
    items: [{ id: 1, product: 1, product_name: 'Rice', quantity: 2, unit_price: '12.50', line_total: '25.00' }],
  };

  it('prints the lines, totals and change', () => {
    const onPrint = vi.fn();
    render(<Receipt sale={sale} onPrint={onPrint} />);
    expect(screen.getByText('Receipt S-000007')).toBeInTheDocument();
    expect(screen.getByText(/2 × Rice/)).toBeInTheDocument();
    expect(screen.getByText('£31.75')).toBeInTheDocument();
    expect(screen.getByText('£18.25')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Print receipt' }));
    expect(onPrint).toHaveBeenCalled();
  });

  it('marks a voided sale with its reason and no change line for card', () => {
    render(<Receipt sale={{ ...sale, status: 'voided', void_reason: 'Wrong item', payment_method: 'card' }} />);
    expect(screen.getByText('Voided')).toBeInTheDocument();
    expect(screen.getByText('Void reason: Wrong item')).toBeInTheDocument();
    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });
});

describe('CashUpForm', () => {
  const session = {
    opening_float: '50.00',
    summary: { expected_cash: '81.75', cash_total: '31.75', card_total: '0.00', sales_count: 1, voided_count: 0 },
  };

  it('previews the variance and submits the count', () => {
    const onSubmit = vi.fn();
    render(<CashUpForm session={session} onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'Close till' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Counted cash'), { target: { value: '80.75' } });
    expect(screen.getByTestId('variance')).toHaveTextContent('Short by £1.00');
    fireEvent.change(screen.getByLabelText('Counted cash'), { target: { value: '82' } });
    expect(screen.getByTestId('variance')).toHaveTextContent('Over by £0.25');
    fireEvent.change(screen.getByLabelText('Counted cash'), { target: { value: '81.75' } });
    expect(screen.getByTestId('variance')).toHaveTextContent('Drawer balances');

    fireEvent.change(screen.getByLabelText('Note (optional)'), { target: { value: ' ok ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close till' }));
    expect(onSubmit).toHaveBeenCalledWith({ counted_cash: '81.75', note: 'ok' });
  });
});

describe('OpenTillForm', () => {
  it('opens the chosen till with the float', () => {
    const onOpen = vi.fn();
    const onTillChange = vi.fn();
    const tills = [{ id: 3, label: 'High Street – Till 1' }];
    const { rerender } = render(<OpenTillForm tills={tills} till="" onTillChange={onTillChange} onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: 'Open till' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Till'), { target: { value: '3' } });
    expect(onTillChange).toHaveBeenCalledWith('3');

    rerender(<OpenTillForm tills={tills} till="3" onTillChange={onTillChange} onOpen={onOpen} />);
    fireEvent.change(screen.getByLabelText('Opening float'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open till' }));
    expect(onOpen).toHaveBeenCalledWith({ till: 3, opening_float: '100.00' });
  });
});

describe('scale labels at the till', () => {
  it('ProductPicker sends a scanned code to onScan and still searches names', () => {
    const onAdd = vi.fn();
    const onScan = vi.fn();
    render(<ProductPicker products={products} onAdd={onAdd} onScan={onScan} />);
    const search = screen.getByLabelText('Search products');
    for (const code of ['2100421005129', ']e0010501234567890', '(01)05012345678900']) {
      fireEvent.change(search, { target: { value: code } });
      fireEvent.keyDown(search, { key: 'Enter' });
      expect(onScan).toHaveBeenLastCalledWith(code);
      expect(search).toHaveValue('');
    }
    fireEvent.change(search, { target: { value: 'ghee' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith(products[2]);
    expect(onScan).toHaveBeenCalledTimes(3);
  });

  it('Cart shows a label line as weight × £/kg with no quantity buttons', () => {
    const onRemove = vi.fn();
    const lines = [
      {
        key: 'label-1',
        product: 4,
        name: 'Mince',
        barcode: '2100421005129',
        weightKg: '0.512',
        pricePerKg: '8.9900',
        labelPrice: null,
        unitCents: 460,
        quantity: 1,
        max: 1,
      },
      {
        key: 'label-2',
        product: 7,
        name: 'Cake',
        barcode: '2000077001501',
        weightKg: null,
        labelPrice: '1.50',
        unitCents: 150,
        quantity: 1,
        max: 1,
      },
    ];
    render(<Cart lines={lines} totalCents={610} onQuantity={vi.fn()} onRemove={onRemove} />);
    expect(screen.getByText('0.512 kg × £8.99/kg')).toBeInTheDocument();
    expect(screen.getByText('Label price')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Increase Mince' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove Mince' })[0]);
    expect(onRemove).toHaveBeenCalledWith('label-1');
    cleanup();
    render(<Cart lines={[{ ...lines[1], key: 'label-3', labelPrice: null, unitCents: 200 }]} totalCents={200} />);
    expect(screen.getByText('£2.00 each')).toBeInTheDocument(); // a GTIN-only label is charged the product price
  });

  it('Receipt prints weight × £/kg for a weighed item', () => {
    const sale = {
      id: 1,
      receipt_number: 'S-000001',
      created_at: '2026-11-02T09:05:00Z',
      branch_name: 'High Street',
      till_number: 1,
      cashier_email: 'a@b.test',
      payment_method: 'card',
      total: '4.60',
      amount_tendered: '4.60',
      change_due: '0.00',
      status: 'completed',
      vat_recorded: true,
      vat_summary: [],
      items: [
        {
          id: 1,
          product: 4,
          product_name: 'Mince',
          quantity: 1,
          unit_price: '8.99',
          weight_kg: '0.512',
          price_per_kg: '8.9950',
          line_total: '4.60',
          vat_code: 'zero',
          label_price: null,
        },
      ],
    };
    render(<Receipt sale={sale} onPrint={vi.fn()} />);
    expect(screen.getByText('0.512 kg × £8.995/kg')).toBeInTheDocument();
    expect(screen.getByText(/Mince/)).toBeInTheDocument();
  });
});

describe('typed weights at the till (G19)', () => {
  const mince = { id: 4, name: 'Mince', price: '0.00', stock_quantity: 0, sold_by: 'weight', price_per_kg: '8.9900' };

  it('ProductPicker shows a weighed product by £/kg and lets it be tapped', () => {
    const onAdd = vi.fn();
    render(<ProductPicker products={[mince]} onAdd={onAdd} />);
    const button = screen.getByRole('button', { name: /Mince/ });
    expect(button).toBeEnabled();
    expect(screen.getByText('£8.99/kg')).toBeInTheDocument();
    expect(screen.getByText('Sold by weight')).toBeInTheDocument();
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(onAdd).toHaveBeenCalledWith(mince);
    const search = screen.getByLabelText('Search products');
    fireEvent.change(search, { target: { value: 'min' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledTimes(2);
  });

  it('ProductPicker will not offer a weighed product with no price per kg', () => {
    const onAdd = vi.fn();
    render(<ProductPicker products={[{ ...mince, price_per_kg: null }]} onAdd={onAdd} />);
    expect(screen.getByRole('button', { name: /Mince/ })).toBeDisabled();
    expect(screen.getByText('No price per kg')).toBeInTheDocument();
    const search = screen.getByLabelText('Search products');
    fireEvent.change(search, { target: { value: 'min' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('Cart marks a typed weight as manual, with its pieces', () => {
    const line = {
      key: 'weight-1',
      product: 4,
      name: 'Mince',
      weightKg: '0.512',
      pricePerKg: '8.9900',
      labelPrice: null,
      manual: true,
      pieces: null,
      unitCents: 460,
      quantity: 1,
      max: 1,
    };
    render(<Cart lines={[line, { ...line, key: 'weight-2', pieces: 2 }]} totalCents={920} />);
    expect(screen.getByText('0.512 kg × £8.99/kg · manual weight')).toBeInTheDocument();
    expect(screen.getByText('2 pieces, 0.512 kg × £8.99/kg · manual weight')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Increase Mince' })).not.toBeInTheDocument();
  });
});

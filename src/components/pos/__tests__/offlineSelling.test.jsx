import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cartReducer } from '../../../hooks/useCart';
import OfflineQueue from '../OfflineQueue';
import PaymentPanel from '../PaymentPanel';
import ProductPicker from '../ProductPicker';
import Receipt from '../Receipt';
import WeightEntry from '../WeightEntry';

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('PaymentPanel offline (G27)', () => {
  it("asks for the card terminal's auth code and sends it", () => {
    const onCharge = vi.fn();
    render(<PaymentPanel totalCents={250} onCharge={onCharge} offline />);
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    expect(screen.getByRole('button', { name: 'Charge £2.50' })).toBeDisabled();
    type('Terminal auth code', ' a1b2c3 ');
    fireEvent.click(screen.getByRole('button', { name: 'Charge £2.50' }));
    expect(onCharge).toHaveBeenCalledWith({ payment_method: 'card', card_auth_code: 'A1B2C3' });
  });

  it('refuses an auth code that is not 4–12 letters or digits', () => {
    render(<PaymentPanel totalCents={250} onCharge={vi.fn()} offline />);
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    type('Terminal auth code', 'ab-1');
    expect(screen.getByRole('button', { name: 'Charge £2.50' })).toBeDisabled();
  });

  it('does not ask for it online', () => {
    render(<PaymentPanel totalCents={250} onCharge={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Card' }));
    expect(screen.queryByLabelText('Terminal auth code')).toBeNull();
  });
});

describe('ProductPicker offline (G27)', () => {
  const out = { id: 1, name: 'Fake Rice', price: '2.50', stock_quantity: 0 };
  it('lets out-of-stock products be added when stock is not checked', () => {
    const onAdd = vi.fn();
    render(<ProductPicker products={[out]} onAdd={onAdd} allowOutOfStock />);
    fireEvent.click(screen.getByRole('button', { name: /Fake Rice/ }));
    expect(onAdd).toHaveBeenCalledWith(out);
    expect(screen.getByText('Stock not checked offline')).toBeInTheDocument();
  });

  it('keeps them out online', () => {
    render(<ProductPicker products={[out]} onAdd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Fake Rice/ })).toBeDisabled();
  });

  it('the basket takes it without a stock limit', () => {
    const lines = cartReducer([], { type: 'add', product: out, unlimited: true });
    expect(lines).toEqual([expect.objectContaining({ product: 1, quantity: 1 })]);
    expect(cartReducer(lines, { type: 'setQuantity', product: 1, quantity: 30 })[0].quantity).toBe(30);
  });
});

describe('WeightEntry limit (G27)', () => {
  it("refuses a typed weight over the company's limit", () => {
    const onAdd = vi.fn();
    render(
      <WeightEntry
        product={{ id: 4, name: 'Fake Mince', price_per_kg: '8.9900' }}
        onAdd={onAdd}
        onCancel={vi.fn()}
        maxKg="12.5"
      />
    );
    type('Weight (kg)', '12.6');
    fireEvent.click(screen.getByRole('button', { name: 'Add Fake Mince' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Over the 12.5 kg limit for a typed weight');
    expect(onAdd).not.toHaveBeenCalled();
    type('Weight (kg)', '12.5');
    fireEvent.click(screen.getByRole('button', { name: 'Add Fake Mince' }));
    expect(onAdd).toHaveBeenCalledWith({ weightKg: '12.500', pieces: null });
  });
});

const offlineSale = {
  offline: true,
  receipt_number: 'HS-T02-QK-000007',
  created_at: '2026-11-04T12:00:00.000Z',
  branch_name: 'Fake High Street',
  till_number: 2,
  status: 'completed',
  payment_method: 'card',
  card_auth_code: 'A1B2C3',
  total: '2.50',
  amount_tendered: '2.50',
  change_due: '0.00',
  items: [
    {
      id: 'offline-1',
      product_name: 'Fake Rice',
      quantity: 1,
      unit_price: '2.50',
      line_total: '2.50',
      vat_code: 'zero',
    },
  ],
  vat_summary: [{ vat_code: 'zero', rate: '0.00', net: '2.50', vat: '0.00', gross: '2.50' }],
  vat_recorded: true,
};

describe('Receipt of an offline sale (G27)', () => {
  it('says it is an offline sale and shows the card auth code', () => {
    render(<Receipt sale={offlineSale} onPrint={vi.fn()} />);
    expect(screen.getByText('Receipt HS-T02-QK-000007')).toBeInTheDocument();
    expect(
      screen.getByText(/Offline sale: the receipt number will change when the till reconnects/)
    ).toBeInTheDocument();
    expect(screen.getByText('Auth code A1B2C3')).toBeInTheDocument();
  });
});

describe('OfflineQueue (G27)', () => {
  const queued = [
    {
      client_ref: 'r2',
      offline_number: 'HS-T02-QK-000002',
      created_at: '2026-11-04T12:05:00Z',
      status: 'queued',
      receipt: { ...offlineSale, total: '4.00' },
    },
    {
      client_ref: 'r1',
      offline_number: 'HS-T02-QK-000001',
      created_at: '2026-11-04T12:00:00Z',
      status: 'voided',
      void_reason: 'Fake',
      receipt: offlineSale,
    },
  ];

  it('lists sales waiting to be sent, with reprint and a void that needs a reason', () => {
    const onVoid = vi.fn();
    const onReprint = vi.fn();
    render(<OfflineQueue sales={queued} onVoid={onVoid} onReprint={onReprint} />);
    expect(screen.getByText('Waiting to send (2)')).toBeInTheDocument();
    const first = screen.getByText('HS-T02-QK-000002').closest('li');
    expect(within(first).getByText('£4.00')).toBeInTheDocument();
    fireEvent.click(within(first).getByRole('button', { name: 'Reprint' }));
    expect(onReprint).toHaveBeenCalledWith(queued[0]);
    fireEvent.click(within(first).getByRole('button', { name: 'Void' }));
    const confirm = within(first).getByRole('button', { name: 'Confirm void' });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(first).getByLabelText('Why void HS-T02-QK-000002?'), {
      target: { value: 'Fake: wrong item' },
    });
    fireEvent.click(confirm);
    expect(onVoid).toHaveBeenCalledWith(queued[0], 'Fake: wrong item');
    const second = screen.getByText('HS-T02-QK-000001').closest('li');
    expect(within(second).getByText('Voided')).toBeInTheDocument();
    expect(within(second).queryByRole('button', { name: 'Void' })).toBeNull();
  });

  it('shows nothing when the queue is empty', () => {
    const { container } = render(<OfflineQueue sales={[]} onVoid={vi.fn()} onReprint={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

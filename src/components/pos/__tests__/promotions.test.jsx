import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Cart from '../Cart';
import Receipt from '../Receipt';
import { basketPromotions } from '../../../utils/promotions';
import { offlineReceipt } from '../../../utils/offlineReceipt';

// G58: the basket shows each promotion and the total after it; receipts print them and "You saved".
const PRODUCTS = [
  { id: 1, name: 'Fake Wrap', vat_code: 'zero', category: null },
  { id: 3, name: 'Fake Crisps', vat_code: 'standard', category: null },
  { id: 4, name: 'Fake Cola', vat_code: 'standard', category: 9 },
];
const RATES = [
  { code: 'zero', rate: '0.00', valid_from: '1973-04-01' },
  { code: 'standard', rate: '20.00', valid_from: '2011-01-04' },
];
const MEAL = {
  id: 2,
  name: 'Meal deal',
  kind: 'meal_deal',
  priority: 0,
  stacks: false,
  deal_price: '3.50',
  products: [],
  categories: [],
  groups: [[1], [3], [4]],
};
const lines = [
  { product: 1, name: 'Fake Wrap', unitCents: 250, quantity: 1, max: 9 },
  { product: 3, name: 'Fake Crisps', unitCents: 100, quantity: 1, max: 9 },
  { product: 4, name: 'Fake Cola', unitCents: 120, quantity: 1, max: 9 },
];

describe('basketPromotions', () => {
  it('keys discounts by basket line and adds up the saving', () => {
    expect(basketPromotions(lines, PRODUCTS, [MEAL])).toMatchObject({
      discounts: { 1: 64, 3: 25, 4: 31 },
      savingCents: 120,
    });
    expect(basketPromotions(lines, PRODUCTS, []).savingCents).toBe(0);
  });

  it('never discounts a scanned label and treats a typed weight as one weighed line', () => {
    const percent = {
      id: 5,
      name: '10% off',
      kind: 'category_percent',
      priority: 0,
      stacks: false,
      percent: '10.00',
      products: [],
      categories: [9],
      groups: [],
    };
    const scanned = [
      { key: 'label-1', product: 4, barcode: '2100421005129', weightKg: null, unitCents: 120, quantity: 1 },
      { key: 'weight-2', product: 4, weightKg: '0.500', manual: true, unitCents: 325, quantity: 1 },
    ];
    expect(basketPromotions(scanned, PRODUCTS, [percent]).discounts).toEqual({ 'weight-2': 33 });
  });
});

describe('Cart with promotions', () => {
  it('shows the line discounts, each promotion and the total after them', () => {
    const basket = basketPromotions(lines, PRODUCTS, [MEAL]);
    render(
      <Cart
        lines={lines}
        totalCents={470 - basket.savingCents}
        discounts={basket.discounts}
        applied={basket.applied}
        onQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('−£0.64')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Promotions' })).getByText('Meal deal')).toBeInTheDocument();
    expect(screen.getByText('−£1.20')).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('£3.50');
  });
});

describe('receipts with promotions', () => {
  it('offline: discounts come off each line before VAT, by rate', () => {
    const receipt = offlineReceipt({
      lines,
      products: PRODUCTS,
      vatRates: RATES,
      payment: { payment_method: 'cash', amount_tendered: '5.00' },
      number: 'HS-T01-ABC-000001',
      createdAt: '2026-06-10T10:00:00Z',
      ukDate: '2026-06-10',
      promotions: [MEAL],
    });
    expect(receipt.items.map((i) => [i.line_total, i.discount, i.vat_amount])).toEqual([
      ['1.86', '0.64', '0.00'],
      ['0.75', '0.25', '0.13'],
      ['0.89', '0.31', '0.15'],
    ]);
    expect([receipt.total, receipt.change_due, receipt.total_saving]).toEqual(['3.50', '1.50', '1.20']);
    expect(receipt.vat_summary.map((r) => [r.vat_code, r.net, r.vat, r.gross])).toEqual([
      ['zero', '1.86', '0.00', '1.86'],
      ['standard', '1.36', '0.28', '1.64'],
    ]);
    expect(receipt.promotions).toEqual([
      { promotion: 2, name: 'Meal deal', kind: 'meal_deal', times: 1, saving: '1.20' },
    ]);
  });

  it('prints each promotion and what the customer saved', () => {
    const sale = offlineReceipt({
      lines,
      products: PRODUCTS,
      vatRates: RATES,
      payment: { payment_method: 'card', card_auth_code: 'AUTH01' },
      number: 'HS-T01-ABC-000002',
      createdAt: '2026-06-10T10:00:00Z',
      ukDate: '2026-06-10',
      promotions: [MEAL],
    });
    const { container } = render(<Receipt sale={sale} onPrint={vi.fn()} />);
    const printed = within(container.querySelector('.print-area'));
    expect(printed.getByText('£2.50 − £0.64')).toBeInTheDocument();
    expect(printed.getByText('Meal deal')).toBeInTheDocument();
    expect(printed.getByText('You saved £1.20')).toBeInTheDocument();
  });

  it('prints nothing extra without promotions', () => {
    const sale = offlineReceipt({
      lines,
      products: PRODUCTS,
      vatRates: RATES,
      payment: { payment_method: 'card', card_auth_code: 'AUTH01' },
      number: 'X',
      createdAt: '2026-06-10T10:00:00Z',
      ukDate: '2026-06-10',
    });
    render(<Receipt sale={sale} onPrint={vi.fn()} />);
    expect(screen.queryByText(/You saved/)).not.toBeInTheDocument();
  });
});

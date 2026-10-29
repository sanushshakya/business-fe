import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CashUpForm from '../CashUpForm';
import Receipt from '../Receipt';

const sale = {
  receipt_number: 'S-000042',
  created_at: '2026-10-29T10:00:00Z',
  branch_name: 'High Street',
  till_number: 1,
  cashier_email: 'till@example.com',
  payment_method: 'card',
  total: '5.95',
  amount_tendered: '5.95',
  change_due: '0.00',
  status: 'completed',
  items: [
    {
      id: 1,
      product_name: 'Fake Bread',
      quantity: 2,
      unit_price: '1.10',
      line_total: '2.20',
      vat_code: 'zero',
      vat_rate: '0.00',
      net_amount: '2.20',
      vat_amount: '0.00',
    },
    {
      id: 2,
      product_name: 'Fake Cola',
      quantity: 3,
      unit_price: '1.25',
      line_total: '3.75',
      vat_code: 'standard',
      vat_rate: '20.00',
      net_amount: '3.12',
      vat_amount: '0.63',
    },
  ],
  vat_recorded: true,
  vat_summary: [
    { vat_code: 'zero', rate: '0.00', net: '2.20', vat: '0.00', gross: '2.20' },
    { vat_code: 'standard', rate: '20.00', net: '3.12', vat: '0.63', gross: '3.75' },
  ],
};

const printArea = (container) => container.querySelector('.print-area');

describe('Receipt VAT', () => {
  it('prints the VAT summary by rate inside the printed area', () => {
    const { container } = render(<Receipt sale={sale} onPrint={vi.fn()} />);
    const table = within(printArea(container)).getByRole('table', { name: 'VAT summary' });
    const rows = within(table)
      .getAllByRole('row')
      .map((row) => row.textContent);
    expect(rows).toEqual([
      'VAT rateNetVATGross',
      'Z 0%£2.20£0.00£2.20',
      'S 20%£3.12£0.63£3.75',
      'Total£5.32£0.63£5.95',
    ]);
  });

  it('marks each line with its VAT letter', () => {
    const { container } = render(<Receipt sale={sale} onPrint={vi.fn()} />);
    expect(within(printArea(container)).getByText('Fake Cola', { exact: false }).closest('tr')).toHaveTextContent('S');
    expect(within(printArea(container)).getByText('Fake Bread', { exact: false }).closest('tr')).toHaveTextContent('Z');
  });

  it('says VAT was not recorded for a sale from before VAT', () => {
    const old = {
      ...sale,
      vat_recorded: false,
      vat_summary: [],
      items: sale.items.map((i) => ({ ...i, vat_code: '', vat_rate: null, net_amount: null, vat_amount: null })),
    };
    const { container } = render(<Receipt sale={old} onPrint={vi.fn()} />);
    expect(within(printArea(container)).getByText('VAT not recorded for this sale.')).toBeInTheDocument();
    expect(within(printArea(container)).queryByRole('table', { name: 'VAT summary' })).not.toBeInTheDocument();
  });
});

describe('CashUpForm VAT', () => {
  const session = {
    opening_float: '50.00',
    summary: {
      expected_cash: '50.00',
      cash_total: '0.00',
      card_total: '5.95',
      sales_count: 1,
      voided_count: 0,
      vat_by_rate: sale.vat_summary,
      vat_not_recorded_total: '0.00',
    },
  };

  it('shows the session VAT by rate', () => {
    render(<CashUpForm session={session} onSubmit={vi.fn()} />);
    const rows = within(screen.getByRole('table', { name: 'VAT summary' }))
      .getAllByRole('row')
      .map((r) => r.textContent);
    expect(rows[2]).toBe('S 20%£3.12£0.63£3.75');
  });

  it('lists takings without VAT data separately', () => {
    render(
      <CashUpForm
        session={{ ...session, summary: { ...session.summary, vat_not_recorded_total: '2.50' } }}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Sales without VAT recorded: £2.50')).toBeInTheDocument();
  });
});

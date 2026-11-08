import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CustomerForm from '../CustomerForm';
import DocumentList from '../DocumentList';
import GroupPanel from '../GroupPanel';
import PriceListForm from '../PriceListForm';
import ReturnForm from '../ReturnForm';

describe('CustomerForm', () => {
  it('sends one default address and one primary contact, and keeps values when the save fails', async () => {
    const onSubmit = vi.fn();
    render(<CustomerForm groups={[]} onSubmit={onSubmit} error="Not a UK VAT number." />);
    fireEvent.change(screen.getByLabelText('Account code'), { target: { value: 'c-9' } });
    fireEvent.change(screen.getByLabelText('Legal name'), { target: { value: 'E2E Fake Nine Ltd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add address' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add address' }));
    fireEvent.click(screen.getByLabelText('Address 2 default'));
    fireEvent.click(screen.getByRole('button', { name: 'Save customer' }));
    expect(onSubmit.mock.calls[0][0].addresses.map((a) => a.is_default)).toEqual([false, true]);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ group: null, payment_terms_days: 30, contacts: [] });
    expect(screen.getByRole('alert').textContent).toBe('Not a UK VAT number.');
    expect(screen.getByLabelText('Account code').value).toBe('c-9');
  });
});

describe('PriceListForm', () => {
  it('labels prices per kg for weighed products and sends blank dates as null', () => {
    const onSubmit = vi.fn();
    render(<PriceListForm products={[{ id: 5, name: 'Fake Lamb', sold_by: 'weight' }]} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Fake' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }));
    fireEvent.change(screen.getByLabelText('Entry 1 product'), { target: { value: '5' } });
    expect(screen.getByText('£ per kg')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Entry 1 price'), { target: { value: ' 8.8 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save price list' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      valid_from: null,
      valid_to: null,
      entries: [{ product: 5, min_quantity: '1', unit_price: '8.8' }],
    });
  });
});

describe('GroupPanel', () => {
  it('asks before deleting a group', async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    render(
      <GroupPanel groups={[{ id: 3, name: 'Fake Cafes' }]} onAdd={vi.fn()} onRename={vi.fn()} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete group Fake Cafes' }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.queryByRole('button', { name: 'Yes, delete Fake Cafes' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete group Fake Cafes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete Fake Cafes' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith({ id: 3, name: 'Fake Cafes' }));
  });
});

describe('ReturnForm', () => {
  const lines = [
    { id: 1, product_name: 'Fake Lamb', quantity: null, picked_weight_kg: '2.000' },
    { id: 2, product_name: 'Fake Chops', quantity: 2, picked_quantity: 2, picked_weight_kg: '1.040' },
  ];

  it('sends kg for loose lines and pieces with kg for catch-weight ones', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(
      <MemoryRouter>
        <ReturnForm lines={lines} onSubmit={onSubmit} onCredit={vi.fn()} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('Return kg Fake Lamb'), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText('Return Fake Chops'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record return' }));
    expect(await screen.findByText('Fake Chops: give whole pieces and kg (3 dp).')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Return kg Fake Chops'), { target: { value: '0.520' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record return' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        lines: [
          { line: 1, weight_kg: '0.5', reason: 'not_wanted' },
          { line: 2, quantity: 1, weight_kg: '0.520', reason: 'not_wanted' },
        ],
      })
    );
  });

  it('links a credited return to the credit notes', () => {
    render(
      <MemoryRouter>
        <ReturnForm
          lines={[]}
          returns={[{ id: 7, number_display: 'RET-000001', kind: 'door', credit_note: 3 }]}
          onSubmit={vi.fn()}
          onCredit={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /Credit note/ }).getAttribute('href')).toBe('/dashboard/b2b/credit-notes');
  });
});

describe('DocumentList', () => {
  it('offers draft actions only on drafts and resend only on issued ones', () => {
    const handlers = { onIssue: vi.fn(), onDelete: vi.fn(), onResend: vi.fn(), onPdf: vi.fn() };
    render(
      <DocumentList
        kind="credit"
        documents={[
          { id: 1, status: 'draft', number_display: 'Draft #1', gross_total: '3.00', invoice_number: 'INV-000001' },
          { id: 2, status: 'issued', number_display: 'CN-000001', gross_total: '4.00', email_status: 'sent' },
        ]}
        {...handlers}
      />
    );
    expect(screen.queryByRole('button', { name: 'Resend Draft #1' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Issue CN-000001' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rebuild Draft #1' })).toBeNull(); // no rebuild for credit notes
    fireEvent.click(screen.getByRole('button', { name: 'Resend CN-000001' }));
    expect(handlers.onResend).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });
});

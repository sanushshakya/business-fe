import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PriceDecisions from '../PriceDecisions';

const base = {
  product: 1,
  old_price: '1.99',
  new_price: '1.79',
  reason: '',
  source: 'manual',
  changed_at: '2026-10-19T09:00:00Z',
  is_approved: false,
  is_rejected: false,
  decided_by_name: null,
  decided_at: null,
  decision_note: '',
};
const approved = {
  ...base,
  id: 1,
  is_approved: true,
  decided_by_name: 'Priya',
  decided_at: '2026-10-20T10:00:00Z',
  decision_note: 'ok',
};
const rejected = {
  ...base,
  id: 2,
  is_rejected: true,
  decided_by_name: 'Sam',
  decided_at: '2026-10-21T10:00:00Z',
  decision_note: 'too deep',
};
const legacy = { ...base, id: 3, is_approved: true }; // approved before decisions were recorded
const pending = { ...base, id: 4 };

describe('PriceDecisions', () => {
  it('lists decided changes, newest decision first, with who, when and the note', () => {
    render(<PriceDecisions logs={[approved, pending, rejected]} productNames={{ 1: 'Shin Ramyun' }} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Rejected')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Sam')).toBeInTheDocument();
    expect(within(rows[0]).getByText('too deep')).toBeInTheDocument();
    expect(within(rows[0]).getByText(new Date(rejected.decided_at).toLocaleString())).toBeInTheDocument();
    expect(within(rows[1]).getByText('Approved')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Priya')).toBeInTheDocument();
  });

  it('shows a dash for decisions made before they were recorded', () => {
    render(<PriceDecisions logs={[legacy]} />);
    const row = screen.getAllByRole('row')[1];
    expect(within(row).getByText('Approved')).toBeInTheDocument();
    expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('says when nothing has been decided', () => {
    render(<PriceDecisions logs={[pending]} />);
    expect(screen.getByText('No decisions yet.')).toBeInTheDocument();
  });
});

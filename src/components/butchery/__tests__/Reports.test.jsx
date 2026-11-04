import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WasteReport from '../WasteReport';
import YieldReport from '../YieldReport';

const YIELD = {
  from: '2026-09-14',
  to: '2026-11-04',
  group: 'product',
  rows: [
    {
      key: 1,
      name: 'Fake Side of Beef',
      breakdowns: 2,
      input_kg: '15.000',
      input_cost: '50.00',
      uncosted: 1,
      loss_kg: '0.350',
      expected_loss_kg: '0.450',
      outputs: [
        {
          kind: 'product',
          product: 2,
          name: 'Fake Rump Steak',
          actual_kg: '4.400',
          expected_kg: '4.500',
          actual_percent: '29.33',
          expected_percent: '30.00',
          variance_kg: '-0.100',
        },
        {
          kind: 'waste',
          product: null,
          name: 'Bone',
          actual_kg: '2.300',
          expected_kg: '2.250',
          actual_percent: '15.33',
          expected_percent: '15.00',
          variance_kg: '0.050',
        },
      ],
    },
  ],
};

const WASTE = {
  from: '2026-09-14',
  to: '2026-11-04',
  group: 'reason',
  total_cost: '7.40',
  weeks: [
    {
      week_start: '2026-11-02',
      total_cost: '7.40',
      rows: [
        { key: 'expired', name: 'Expired', write_offs: 2, quantity: 0, weight_kg: '1.750', cost: '5.00', uncosted: 1 },
        { key: 'damaged', name: 'Damaged', write_offs: 1, quantity: 3, weight_kg: '0.000', cost: '2.40', uncosted: 0 },
      ],
    },
  ],
};

describe('YieldReport', () => {
  it('shows each output against the template, with bad variances in red', () => {
    render(<YieldReport report={YIELD} />);
    expect(screen.getByText(/2 breakdowns · 15.000 kg in · cost £50.00 \(1 with no cost\)/)).toBeInTheDocument();
    const steak = screen.getByText('Fake Rump Steak').closest('tr');
    expect(within(steak).getByText('-0.100')).toHaveClass('text-red-600'); // less product than expected
    const bone = screen.getByText('Bone').closest('tr');
    expect(within(bone).getByText('+0.050')).toHaveClass('text-red-600'); // more waste than expected
    const loss = screen.getByText('Loss').closest('tr');
    expect(within(loss).getByText('-0.100')).toHaveClass('text-green-700'); // less loss than expected
  });

  it('says when there is nothing', () => {
    render(<YieldReport report={{ ...YIELD, rows: [] }} />);
    expect(screen.getByText('No breakdowns in these dates.')).toBeInTheDocument();
  });
});

describe('WasteReport', () => {
  it('shows each week with its cost, the uncosted ones and the total', () => {
    render(<WasteReport report={WASTE} />);
    expect(screen.getByText('Week of 02/11/2026')).toBeInTheDocument();
    expect(screen.getByText('+ 1 with no cost')).toBeInTheDocument();
    expect(screen.getByText('Total £7.40')).toBeInTheDocument();
  });
});

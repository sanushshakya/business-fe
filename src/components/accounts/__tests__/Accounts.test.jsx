import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PeriodPicker, { quickRanges } from '../PeriodPicker';
import { BalanceSheet, ProfitAndLoss, TrialBalanceTable } from '../Reports';
import VatReturn from '../VatReturn';
import { money, pounds } from '../money';

const BOXES = {
  start: '2026-07-01',
  end: '2026-09-30',
  box1: '1234.56',
  box2: '0.00',
  box3: '1234.56',
  box4: '1300.00',
  box5: '65.44',
  net_direction: 'reclaim',
  box6: '12345',
  box7: '6500',
  box8: '0',
  box9: '0',
  filed: null,
};

describe('money', () => {
  it('shows pounds with a minus sign and whole pounds for boxes 6–9', () => {
    expect(money('1234.5')).toBe('£1,234.50');
    expect(money('-10.00')).toBe('−£10.00');
    expect(pounds('12345')).toBe('£12,345');
  });
});

describe('PeriodPicker', () => {
  it('works out last month and last quarter from the UK day', () => {
    expect(quickRanges('2026-11-10')).toEqual({
      'This month': ['2026-11-01', '2026-11-10'],
      'Last month': ['2026-10-01', '2026-10-31'],
      'Last quarter': ['2026-07-01', '2026-09-30'],
    });
    expect(quickRanges('2026-02-15')['Last quarter']).toEqual(['2025-10-01', '2025-12-31']);
  });

  it('reports a chosen range', () => {
    const onChange = vi.fn();
    render(<PeriodPicker start="2026-11-01" end="2026-11-10" today="2026-11-10" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Last quarter' }));
    expect(onChange).toHaveBeenCalledWith('2026-07-01', '2026-09-30');
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-03' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-03', '2026-11-10');
  });
});

describe('reports', () => {
  it('shows the trial balance with its totals', () => {
    render(
      <TrialBalanceTable
        data={{
          rows: [
            { account: 1, code: '1010', name: 'Cash in tills', debit: '2.00', credit: '0.00' },
            { account: 2, code: '4020', name: 'Sales - zero rate', debit: '0.00', credit: '2.00' },
          ],
          debit: '2.00',
          credit: '2.00',
        }}
      />
    );
    const table = screen.getByRole('table', { name: 'Trial balance' });
    expect(within(table).getByText('Cash in tills')).toBeTruthy();
    expect(within(table).getAllByText('£2.00')).toHaveLength(4);
  });

  it('shows profit and loss, and a loss as a loss', () => {
    render(
      <ProfitAndLoss
        data={{
          income: [],
          expenses: [{ account: 7, code: '5000', name: 'Purchases', amount: '10.00' }],
          total_income: '0.00',
          total_expenses: '10.00',
          net_profit: '-10.00',
        }}
      />
    );
    expect(screen.getByText('Nothing posted.')).toBeTruthy();
    expect(screen.getByText('Net loss')).toBeTruthy();
    expect(screen.getByText('−£10.00')).toBeTruthy();
  });

  it('shows the balance sheet with profit to date', () => {
    render(
      <BalanceSheet
        data={{
          assets: [{ account: 1, code: '1000', name: 'Bank current account', amount: '5.00' }],
          liabilities: [],
          equity: [{ account: null, code: null, name: 'Profit to date', amount: '5.00' }],
          total_assets: '5.00',
          total_liabilities: '0.00',
          total_equity: '5.00',
          total_liabilities_and_equity: '5.00',
        }}
      />
    );
    expect(screen.getByText('Profit to date')).toBeTruthy();
    expect(screen.getByText('Liabilities and equity')).toBeTruthy();
  });
});

describe('VatReturn', () => {
  it('shows the nine boxes and the direction of box 5', () => {
    render(<VatReturn data={BOXES} isStaff onFile={vi.fn()} />);
    expect(screen.getAllByText('£1,234.56', { selector: 'td' })).toHaveLength(2); // boxes 1 and 3
    expect(screen.getByText('Net VAT (to reclaim)')).toBeTruthy();
    expect(screen.getByText('£12,345')).toBeTruthy();
  });

  it('files only after a second click, and only for staff', () => {
    const onFile = vi.fn();
    const { rerender } = render(<VatReturn data={BOXES} isStaff onFile={onFile} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark as filed' }));
    expect(onFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Yes, mark as filed/ }));
    expect(onFile).toHaveBeenCalledTimes(1);
    rerender(<VatReturn data={BOXES} isStaff={false} onFile={onFile} />);
    expect(screen.queryByRole('button', { name: 'Mark as filed' })).toBeNull();
  });

  it('shows the filed figures, not the current ones', () => {
    const filed = { ...BOXES, box1: '999.99', filed_at: '2026-10-05T09:00:00Z', id: 3 };
    render(<VatReturn data={{ ...BOXES, filed }} isStaff onFile={vi.fn()} />);
    expect(screen.getByText('£999.99', { selector: 'td' })).toBeTruthy();
    expect(screen.getByText(/its months are locked/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark as filed' })).toBeNull();
  });
});

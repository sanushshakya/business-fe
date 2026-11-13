import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import DashboardPage from '../DashboardPage';
import { joinWeeks } from '../../components/dashboard/WeekTables';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn() } }));
vi.mock('../../utils/dateUtils', () => ({ ukToday: () => '2026-03-04' }));

const place = (branch, name, location = null, code = null) => ({
  branch,
  branch_name: name,
  location,
  location_code: code,
  location_name: null,
});
const sale = (fields) => ({
  channel: 'till',
  ...place(1, 'Fake North'),
  net: '0.00',
  costed_net: '0.00',
  cost: '0.00',
  margin: '0.00',
  margin_percent: null,
  uncosted_net: '0.00',
  units: 0,
  kg: '0.000',
  ...fields,
});
const totals = (fields) => ({
  net: '0.00',
  costed_net: '0.00',
  cost: '0.00',
  uncosted_net: '0.00',
  margin: '0.00',
  margin_percent: null,
  waste_cost: '0.00',
  stock_value: '0.00',
  ...fields,
});
const REPORT = {
  week_start: '2026-03-02',
  end: '2026-03-04',
  previous_start: '2026-02-23',
  previous_end: '2026-02-25',
  days: 3,
  current: {
    sales: [
      sale({ net: '10.50', costed_net: '10.50', cost: '7.50', margin: '3.00', margin_percent: '28.57' }),
      sale({ channel: 'online', ...place(null, 'Online shop'), net: '5.80', uncosted_net: '5.80' }),
    ],
    waste: [
      {
        ...place(1, 'Fake North', 3, 'SHOP-1'),
        units: 1,
        kg: '0.250',
        cost: '3.00',
        uncosted_units: 0,
        uncosted_kg: '0.000',
      },
    ],
    stock: [{ ...place(1, 'Fake North', 3, 'SHOP-1'), value: '60.00', uncosted_units: 5, uncosted_kg: '0.000' }],
    totals: totals({
      net: '16.30',
      costed_net: '10.50',
      cost: '7.50',
      margin: '3.00',
      margin_percent: '28.57',
      uncosted_net: '5.80',
      waste_cost: '3.00',
      stock_value: '60.00',
    }),
  },
  previous: {
    sales: [
      sale({ net: '2.00', costed_net: '2.00', cost: '1.50', margin: '0.50', margin_percent: '25.00' }),
      sale({ channel: 'trade', ...place(null, 'No branch', 9, 'WH-1'), net: '4.00' }),
      sale({ ...place(2, 'Fake South'), net: '-3.60', costed_net: '-3.60', cost: '-1.00', margin: '-2.60' }),
    ],
    waste: [],
    stock: [{ ...place(1, 'Fake North', 3, 'SHOP-1'), value: '67.50', uncosted_units: 0, uncosted_kg: '0.000' }],
    totals: totals({ net: '6.00', stock_value: '67.50' }),
  },
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <DashboardPage />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockResolvedValue({ data: REPORT });
});

describe('DashboardPage', () => {
  it('shows this week against last week with the change', async () => {
    renderPage();
    const sales = await screen.findByRole('table', { name: 'Sales and margin' });
    const north = within(sales).getAllByText('Fake North')[0].closest('tr');
    expect(north).toHaveTextContent('£10.50£2.00+£8.50£3.0028.57%');
    const online = within(sales).getByText('Online shop').closest('tr');
    expect(within(online).getByText('£5.80', { selector: 'td:last-child' })).toBeInTheDocument();
    const trade = within(sales).getByText('No branch · WH-1').closest('tr'); // only last week had trade sales
    expect(trade).toHaveTextContent('£0.00£4.00−£4.00');
    expect(within(sales).getByText('Total').closest('tr')).toHaveTextContent('£16.30£6.00+£10.30');
    const south = within(sales).getByText('Fake South').closest('tr'); // credits beat sales last week
    expect(south).toHaveTextContent('£0.00−£3.60+£3.60');
    expect(south).not.toHaveTextContent('£-');
    const stock = screen.getByRole('table', { name: 'Stock value' });
    expect(within(stock).getByText('Fake North · SHOP-1').closest('tr')).toHaveTextContent('£60.00£67.50−£7.505 units');
    expect(screen.getByRole('table', { name: 'Waste' })).toHaveTextContent('£3.00');
    expect(axios.get).toHaveBeenCalledWith('/reports/dashboard/', { params: { week: '2026-03-04' } });
  });

  it('moves a week at a time', async () => {
    renderPage();
    await screen.findByRole('table', { name: 'Sales and margin' });
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    await waitFor(() =>
      expect(axios.get).toHaveBeenLastCalledWith('/reports/dashboard/', { params: { week: '2026-02-25' } })
    );
  });

  it('goes back to this week when the date is cleared', async () => {
    renderPage();
    await screen.findByRole('table', { name: 'Sales and margin' });
    fireEvent.change(screen.getByLabelText('Week of'), { target: { value: '' } });
    expect(screen.getByLabelText('Week of')).toHaveValue('2026-03-04');
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    await waitFor(() =>
      expect(axios.get).toHaveBeenLastCalledWith('/reports/dashboard/', { params: { week: '2026-03-11' } })
    );
  });

  it('says why when the server refuses', async () => {
    axios.get.mockRejectedValue({ response: { status: 403, data: { detail: 'You do not have permission.' } } });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission.');
  });
});

describe('joinWeeks', () => {
  it('keeps rows only one week had', () => {
    const key = (r) => r.id;
    expect(joinWeeks([{ id: 1 }], [{ id: 1 }, { id: 2 }], key).map((j) => [j.key, !!j.row, !!j.before])).toEqual([
      [1, true, true],
      [2, false, true],
    ]);
  });
});

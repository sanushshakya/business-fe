import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { ukToday } from '../utils/dateUtils';
import { SalesTable, StockTable, WasteTable } from '../components/dashboard/WeekTables';

const shift = (day, days) => {
  const date = new Date(`${day}T12:00:00Z`); // midday UTC: no clock change moves it to another day
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * The business at a glance (G59, staff): sales and margin by channel and branch, waste and stock value by location,
 * for a week against the same days of the week before. Money is ex VAT; cost is each batch's landed cost.
 */
const DashboardPage = () => {
  const [week, setWeek] = React.useState(ukToday);
  const report = useQuery({
    queryKey: ['dashboard', week],
    queryFn: () => axios.get('/reports/dashboard/', { params: { week } }).then(({ data }) => data),
    enabled: Boolean(week),
  });
  const data = report.data;
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Business overview</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setWeek(shift(week, -7))} aria-label="Previous week">
            ←
          </Button>
          <Input type="date" aria-label="Week of" value={week} onChange={(e) => setWeek(e.target.value)} />
          <Button variant="secondary" onClick={() => setWeek(shift(week, 7))} aria-label="Next week">
            →
          </Button>
        </div>
      </div>
      {report.isError && (
        <p role="alert" className="text-sm text-red-600">
          {apiErrorMessage(report.error, 'Could not load the overview.')}
        </p>
      )}
      {report.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {data && (
        <>
          <p className="text-sm text-gray-600">
            {`Week from ${data.week_start} to ${data.end} (${data.days} day${data.days === 1 ? '' : 's'}), against ` +
              `${data.previous_start} to ${data.previous_end}. Money ex VAT; margin over sales whose stock had a cost.`}
          </p>
          <div className="space-y-2">
            <h3 className="font-semibold">Sales and margin</h3>
            <SalesTable
              current={data.current.sales}
              previous={data.previous.sales}
              totals={data.current.totals}
              previousTotals={data.previous.totals}
            />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Waste</h3>
            <WasteTable
              current={data.current.waste}
              previous={data.previous.waste}
              totals={data.current.totals}
              previousTotals={data.previous.totals}
            />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Stock value at the end of each period</h3>
            <StockTable
              current={data.current.stock}
              previous={data.previous.stock}
              totals={data.current.totals}
              previousTotals={data.previous.totals}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default DashboardPage;

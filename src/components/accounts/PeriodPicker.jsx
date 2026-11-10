import React from 'react';
import { Button, Input } from '@/components/ui';

const iso = (date) => date.toISOString().slice(0, 10);
const utc = (year, month, day) => new Date(Date.UTC(year, month, day));

/** The quick ranges, from ``today`` ('YYYY-MM-DD', the UK day): this month so far, last month, last quarter. */
export const quickRanges = (today) => {
  const [year, month] = today.split('-').map(Number);
  const m = month - 1;
  const quarter = Math.floor(m / 3) * 3;
  return {
    'This month': [iso(utc(year, m, 1)), today],
    'Last month': [iso(utc(year, m - 1, 1)), iso(utc(year, m, 0))],
    'Last quarter': [iso(utc(year, quarter - 3, 1)), iso(utc(year, quarter, 0))],
  };
};

/** From–to dates for the reports, with quick ranges. */
const PeriodPicker = ({ start, end, today, onChange }) => (
  <div className="flex flex-wrap items-end gap-2">
    <label className="text-sm">
      From
      <Input type="date" aria-label="From" value={start} max={end} onChange={(e) => onChange(e.target.value, end)} />
    </label>
    <label className="text-sm">
      To
      <Input type="date" aria-label="To" value={end} min={start} onChange={(e) => onChange(start, e.target.value)} />
    </label>
    {Object.entries(quickRanges(today)).map(([label, [from, to]]) => (
      <Button key={label} variant="secondary" onClick={() => onChange(from, to)}>
        {label}
      </Button>
    ))}
  </div>
);

export default PeriodPicker;

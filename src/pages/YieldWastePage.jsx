import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import WasteReport from '../components/butchery/WasteReport';
import YieldReport from '../components/butchery/YieldReport';

const TABS = {
  yield: {
    label: 'Yield',
    url: '/inventory/reports/yield/',
    groups: [
      ['product', 'By product'],
      ['supplier', 'By supplier'],
      ['butcher', 'By butcher'],
    ],
    Report: YieldReport,
  },
  waste: {
    label: 'Waste',
    url: '/inventory/reports/waste/',
    groups: [
      ['reason', 'By reason'],
      ['product', 'By product'],
    ],
    Report: WasteReport,
  },
};

/**
 * Yield and waste reports (G24) for staff and the stock role. Empty dates leave it to the server (the last 8 weeks,
 * from a Monday, up to today), whose answer gives the dates it used.
 */
const YieldWastePage = () => {
  const [tab, setTab] = React.useState('yield');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [group, setGroup] = React.useState('product');
  const { url, groups, Report } = TABS[tab];
  const params = { group, ...(from ? { from } : {}), ...(to ? { to } : {}) };
  const report = useQuery({
    queryKey: ['report', url, params],
    queryFn: async () => (await axios.get(url, { params })).data,
    keepPreviousData: true,
  });

  const switchTo = (next) => {
    setTab(next);
    setGroup(TABS[next].groups[0][0]);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Yield and waste</h2>
      <div className="flex gap-2" role="tablist">
        {Object.entries(TABS).map(([key, { label }]) => (
          <Button
            key={key}
            role="tab"
            aria-selected={tab === key}
            variant={tab === key ? 'primary' : 'secondary'}
            onClick={() => switchTo(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="report-from" className="mb-1 block text-sm font-medium">
            From
          </label>
          <Input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label htmlFor="report-to" className="mb-1 block text-sm font-medium">
            To
          </label>
          <Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Select aria-label="Group" value={group} onChange={(e) => setGroup(e.target.value)} className="w-44">
          {groups.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      {report.isError && (
        <p role="alert" className="text-sm text-red-600">
          {apiErrorMessage(report.error, 'Could not load the report.')}
        </p>
      )}
      {report.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {report.data && report.data.group === group && <Report report={report.data} />}
    </section>
  );
};

export default YieldWastePage;

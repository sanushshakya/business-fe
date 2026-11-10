import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { ukToday } from '../utils/dateUtils';
import useMe from '../hooks/useMe';
import PeriodPicker from '../components/accounts/PeriodPicker';
import { BalanceSheet, ProfitAndLoss, TrialBalanceTable } from '../components/accounts/Reports';
import VatReturn from '../components/accounts/VatReturn';

const TABS = {
  pl: { label: 'Profit and loss', url: '/accounting/reports/profit-and-loss/', params: (from, to) => ({ from, to }) },
  bs: { label: 'Balance sheet', url: '/accounting/reports/balance-sheet/', params: (_from, to) => ({ on: to }) },
  tb: { label: 'Trial balance', url: '/accounting/trial-balance/', params: (_from, to) => ({ on: to }) },
  vat: { label: 'VAT return', url: '/accounting/vat-return/', params: (from, to) => ({ from, to }) },
};

/** The books (G54, staff): profit and loss, balance sheet, trial balance and the VAT return for a period. */
const AccountsPage = () => {
  const today = ukToday();
  const [tab, setTab] = React.useState('pl');
  const [[from, to], setRange] = React.useState([`${today.slice(0, 8)}01`, today]);
  const [error, setError] = React.useState(null);
  const me = useMe();
  const queryClient = useQueryClient();
  const { url, params } = TABS[tab];
  const report = useQuery({
    queryKey: ['accounts', tab, from, to],
    queryFn: () => axios.get(url, { params: params(from, to) }).then(({ data }) => data),
    enabled: Boolean(from && to),
  });
  const file = useMutation({
    mutationFn: () => axios.post('/accounting/vat-returns/', { from, to }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'The return was not filed.')),
  });

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Accounts</h2>
      <div role="tablist" className="flex flex-wrap gap-2">
        {Object.entries(TABS).map(([key, { label }]) => (
          <Button
            key={key}
            role="tab"
            aria-selected={tab === key}
            variant={tab === key ? 'primary' : 'secondary'}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <PeriodPicker start={from} end={to} today={today} onChange={(start, end) => setRange([start, end])} />
      {(tab === 'bs' || tab === 'tb') && <p className="text-sm text-gray-600">As at the end of {to}.</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {report.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {report.isError && (
        <p role="alert" className="text-sm text-red-600">
          {apiErrorMessage(report.error, 'Could not load the report.')}
        </p>
      )}
      {report.data && tab === 'pl' && <ProfitAndLoss data={report.data} />}
      {report.data && tab === 'bs' && <BalanceSheet data={report.data} />}
      {report.data && tab === 'tb' && <TrialBalanceTable data={report.data} />}
      {report.data && tab === 'vat' && (
        <VatReturn
          data={report.data}
          isStaff={Boolean(me.data?.is_staff)}
          busy={file.isLoading}
          onFile={() => file.mutate()}
        />
      )}
    </section>
  );
};

export default AccountsPage;

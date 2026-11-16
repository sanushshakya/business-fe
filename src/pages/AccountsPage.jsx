import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { ukToday } from '../utils/dateUtils';
import useMe from '../hooks/useMe';
import PeriodPicker from '../components/accounts/PeriodPicker';
import { BalanceSheet, ProfitAndLoss, TrialBalanceTable } from '../components/accounts/Reports';
import VatReturn from '../components/accounts/VatReturn';
import HmrcPanel from '../components/accounts/HmrcPanel';
import { clientInfo } from '../utils/hmrcFraud';

const TABS = {
  pl: { label: 'Profit and loss', url: '/accounting/reports/profit-and-loss/', params: (from, to) => ({ from, to }) },
  bs: { label: 'Balance sheet', url: '/accounting/reports/balance-sheet/', params: (_from, to) => ({ on: to }) },
  tb: { label: 'Trial balance', url: '/accounting/trial-balance/', params: (_from, to) => ({ on: to }) },
  vat: { label: 'VAT return', url: '/accounting/vat-return/', params: (from, to) => ({ from, to }) },
};

const HMRC_RETURNS = {
  connected: 'Connected to HMRC.',
  state: 'The HMRC sign-in expired or was already used. Connect again.',
  denied: 'HMRC access was not granted.',
  exchange: 'HMRC refused the sign-in. Connect again.',
};

/** HMRC's answer as text: its own message when it refused, else the usual API error. */
const hmrcMessage = (failure, fallback) => failure?.response?.data?.message || apiErrorMessage(failure, fallback);

/** The books (G54, staff): profit and loss, balance sheet, trial balance and the VAT return for a period; the return
 * is filed with HMRC (G56) when MTD filing is on. */
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [hmrcError, setHmrcError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  React.useEffect(() => {
    const outcome = searchParams.get('hmrc');
    if (!outcome) return;
    if (outcome === 'connected') setNotice(HMRC_RETURNS.connected);
    else setHmrcError(HMRC_RETURNS[searchParams.get('reason')] || 'Could not connect to HMRC.');
    setTab('vat');
    const next = new URLSearchParams(searchParams);
    next.delete('hmrc');
    next.delete('reason');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const onVat = tab === 'vat';
  const hmrc = useQuery({
    queryKey: ['hmrc', 'status'],
    queryFn: () => axios.get('/accounting/hmrc/').then(({ data }) => data),
    enabled: onVat,
  });
  const hmrcOn = Boolean(hmrc.data && hmrc.data.environment !== 'off');
  const connected = Boolean(hmrcOn && hmrc.data.connected);
  const obligations = useQuery({
    queryKey: ['hmrc', 'obligations'],
    queryFn: () => axios.post('/accounting/hmrc/obligations/', { client: clientInfo() }).then(({ data }) => data),
    enabled: onVat && connected,
    retry: false,
    refetchOnWindowFocus: false, // each read reaches HMRC (and may refresh the token)
  });
  const submissions = useQuery({
    queryKey: ['hmrc', 'returns'],
    queryFn: () => axios.get('/accounting/hmrc/returns/').then(({ data }) => data),
    enabled: onVat && hmrcOn,
  });
  const hmrcDone = () => {
    queryClient.invalidateQueries({ queryKey: ['hmrc'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };
  const connect = useMutation({
    mutationFn: () => axios.post('/accounting/hmrc/connect/').then(({ data }) => data),
    onSuccess: ({ authorize_url: url }) => window.location.assign(url),
    onError: (failure) => setHmrcError(apiErrorMessage(failure, 'Could not start connecting to HMRC.')),
  });
  const disconnect = useMutation({
    mutationFn: () => axios.delete('/accounting/hmrc/connection/'),
    onSuccess: hmrcDone,
    onError: (failure) => setHmrcError(apiErrorMessage(failure, 'Could not disconnect.')),
  });
  const submit = useMutation({
    mutationFn: ({ periodKey, start, end }) =>
      axios.post('/accounting/hmrc/returns/', {
        period_key: periodKey,
        start,
        end,
        declaration: true,
        client: clientInfo(),
      }),
    onSuccess: () => {
      setHmrcError(null);
      hmrcDone();
    },
    onError: (failure) => {
      setHmrcError(hmrcMessage(failure, 'The return was not submitted.'));
      hmrcDone();
    },
  });
  const resolve = useMutation({
    mutationFn: ({ id, action, reason }) =>
      axios.post(`/accounting/hmrc/returns/${id}/resolve/`, { action, reason, client: clientInfo() }),
    onSuccess: () => {
      setHmrcError(null);
      hmrcDone();
    },
    onError: (failure) => setHmrcError(hmrcMessage(failure, 'Could not resolve the attempt.')),
  });
  const check = useMutation({
    mutationFn: (id) => axios.post(`/accounting/hmrc/returns/${id}/check/`, { client: clientInfo() }),
    onSuccess: () => {
      setHmrcError(null);
      hmrcDone();
    },
    onError: (failure) => setHmrcError(hmrcMessage(failure, 'Could not check with HMRC.')),
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
            onClick={() => {
              setTab(key);
              setError(null);
              setNotice(null);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <PeriodPicker
        start={from}
        end={to}
        today={today}
        onChange={(start, end) => {
          setRange([start, end]);
          setError(null);
        }}
      />
      {(tab === 'bs' || tab === 'tb') && <p className="text-sm text-gray-600">As at the end of {to}.</p>}
      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {report.isInitialLoading && <p className="text-sm text-gray-500">Loading…</p>}
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
          key={`${from}:${to}`}
          data={report.data}
          isStaff={Boolean(me.data?.is_staff)}
          busy={file.isLoading}
          hmrcOn={hmrcOn}
          onFile={() => file.mutate()}
        />
      )}
      {tab === 'vat' && hmrcOn && (
        <HmrcPanel
          status={hmrc.data}
          obligations={obligations.data ?? []}
          submissions={submissions.data ?? []}
          isStaff={Boolean(me.data?.is_staff)}
          key={(submissions.data ?? []).length}
          period={{ start: from, end: to }}
          busy={connect.isLoading || disconnect.isLoading || submit.isLoading || check.isLoading || resolve.isLoading}
          error={
            hmrcError || (obligations.isError ? hmrcMessage(obligations.error, 'Could not read HMRC periods.') : null)
          }
          onConnect={() => connect.mutate()}
          onDisconnect={() => disconnect.mutate()}
          onPick={(start, end) => setRange([start, end])}
          onSubmit={(periodKey, start, end) => submit.mutate({ periodKey, start, end })}
          onCheck={(id) => check.mutate(id)}
          onResolve={(id, action, reason) => resolve.mutate({ id, action, reason })}
        />
      )}
    </section>
  );
};

export default AccountsPage;

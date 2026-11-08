import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/axios';
import { apiErrorMessage } from '../../utils/http';
import DriverStop from '../../components/b2b/DriverStop';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import usePagedList from '../../hooks/usePagedList';

/** The driver's phone (G46b): their runs (the server lists only theirs), then each stop to deliver. */
const DriverPage = () => {
  const { id } = useParams();
  // Only what is still to drive (the server lists only the driver's own runs): a phone never walks the history.
  const out = usePagedList('/wholesale/runs/', { params: { status: 'out' }, pageSize: 50 });
  const planned = usePagedList('/wholesale/runs/', { params: { status: 'planned' }, pageSize: 50 });
  const runs = {
    ...out,
    isLoading: out.isLoading || planned.isLoading,
    isError: out.isError || planned.isError,
    data: [...(out.data?.results ?? []), ...(planned.data?.results ?? [])],
  };
  const run = useQuery({
    queryKey: ['run', id],
    queryFn: () => axios.get(`/wholesale/runs/${id}/`).then(({ data }) => data),
    enabled: Boolean(id),
  });
  const queryClient = useQueryClient();
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(null);

  const record = async (stop, path, body) => {
    setBusy(stop.id);
    try {
      await axios.post(`/wholesale/runs/${id}/stops/${stop.id}/${path}/`, body);
      setErrors((current) => ({ ...current, [stop.id]: null }));
    } catch (failure) {
      setErrors((current) => ({ ...current, [stop.id]: apiErrorMessage(failure, 'Not recorded: try again.') }));
      throw failure;
    } finally {
      setBusy(null);
      // Also after a failure: a lost answer may still have been recorded (then the stop shows as done).
      queryClient.invalidateQueries({ queryKey: ['run', id] });
    }
  };

  if (!id) {
    const mine = runs.data;
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">My deliveries</h2>
        <QueryState
          query={{ ...runs, data: mine }}
          empty={<EmptyState title="No runs" description="Runs planned for you show up here." />}
        >
          {(rows) => (
            <ul className="space-y-2">
              {rows.map((item) => (
                <li key={item.id}>
                  <Link to={`/dashboard/driver/${item.id}`} className="block rounded border p-4 text-lg">
                    {item.number_display} · {item.run_date} · {item.stops.length} stops
                    <span className="ml-2 text-sm text-gray-500">
                      {item.status === 'planned' ? 'not started' : 'out'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </section>
    );
  }

  if (run.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (run.isError)
    return (
      <p role="alert" className="text-sm text-red-600">
        Could not load the run.
      </p>
    );
  const data = run.data;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">
        {data.number_display} · {data.vehicle_code}
      </h2>
      {data.status !== 'out' && <p className="text-sm text-gray-600">This run is {data.status}: nothing to record.</p>}
      {data.stops.map((stop) =>
        data.status === 'out' ? (
          <DriverStop
            key={stop.id}
            stop={stop}
            busy={busy === stop.id}
            error={errors[stop.id]}
            onDeliver={(body) => record(stop, 'deliver', body)}
            onFail={(reason) => record(stop, 'fail', { reason })}
          />
        ) : (
          <DriverStop
            key={stop.id}
            stop={{ ...stop, status: stop.status === 'pending' ? 'planned' : stop.status }}
            onDeliver={() => {}}
            onFail={() => {}}
          />
        )
      )}
    </section>
  );
};

export default DriverPage;

import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Modal, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../../utils/axios';
import { ukToday } from '../../utils/dateUtils';
import { apiErrorMessage } from '../../utils/http';
import { openPdf } from '../../utils/pdf';
import RunForm from '../../components/b2b/RunForm';
import useRunChoices from './useRunChoices';

/** One delivery run (G44): its stops with proof of delivery; re-plan, start, complete, cancel; the manifest. */
const RunPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const base = `/wholesale/runs/${id}/`;
  const run = useQuery({ queryKey: ['run', id], queryFn: () => axios.get(base).then(({ data }) => data) });
  const current = (run.data?.stops ?? []).map((stop) => ({
    id: stop.order,
    number_display: stop.order_number,
    customer_name: stop.customer_name,
  }));
  const choices = useRunChoices(current);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [replanning, setReplanning] = React.useState(false);

  const call = async (request) => {
    setBusy(true);
    try {
      await request();
      setError(null);
      setReplanning(false);
    } catch (failure) {
      setError(apiErrorMessage(failure, 'That did not work.'));
    } finally {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: ['run', id] }); // someone else may have moved it on
      queryClient.invalidateQueries({ queryKey: ['list'] });
    }
  };
  const open = (url) => openPdf(url).catch((failure) => setError(apiErrorMessage(failure, 'Could not open it.')));

  if (run.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (run.isError)
    return (
      <p role="alert" className="text-sm text-red-600">
        Could not load the run.
      </p>
    );
  const data = run.data;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">
          {data.number_display} · {data.run_date} · {data.vehicle_code} · {data.driver_name}
        </h2>
        <Badge color={data.status === 'out' ? 'yellow' : 'blue'}>{data.status}</Badge>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => open(`${base}manifest/`)}>
          Manifest
        </Button>
        {data.status === 'planned' && (
          <>
            <Button variant="secondary" onClick={() => setReplanning(true)}>
              Re-plan
            </Button>
            <Button disabled={busy} onClick={() => call(() => axios.post(`${base}start/`, {}))}>
              Start the run
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => call(() => axios.post(`${base}cancel/`, {}))}>
              Cancel the run
            </Button>
          </>
        )}
        {data.status === 'out' && (
          <Button disabled={busy} onClick={() => call(() => axios.post(`${base}complete/`, {}))}>
            Complete the run
          </Button>
        )}
      </div>
      <Table>
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th>Proof of delivery</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.stops.map((stop) => (
            <Tr key={stop.id}>
              <Td>{stop.position}</Td>
              <Td className="font-mono">{stop.order_number}</Td>
              <Td>
                {stop.customer_name}
                <span className="block text-xs text-gray-500">
                  {stop.line1}, {stop.postcode}
                </span>
              </Td>
              <Td>{stop.status}</Td>
              <Td>
                {stop.received_by && `${stop.received_by} · ${stop.delivered_at?.slice(0, 16).replace('T', ' ')}`}
                {stop.failed_reason}
                {stop.has_photo && (
                  <Button variant="secondary" className="ml-2" onClick={() => open(`${base}stops/${stop.id}/photo/`)}>
                    Photo
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Modal open={replanning} onClose={() => setReplanning(false)} title="Re-plan the run">
        {replanning && (
          <RunForm
            run={data}
            {...choices}
            today={ukToday()}
            submitting={busy}
            error={error}
            onCancel={() => setReplanning(false)}
            onSubmit={(body) => call(() => axios.patch(base, body))}
          />
        )}
      </Modal>
    </section>
  );
};

export default RunPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Input, Modal, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../../utils/axios';
import { ukToday } from '../../utils/dateUtils';
import { apiErrorMessage } from '../../utils/http';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import RunForm from '../../components/b2b/RunForm';
import usePagedList from '../../hooks/usePagedList';
import useRunChoices from './useRunChoices';

const RUNS = '/wholesale/runs/';
const STATUSES = ['planned', 'out', 'completed', 'cancelled'];

/** Delivery runs (G44), for staff: plan one, then open it to start, complete or print the manifest. */
const RunsPage = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState('');
  const [day, setDay] = React.useState('');
  const runs = usePagedList(RUNS, {
    params: { ...(status ? { status } : {}), ...(day ? { date: day } : {}) },
    pageSize: 50,
  });
  const choices = useRunChoices();
  const [planning, setPlanning] = React.useState(false);
  const [error, setError] = React.useState(null);
  const create = useMutation({
    mutationFn: (body) => axios.post(RUNS, body),
    onSuccess: () => {
      setPlanning(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not plan the run.')),
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Delivery runs</h2>
        <div className="flex gap-2">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
            <option value="">All</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Input type="date" aria-label="Date" value={day} onChange={(e) => setDay(e.target.value)} />
          <Button className="whitespace-nowrap" onClick={() => setPlanning(true)}>
            Plan a run
          </Button>
        </div>
      </div>
      <QueryState
        query={{ ...runs, data: runs.data?.results }}
        empty={<EmptyState title="No runs" description="Plan one for picked orders." />}
      >
        {(rows) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Run</Th>
                <Th>Date</Th>
                <Th>Van</Th>
                <Th>Driver</Th>
                <Th>Stops</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((run) => (
                <Tr key={run.id}>
                  <Td>
                    <Link to={`/dashboard/b2b/runs/${run.id}`} className="font-mono text-primary underline">
                      {run.number_display}
                    </Link>
                  </Td>
                  <Td>{run.run_date}</Td>
                  <Td>{run.vehicle_code}</Td>
                  <Td>{run.driver_name}</Td>
                  <Td>{run.stops.length}</Td>
                  <Td>
                    <Badge color={run.status === 'out' ? 'yellow' : 'blue'}>{run.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
      <Modal open={planning} onClose={() => setPlanning(false)} title="Plan a run">
        {planning && (
          <RunForm
            {...choices}
            today={ukToday()}
            submitting={create.isLoading}
            error={error}
            onCancel={() => setPlanning(false)}
            onSubmit={(body) => create.mutate(body)}
          />
        )}
      </Modal>
    </section>
  );
};

export default RunsPage;

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Modal, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { formatMoney } from '../utils/money';
import EmptyState from '../components/EmptyState';
import QueryState from '../components/QueryState';
import PromotionForm, { KINDS } from '../components/promotions/PromotionForm';
import useApiList from '../hooks/useApiList';
import usePagedList from '../hooks/usePagedList';

const PROMOTIONS = '/promotions/promotions/';
const STATUS_COLOURS = { live: 'green', scheduled: 'blue', ended: 'gray' };

/** What a promotion gives, in a few words. */
export const describe = (p) => {
  if (p.kind === 'multi_buy') return `${p.buy_quantity} for ${formatMoney(p.deal_price)}`;
  if (p.kind === 'bogof') return `Buy ${p.buy_quantity} get ${p.get_quantity} free`;
  if (p.kind === 'meal_deal') return `${p.groups.length} items for ${formatMoney(p.deal_price)}`;
  return `${Number(p.percent)}% off${p.stacks ? ', stacks' : ''}`;
};

const dates = (p) => `${p.starts_on} – ${p.ends_on ?? 'no end'}`;

/** Till promotions (G58, staff): list by status, create and edit, end now (a second click confirms). */
const PromotionsPage = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState('live');
  const promotions = usePagedList(PROMOTIONS, { params: status ? { status } : {}, pageSize: 50 });
  const products = useApiList('/inventory/products/');
  const categories = useApiList('/inventory/categories/');
  const branches = useApiList('/tenants/branches/');
  const [editing, setEditing] = React.useState(null);
  const [ending, setEnding] = React.useState(null);
  const [error, setError] = React.useState(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['list', PROMOTIONS] });

  const save = useMutation({
    mutationFn: (body) =>
      editing?.id ? axios.patch(`${PROMOTIONS}${editing.id}/`, body) : axios.post(PROMOTIONS, body),
    onSuccess: () => {
      setEditing(null);
      setError(null);
      refresh();
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not save the promotion.')),
  });
  const end = useMutation({
    mutationFn: (id) => axios.post(`${PROMOTIONS}${id}/end/`),
    onSuccess: () => {
      setEnding(null);
      setError(null);
      refresh();
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not end the promotion.')),
  });

  const open = (promotion) => {
    setError(null);
    setEditing(promotion);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Promotions</h2>
        <div className="flex gap-2">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
            <option value="ended">Ended</option>
            <option value="">All</option>
          </Select>
          <Button onClick={() => open({})}>New promotion</Button>
        </div>
      </div>
      {error && editing === null && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <QueryState
        query={{ ...promotions, data: promotions.data?.results }}
        empty={<EmptyState title="No promotions" description="Tills charge the shelf price." />}
      >
        {(rows) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Kind</Th>
                <Th>Deal</Th>
                <Th>Dates</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((p) => (
                <Tr key={p.id}>
                  <Td>{p.name}</Td>
                  <Td>{KINDS[p.kind]}</Td>
                  <Td>{describe(p)}</Td>
                  <Td>{dates(p)}</Td>
                  <Td>{p.priority}</Td>
                  <Td>
                    <Badge color={STATUS_COLOURS[p.status]}>{p.status}</Badge>
                  </Td>
                  <Td className="space-x-2 text-right">
                    <Button variant="secondary" onClick={() => open(p)} aria-label={`Edit ${p.name}`}>
                      Edit
                    </Button>
                    {p.status !== 'ended' && (
                      <Button
                        variant="secondary"
                        disabled={end.isLoading}
                        onClick={() => (ending === p.id ? end.mutate(p.id) : setEnding(p.id))}
                        aria-label={ending === p.id ? `Confirm end ${p.name}` : `End ${p.name}`}
                      >
                        {ending === p.id ? 'Confirm end' : 'End now'}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${editing.name}` : 'New promotion'}
      >
        {editing !== null && (
          <PromotionForm
            key={editing.id ?? 'new'}
            promotion={editing.id ? editing : null}
            products={products.data ?? []}
            categories={categories.data ?? []}
            branches={branches.data ?? []}
            submitting={save.isLoading}
            error={error}
            onCancel={() => setEditing(null)}
            onSubmit={(body) => save.mutate(body)}
          />
        )}
      </Modal>
    </section>
  );
};

export default PromotionsPage;

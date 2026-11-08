import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Modal, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../../utils/axios';
import { apiErrorMessage } from '../../utils/http';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import PriceListForm from '../../components/b2b/PriceListForm';
import useApiList from '../../hooks/useApiList';
import usePagedList from '../../hooks/usePagedList';

const LISTS = '/wholesale/price-lists/';

const valid = (list) => {
  if (!list.valid_from && !list.valid_to) return 'Always';
  return `${list.valid_from ?? '…'} – ${list.valid_to ?? '…'}`;
};

/** Price lists (G39): trade prices ex VAT with quantity breaks and dates, for customers and groups. */
const PriceListsPage = () => {
  const queryClient = useQueryClient();
  const [active, setActive] = React.useState('');
  const lists = usePagedList(LISTS, { params: active ? { active } : {}, pageSize: 50 });
  const products = useApiList('/inventory/products/');
  const customers = useApiList('/wholesale/customers/');
  const groups = useApiList('/wholesale/groups/');
  const [editing, setEditing] = React.useState(null);
  const [error, setError] = React.useState(null);

  const save = useMutation({
    mutationFn: (body) => (editing?.id ? axios.patch(`${LISTS}${editing.id}/`, body) : axios.post(LISTS, body)),
    onSuccess: () => {
      setEditing(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list', LISTS] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not save the price list.')),
  });

  const open = (list) => {
    setError(null);
    setEditing(list);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Price lists</h2>
        <div className="flex gap-2">
          <Select aria-label="Active" value={active} onChange={(e) => setActive(e.target.value)} className="w-40">
            <option value="">All lists</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Button onClick={() => open({})}>New price list</Button>
        </div>
      </div>
      <QueryState
        query={{ ...lists, data: lists.data?.results }}
        empty={<EmptyState title="No price lists" description="Trade customers pay the wholesale price for now." />}
      >
        {(rows) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Priority</Th>
                <Th>Valid</Th>
                <Th>Prices</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((list) => (
                <Tr key={list.id}>
                  <Td>{list.name}</Td>
                  <Td>{list.priority}</Td>
                  <Td>{valid(list)}</Td>
                  <Td>{list.entries.length === 1 ? '1 entry' : `${list.entries.length} entries`}</Td>
                  <Td>
                    <Badge color={list.is_active ? 'green' : 'gray'}>{list.is_active ? 'Active' : 'Inactive'}</Badge>
                  </Td>
                  <Td className="text-right">
                    <Button variant="secondary" onClick={() => open(list)} aria-label={`Edit ${list.name}`}>
                      Edit
                    </Button>
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
        title={editing?.id ? `Edit ${editing.name}` : 'New price list'}
      >
        {editing !== null && (
          <PriceListForm
            key={editing.id ?? 'new'}
            priceList={editing.id ? editing : null}
            products={products.data ?? []}
            customers={customers.data ?? []}
            groups={groups.data ?? []}
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

export default PriceListsPage;

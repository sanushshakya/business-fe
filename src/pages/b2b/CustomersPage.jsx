import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, Select } from '@/components/ui';
import axios from '../../utils/axios';
import { apiErrorMessage } from '../../utils/http';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import CustomerForm, { STATUSES } from '../../components/b2b/CustomerForm';
import CustomerList from '../../components/b2b/CustomerList';
import GroupPanel from '../../components/b2b/GroupPanel';
import useApiList from '../../hooks/useApiList';
import usePagedList from '../../hooks/usePagedList';

const CUSTOMERS = '/wholesale/customers/';
const GROUPS = '/wholesale/groups/';

/** Trade customers (G38) and their groups (G39), for staff. */
const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const params = { ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { status } : {}) };
  const customers = usePagedList(CUSTOMERS, { params, pageSize: 50 });
  const groups = useApiList(GROUPS);
  const [editing, setEditing] = React.useState(null); // null: closed; {}: new; a customer: edit
  const [error, setError] = React.useState(null);
  const [groupError, setGroupError] = React.useState(null);

  const save = useMutation({
    mutationFn: (body) => (editing?.id ? axios.patch(`${CUSTOMERS}${editing.id}/`, body) : axios.post(CUSTOMERS, body)),
    onSuccess: () => {
      setEditing(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list', CUSTOMERS] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Could not save the customer.')),
  });
  const groupChange = useMutation({
    mutationFn: ({ method, url, body }) => (body === undefined ? axios[method](url) : axios[method](url, body)),
    onSuccess: () => {
      setGroupError(null);
      queryClient.invalidateQueries({ queryKey: ['list', GROUPS] });
    },
    onError: (failure) => setGroupError(apiErrorMessage(failure, 'Could not change the groups.')),
  });

  const open = (customer) => {
    setError(null);
    setEditing(customer);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trade customers</h2>
        <Button onClick={() => open({})}>New customer</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              aria-label="Search customers"
              placeholder="Code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <QueryState
            query={{ ...customers, data: customers.data?.results }}
            empty={<EmptyState title="No trade customers" description="Add the restaurants and shops you supply." />}
          >
            {(rows) => <CustomerList customers={rows} groups={groups.data ?? []} onEdit={open} />}
          </QueryState>
        </div>
        <div className="space-y-2">
          <GroupPanel
            groups={groups.data ?? []}
            busy={groupChange.isLoading}
            onAdd={(name) => groupChange.mutateAsync({ method: 'post', url: GROUPS, body: { name } })}
            onDelete={(group) =>
              groupChange.mutateAsync({ method: 'delete', url: `${GROUPS}${group.id}/` }).catch(() => {})
            }
          />
          {groupError && (
            <p role="alert" className="text-sm text-red-600">
              {groupError}
            </p>
          )}
        </div>
      </div>
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${editing.account_code}` : 'New customer'}
      >
        {editing !== null && (
          <CustomerForm
            key={editing.id ?? 'new'}
            customer={editing.id ? editing : null}
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

export default CustomersPage;

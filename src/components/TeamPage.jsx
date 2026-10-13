import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../utils/axios';
import useApiList from '../hooks/useApiList';
import InviteUserForm from './InviteUserForm';
import QueryState from './QueryState';

const STATUS_COLORS = { accepted: 'green', pending: 'yellow', expired: 'red' };

/**
 * Staff view of invitations (/auth/invitations/) with a form to invite someone new.
 */
const TeamPage = () => {
  const queryClient = useQueryClient();
  const invitations = useApiList('/auth/invitations/');
  const invite = useMutation({
    mutationFn: (payload) => axios.post('/auth/invitations/', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', '/auth/invitations/'] }),
  });

  const errorMessage =
    invite.error?.response?.status === 403
      ? 'Only company admins can invite users.'
      : invite.isError
        ? 'Could not send the invitation.'
        : null;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Team</h2>
      <InviteUserForm onSubmit={invite.mutateAsync} submitting={invite.isLoading} />
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
      <QueryState query={invitations} emptyMessage="No invitations yet.">
        {(items) => (
          <Table>
            <Thead>
              <Tr>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((item) => (
                <Tr key={item.id}>
                  <Td>{item.invited_email}</Td>
                  <Td>{item.role}</Td>
                  <Td>
                    <Badge color={STATUS_COLORS[item.status] || 'gray'}>{item.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </QueryState>
    </section>
  );
};

export default TeamPage;

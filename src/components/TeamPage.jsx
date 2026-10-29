import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import axios from '../utils/axios';
import useApiList from '../hooks/useApiList';
import InviteUserForm from './InviteUserForm';
import QueryState from './QueryState';
import OperatorsPanel from './OperatorsPanel';
import StaffTwoFactorList from './StaffTwoFactorList';
import useMe from '../hooks/useMe';
import { apiErrorMessage } from '../utils/http';

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

  const OPERATORS = '/tenants/operators/';
  const operators = useApiList(OPERATORS);
  const [issued, setIssued] = React.useState(null);
  const refreshOperators = () => queryClient.invalidateQueries({ queryKey: ['list', OPERATORS] });
  const createOperator = useMutation({
    mutationFn: (payload) => axios.post(OPERATORS, payload).then((r) => r.data),
    onSuccess: (user) => {
      setIssued({ name: user.name, code: user.code });
      refreshOperators();
    },
  });
  const resetCode = useMutation({
    mutationFn: (user) => axios.post(`${OPERATORS}${user.id}/reset-code/`).then((r) => r.data),
    onSuccess: (user) => {
      setIssued({ name: user.name, code: user.code, reset: true });
      refreshOperators();
    },
  });
  const toggleActive = useMutation({
    mutationFn: (user) => axios.patch(`${OPERATORS}${user.id}/`, { is_active: !user.is_active }),
    onSuccess: refreshOperators,
  });
  const changeRole = useMutation({
    mutationFn: ({ user, role }) => axios.patch(`${OPERATORS}${user.id}/`, { role }),
    onSuccess: refreshOperators,
  });
  const TWO_FACTOR_USERS = '/auth/2fa/users/';
  const me = useMe();
  const twoFactorUsers = useApiList(TWO_FACTOR_USERS);
  const resetTwoFactor = useMutation({
    mutationFn: (user) => axios.post(`${TWO_FACTOR_USERS}${user.id}/reset/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', TWO_FACTOR_USERS] }),
  });

  const operatorError = [createOperator, resetCode, toggleActive, changeRole].find((m) => m.isError);

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
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Operators</h3>
        <p className="text-sm text-gray-600">
          Operators sign in with an 8-digit code instead of an email and password and only see the area their role
          covers: till, demand, freight, supplier or stock.
        </p>
        {operatorError && (
          <p role="alert" className="text-sm text-red-600">
            {operatorError.error?.response?.status === 403
              ? 'Only company admins can manage operators.'
              : apiErrorMessage(operatorError.error, 'Could not update operators.')}
          </p>
        )}
        {operators.isError && (
          <p role="alert" className="text-sm text-red-600">
            {operators.error?.response?.status === 403
              ? "You don't have permission to view operators."
              : 'Could not load operators.'}
          </p>
        )}
        <OperatorsPanel
          users={operators.data || []}
          onCreate={createOperator.mutateAsync}
          onResetCode={resetCode.mutateAsync}
          onToggleActive={toggleActive.mutate}
          onChangeRole={(user, role) => changeRole.mutate({ user, role })}
          issued={issued}
          onDismissCode={() => setIssued(null)}
        />
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Two-factor sign-in</h3>
        <p className="text-sm text-gray-600">
          Admins must use two-factor sign-in; others can turn it on in Settings. If someone loses their phone, reset
          theirs: they are signed out and set it up again at their next sign-in.
        </p>
        {resetTwoFactor.isError && (
          <p role="alert" className="text-sm text-red-600">
            {apiErrorMessage(resetTwoFactor.error, 'Could not reset two-factor sign-in.')}
          </p>
        )}
        {resetTwoFactor.isSuccess && (
          <p role="status" className="text-sm text-green-700">
            Two-factor sign-in was reset.
          </p>
        )}
        {twoFactorUsers.isError ? (
          <p role="alert" className="text-sm text-red-600">
            {twoFactorUsers.error?.response?.status === 403
              ? 'Only company admins can see this.'
              : 'Could not load two-factor status.'}
          </p>
        ) : (
          <StaffTwoFactorList
            users={twoFactorUsers.data || []}
            currentUserId={me.data?.id}
            onReset={resetTwoFactor.mutate}
            resetting={resetTwoFactor.isLoading}
          />
        )}
      </div>
    </section>
  );
};

export default TeamPage;

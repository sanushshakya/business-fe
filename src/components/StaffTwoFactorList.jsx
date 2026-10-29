// src/components/StaffTwoFactorList.jsx

import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';

/**
 * Admin view of who has two-factor sign-in on. "Reset 2FA" (for someone who lost their phone) needs a second
 * click; it removes their authenticator and signs them out, and they set it up again next time they sign in.
 *
 * @param {{id: number, email: string, name: string, is_staff: boolean, two_factor_enabled: boolean}[]} users
 * @param {number} currentUserId   you cannot reset your own
 * @param {(user: object) => void} onReset
 */
const StaffTwoFactorList = ({ users = [], currentUserId, onReset, resetting = false }) => {
  const [confirming, setConfirming] = React.useState(null);

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Person</Th>
          <Th>Two-factor</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {users.map((user) => (
          <Tr key={user.id}>
            <Td>
              <span>{user.email}</span>
              {user.name && <span className="ml-2 text-gray-500">{user.name}</span>}
              {user.is_staff && (
                <Badge color="blue" className="ml-2">
                  Admin
                </Badge>
              )}
            </Td>
            <Td>
              <Badge color={user.two_factor_enabled ? 'green' : 'gray'}>{user.two_factor_enabled ? 'On' : 'Off'}</Badge>
            </Td>
            <Td className="text-right">
              {user.two_factor_enabled &&
                user.id !== currentUserId &&
                (confirming === user.id ? (
                  <span className="inline-flex gap-2">
                    <Button
                      variant="danger"
                      disabled={resetting}
                      onClick={() => {
                        setConfirming(null);
                        onReset(user);
                      }}
                    >
                      Confirm reset
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirming(null)}>
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirming(user.id)}>
                    Reset 2FA
                  </Button>
                ))}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default StaffTwoFactorList;

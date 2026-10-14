import React from 'react';
import { Badge, Button, Form, Input, Modal, Option, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { ROLES } from '../roles';

/**
 * Admin view of operators (till, demand, freight, supplier, stock). Codes are shown once, in a dialog, when an operator is created or a code is
 * reset: the server keeps only a hash, so there is nothing to look up later.
 *
 * @param {{id: number, name: string, role: string, is_active: boolean, last_login: string|null}[]} users
 * @param {({name, role}) => Promise} onCreate
 * @param {(user: object, role: string) => void} onChangeRole
 * @param {(user: object) => Promise} onResetCode
 * @param {(user: object) => void} onToggleActive
 * @param {{name: string, code: string, reset?: boolean}|null} issued  the code to show now
 * @param {() => void} onDismissCode
 */
const OperatorsPanel = ({ users = [], onCreate, onResetCode, onToggleActive, onChangeRole, issued, onDismissCode }) => {
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('till');
  const [confirming, setConfirming] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await onCreate({ name: name.trim(), role });
    } catch {
      return; // the page shows the error; keep what was typed
    }
    setName('');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.code);
      setCopied(true);
    } catch {
      setCopied(false); // the code is on screen to copy by hand
    }
  };

  const close = () => {
    setCopied(false);
    onDismissCode();
  };

  return (
    <div className="space-y-4">
      <Form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 space-y-0">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="operatorName" className="mb-1 block text-sm font-medium">
            Operator name
          </label>
          <Input id="operatorName" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="w-48">
          <label htmlFor="operatorRole" className="mb-1 block text-sm font-medium">
            Role
          </label>
          <Select id="operatorRole" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <Option key={r.value} value={r.value}>
                {r.label}
              </Option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={!name.trim()}>
          Add operator
        </Button>
      </Form>

      {users.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last signed in</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>{user.name}</Td>
                <Td>
                  <Select
                    aria-label={`Role for ${user.name}`}
                    value={user.role}
                    onChange={(e) => onChangeRole(user, e.target.value)}
                    className="py-1"
                  >
                    {ROLES.map((r) => (
                      <Option key={r.value} value={r.value}>
                        {r.label}
                      </Option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  <Badge color={user.is_active ? 'green' : 'red'}>{user.is_active ? 'Active' : 'Off'}</Badge>
                </Td>
                <Td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-2">
                    {confirming === user.id ? (
                      <>
                        <Button
                          variant="danger"
                          className="px-2 py-1"
                          onClick={async () => {
                            setConfirming(null);
                            await onResetCode(user).catch(() => {});
                          }}
                        >
                          Confirm new code for {user.name}
                        </Button>
                        <Button variant="secondary" className="px-2 py-1" onClick={() => setConfirming(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          className="px-2 py-1"
                          aria-label={`Reset code for ${user.name}`}
                          onClick={() => setConfirming(user.id)}
                        >
                          Reset code
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-2 py-1"
                          aria-label={`${user.is_active ? 'Deactivate' : 'Activate'} ${user.name}`}
                          onClick={() => onToggleActive(user)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={Boolean(issued)} onClose={close} title={issued?.reset ? 'New code' : 'Operator created'}>
        {issued && (
          <div className="space-y-3 text-sm">
            <p>
              Sign-in code for <strong>{issued.name}</strong>:
            </p>
            <p
              className="rounded-md bg-gray-100 py-3 text-center font-mono text-3xl tracking-[0.4em]"
              data-testid="issued-code"
            >
              {issued.code}
            </p>
            <p className="text-gray-600">
              Write it down and give it to {issued.name} now. It is not stored, so it cannot be shown again
              {issued.reset ? '; the old code no longer works' : ''}.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={copy}>
                {copied ? 'Copied' : 'Copy code'}
              </Button>
              <Button onClick={close}>I have noted it</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OperatorsPanel;

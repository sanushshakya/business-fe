import React from 'react';
import { Button, Form, Input } from '@/components/ui';

/**
 * Invites a user by email into a named group; matches POST /auth/invitations/.
 */
const InviteUserForm = ({ onSubmit, submitting = false }) => {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({ invited_email: email, role });
    } catch {
      return; // the page shows the error; keep what was typed
    }
    setEmail('');
    setRole('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="inviteEmail" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <Input id="inviteEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="inviteRole" className="mb-1 block text-sm font-medium">
          Role
        </label>
        <Input id="inviteRole" value={role} onChange={(e) => setRole(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting}>
        Invite user
      </Button>
    </Form>
  );
};

export default InviteUserForm;

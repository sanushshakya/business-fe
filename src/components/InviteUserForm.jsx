// src/components/InviteUserForm.jsx

import React, { useState } from 'react';
import { Button, Form, Input } from 'shadcn/ui';

/**
 * InviteUserForm component to open a form for inviting users with email, role, and branch information.
 *
 * @returns {React.FC} - The InviteUserForm component
 */
const InviteUserForm = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [branch, setBranch] = useState('');

  /**
   * Handles form submission to invite a user.
   *
   * @param {Event} event - The form submission event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    // Add logic here to handle the form submission, e.g., sending an invitation email
    console.log('Inviting user:', email, role, branch);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <Input type="text" id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
      </div>
      <div className="mb-4">
        <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
          Branch
        </label>
        <Input type="text" id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} required />
      </div>
      <Button type="submit">Invite User</Button>
    </Form>
  );
};

export default InviteUserForm;
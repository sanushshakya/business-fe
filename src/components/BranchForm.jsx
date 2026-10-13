import React from 'react';
import { Button, Form, Input } from '@/components/ui';

/**
 * Collects a branch name and address and hands them to `onSubmit({name, address})`.
 */
const BranchForm = ({ onSubmit, submitting = false }) => {
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({ name: name.trim(), address: address.trim() });
    } catch {
      return; // the page shows the error; keep what was typed
    }
    setName('');
    setAddress('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="branchName" className="mb-1 block text-sm font-medium">
          Branch name
        </label>
        <Input id="branchName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="branchAddress" className="mb-1 block text-sm font-medium">
          Address
        </label>
        <Input id="branchAddress" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting}>
        Add branch
      </Button>
    </Form>
  );
};

export default BranchForm;

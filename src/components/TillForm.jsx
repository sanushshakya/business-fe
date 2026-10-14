import React from 'react';
import { Button, Form, Input, Option, Select } from '@/components/ui';

/**
 * Adds a till to a branch: `onSubmit({branch, number, device_id})`. `branches` are `{id, name}`.
 */
const TillForm = ({ branches = [], onSubmit, submitting = false }) => {
  const [branch, setBranch] = React.useState('');
  const [number, setNumber] = React.useState('');
  const [deviceId, setDeviceId] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({ branch: Number(branch), number: Number(number), device_id: deviceId.trim() });
    } catch {
      return; // the page shows the error; keep what was typed
    }
    setNumber('');
    setDeviceId('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="tillBranch" className="mb-1 block text-sm font-medium">
          Branch
        </label>
        <Select id="tillBranch" value={branch} onChange={(e) => setBranch(e.target.value)} required>
          <Option value="">Choose a branch…</Option>
          {branches.map((b) => (
            <Option key={b.id} value={b.id}>
              {b.name}
            </Option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="tillNumber" className="mb-1 block text-sm font-medium">
          Till number
        </label>
        <Input
          id="tillNumber"
          type="number"
          min="1"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="tillDevice" className="mb-1 block text-sm font-medium">
          Device ID
        </label>
        <Input id="tillDevice" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting}>
        Add till
      </Button>
    </Form>
  );
};

export default TillForm;

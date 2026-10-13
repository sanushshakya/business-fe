import React from 'react';
import { Button, Form, Input } from '@/components/ui';

/**
 * Edits the company name and address (the registration number is read-only on the backend).
 */
const CompanyProfileForm = ({ company, onSubmit, submitting = false }) => {
  const [name, setName] = React.useState(company?.name ?? '');
  const [address, setAddress] = React.useState(company?.address ?? '');

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, address });
      }}
    >
      <div>
        <label htmlFor="companyName" className="mb-1 block text-sm font-medium">
          Company name
        </label>
        <Input id="companyName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="registrationNumber" className="mb-1 block text-sm font-medium">
          Registration number
        </label>
        <Input id="registrationNumber" value={company?.registration_number ?? ''} readOnly disabled />
      </div>
      <div>
        <label htmlFor="companyAddress" className="mb-1 block text-sm font-medium">
          Address
        </label>
        <Input id="companyAddress" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting}>
        Save
      </Button>
    </Form>
  );
};

export default CompanyProfileForm;

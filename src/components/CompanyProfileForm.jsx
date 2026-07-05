import React from 'react';
import { Form, Input, Button } from 'shadcn/ui';

/**
 * CompanyProfileForm component for capturing company profile details (name, registration number, address).
 *
 * @returns {React.FC} - The CompanyProfileForm component
 */
const CompanyProfileForm: React.FC = () => {
  // State to hold the form values
  const [companyName, setCompanyName] = React.useState('');
  const [registrationNumber, setRegistrationNumber] = React.useState('');
  const [address, setAddress] = React.useState('');

  /**
   * Handle form submission.
   *
   * @param {React.FormEvent} event - The form submission event
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Logic to submit the company profile data
    console.log('Company Name:', companyName);
    console.log('Registration Number:', registrationNumber);
    console.log('Address:', address);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Registration Number"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <Button type="submit">Submit</Button>
      </div>
    </Form>
  );
};

export default CompanyProfileForm;
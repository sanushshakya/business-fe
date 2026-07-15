import React from 'react';
import { Button, Form, Input, Select } from 'shadcn/ui';
import useTeamData from '../hooks/useTeamData';

/**
 * OnboardingCompleteForm component to handle the completion of onboarding process.
 *
 * @returns {React.FC} - The OnboardingCompleteForm component
 */
const OnboardingCompleteForm: React.FC = () => {
  const { userData, updateUserData } = useTeamData();
  const [form, setForm] = React.useState({
    name: userData.name,
    email: userData.email,
    role: userData.role,
  });

  /**
   * Handle form change.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} event - The change event
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  /**
   * Handle form submission.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateUserData(form);
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
          Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your name"
          required
          className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">
          Role
        </label>
        <Select id="role" name="role" value={form.role} onChange={handleChange}>
          <option disabled value="">
            Select your role
          </option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </Select>
      </div>
      <Button type="submit" className="mt-4">
        Complete Onboarding
      </Button>
    </Form>
  );
};

export default OnboardingCompleteForm;
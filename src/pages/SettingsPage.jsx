import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import CompanyProfileForm from '../components/CompanyProfileForm';
import { Skeleton } from '@/components/ui';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const company = useQuery({ queryKey: ['company'], queryFn: async () => (await axios.get('/tenants/company/')).data });
  const save = useMutation({
    mutationFn: (payload) => axios.patch('/tenants/company/', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] }),
  });

  return (
    <section className="max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Company profile</h2>
      {company.isLoading && <Skeleton className="h-32 w-full" />}
      {company.isError && (
        <p role="alert" className="text-sm text-red-600">
          Could not load the company profile.
        </p>
      )}
      {company.data && (
        <CompanyProfileForm
          key={company.data.id}
          company={company.data}
          submitting={save.isLoading}
          onSubmit={(payload) => save.mutate(payload)}
        />
      )}
      {save.isSuccess && (
        <p role="status" className="text-sm text-green-700">
          Saved.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="text-sm text-red-600">
          Could not save changes.
        </p>
      )}
    </section>
  );
};

export default SettingsPage;

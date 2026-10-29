import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import CompanyProfileForm from '../components/CompanyProfileForm';
import TwoFactorPanel from '../components/TwoFactorPanel';
import { ME_KEY } from '../hooks/useMe';
import { confirmEnrolment, startEnrolment } from '../services/authService';
import { Skeleton } from '@/components/ui';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const company = useQuery({ queryKey: ['company'], queryFn: async () => (await axios.get('/tenants/company/')).data });
  const save = useMutation({
    mutationFn: (payload) => axios.patch('/tenants/company/', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] }),
  });
  const twoFactor = useQuery({
    queryKey: ['two-factor'],
    queryFn: async () => (await axios.get('/auth/2fa/')).data,
  });
  const twoFactorChanged = () => {
    queryClient.invalidateQueries({ queryKey: ['two-factor'] });
    queryClient.invalidateQueries({ queryKey: ME_KEY });
  };

  return (
    <div className="space-y-8">
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
      {twoFactor.data && (
        <TwoFactorPanel
          status={twoFactor.data}
          start={() => startEnrolment()}
          confirm={(code) => confirmEnrolment(code)}
          disable={(code) => axios.post('/auth/2fa/disable/', { code })}
          onChanged={twoFactorChanged}
        />
      )}
    </div>
  );
};

export default SettingsPage;

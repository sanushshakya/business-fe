import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import BranchForm from '../components/BranchForm';
import BranchList from '../components/BranchList';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';

const BranchesPage = () => {
  const queryClient = useQueryClient();
  const branches = useApiList('/tenants/branches/');
  const tills = useApiList('/tenants/tills/');
  const create = useMutation({
    mutationFn: (payload) => axios.post('/tenants/branches/', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', '/tenants/branches/'] }),
  });

  const tillsByBranch = {};
  for (const till of tills.data || []) (tillsByBranch[till.branch] ||= []).push(till);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Branches</h2>
      <BranchForm onSubmit={create.mutateAsync} submitting={create.isLoading} />
      {create.isError && (
        <p role="alert" className="text-sm text-red-600">
          {create.error?.response?.status === 403
            ? 'Only company staff can add branches.'
            : 'Could not add the branch.'}
        </p>
      )}
      <QueryState query={branches} emptyMessage="No branches yet.">
        {(items) => <BranchList branches={items} tillsByBranch={tillsByBranch} />}
      </QueryState>
    </section>
  );
};

export default BranchesPage;

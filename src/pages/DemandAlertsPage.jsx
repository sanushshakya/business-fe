import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import DemandAlert from '../components/DemandAlert';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';

const URL = '/common/api/alerts/demand/';

const DemandAlertsPage = () => {
  const queryClient = useQueryClient();
  const alerts = useApiList(URL);
  const dismiss = useMutation({
    mutationFn: (alert) => axios.post(`${URL}dismiss/${alert.id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', URL] }),
  });

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Demand alerts</h2>
      {dismiss.isError && (
        <p role="alert" className="mb-2 text-sm text-red-600">
          Could not dismiss the alert. Please try again.
        </p>
      )}
      <QueryState query={alerts} emptyMessage="No open demand alerts.">
        {(items) => items.map((alert) => <DemandAlert key={alert.id} alert={alert} onDismiss={dismiss.mutate} />)}
      </QueryState>
    </section>
  );
};

export default DemandAlertsPage;

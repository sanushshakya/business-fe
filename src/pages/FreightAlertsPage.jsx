import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import FreightAlert from '../components/FreightAlert';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';

const URL = '/logistics/freight-alerts/';

const FreightAlertsPage = () => {
  const queryClient = useQueryClient();
  const alerts = useApiList(URL);
  const dismiss = useMutation({
    mutationFn: (alert) => axios.post(`${URL}${alert.id}/dismiss/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list', URL] }),
  });

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Freight alerts</h2>
      <QueryState query={alerts} emptyMessage="No freight rate alerts.">
        {(items) =>
          items
            .filter((a) => !a.is_dismissed)
            .map((alert) => <FreightAlert key={alert.id} alert={alert} onDismiss={dismiss.mutate} />)
        }
      </QueryState>
    </section>
  );
};

export default FreightAlertsPage;

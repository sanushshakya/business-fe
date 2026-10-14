import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { formatMoney } from '../utils/money';
import { Badge, Button, Form, Input, Option, Select, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import KPICard from '../components/KPICard';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';
import FreightAlertsPage from './FreightAlertsPage';

const STATUSES = ['Pending', 'In Transit', 'Delivered'];
const STATUS_COLORS = { Pending: 'yellow', 'In Transit': 'blue', Delivered: 'green' };
const PROVIDERS = '/logistics/providers/';
const DELIVERIES = '/logistics/deliveries/';

/**
 * The freight manager's view: rate alerts, delivery progress, carriers and the rate tracked for each lane.
 */
const FreightPovPage = () => {
  const queryClient = useQueryClient();
  const alerts = useApiList('/logistics/freight-alerts/');
  const providers = useApiList(PROVIDERS);
  const deliveries = useApiList(DELIVERIES);
  const rates = useApiList('/logistics/freight-rates/');
  const refresh = (url) => () => queryClient.invalidateQueries({ queryKey: ['list', url] });

  const addProvider = useMutation({
    mutationFn: (payload) => axios.post(PROVIDERS, payload),
    onSuccess: refresh(PROVIDERS),
  });
  const addDelivery = useMutation({
    mutationFn: (payload) => axios.post(DELIVERIES, payload),
    onSuccess: refresh(DELIVERIES),
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => axios.patch(`${DELIVERIES}${id}/`, { status }),
    onSuccess: refresh(DELIVERIES),
  });

  const [provider, setProvider] = React.useState({ name: '', address: '', phone_number: '' });
  const [delivery, setDelivery] = React.useState({ provider: '', shipment_date: '' });
  const providerNames = new Map((providers.data || []).map((p) => [p.id, p.name]));
  const inProgress = (deliveries.data || []).filter((d) => d.status !== 'Delivered').length;
  const activeAlerts = (alerts.data || []).filter((a) => !a.is_dismissed).length;
  const failed = [addProvider, addDelivery, setStatus].find((m) => m.isError);

  const submitProvider = async (event) => {
    event.preventDefault();
    try {
      await addProvider.mutateAsync(provider);
    } catch {
      return; // shown below; keep what was typed
    }
    setProvider({ name: '', address: '', phone_number: '' });
  };

  const submitDelivery = async (event) => {
    event.preventDefault();
    try {
      await addDelivery.mutateAsync({ provider: Number(delivery.provider), shipment_date: delivery.shipment_date });
    } catch {
      return;
    }
    setDelivery({ provider: '', shipment_date: '' });
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Freight overview</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Rate alerts" value={alerts.isSuccess ? activeAlerts : '—'} />
        <KPICard title="Deliveries in progress" value={deliveries.isSuccess ? inProgress : '—'} />
        <KPICard title="Carriers" value={providers.data?.length ?? '—'} />
        <KPICard title="Lanes tracked" value={rates.data?.length ?? '—'} />
      </div>
      {failed && (
        <p role="alert" className="text-sm text-red-600">
          {apiErrorMessage(failed.error, 'Could not save that.')}
        </p>
      )}

      <div>
        <h3 className="mb-2 font-semibold">Deliveries</h3>
        <Form onSubmit={submitDelivery} className="mb-3 flex flex-wrap items-end gap-2 space-y-0">
          <div className="w-52">
            <label htmlFor="deliveryProvider" className="mb-1 block text-sm font-medium">
              Carrier
            </label>
            <Select
              id="deliveryProvider"
              value={delivery.provider}
              onChange={(e) => setDelivery({ ...delivery, provider: e.target.value })}
              required
            >
              <Option value="">Choose…</Option>
              {(providers.data || []).map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="shipmentDate" className="mb-1 block text-sm font-medium">
              Shipment date
            </label>
            <Input
              id="shipmentDate"
              type="date"
              value={delivery.shipment_date}
              onChange={(e) => setDelivery({ ...delivery, shipment_date: e.target.value })}
              required
            />
          </div>
          <Button type="submit">Add delivery</Button>
        </Form>
        <QueryState query={deliveries} emptyMessage="No deliveries yet.">
          {(items) => (
            <Table>
              <Thead>
                <Tr>
                  <Th>Carrier</Th>
                  <Th>Shipment date</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((d) => (
                  <Tr key={d.id}>
                    <Td>{providerNames.get(d.provider) ?? `Carrier #${d.provider}`}</Td>
                    <Td>{new Date(d.shipment_date).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Badge color={STATUS_COLORS[d.status] || 'gray'}>{d.status}</Badge>
                        <Select
                          aria-label={`Status of delivery ${d.id}`}
                          value={d.status}
                          onChange={(e) => setStatus.mutate({ id: d.id, status: e.target.value })}
                          className="w-36 py-1"
                        >
                          {STATUSES.map((status) => (
                            <Option key={status} value={status}>
                              {status}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </QueryState>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold">Carriers</h3>
          <Form onSubmit={submitProvider} className="mb-3 space-y-2">
            <Input
              aria-label="Carrier name"
              placeholder="Name"
              value={provider.name}
              onChange={(e) => setProvider({ ...provider, name: e.target.value })}
              required
            />
            <Input
              aria-label="Carrier address"
              placeholder="Address"
              value={provider.address}
              onChange={(e) => setProvider({ ...provider, address: e.target.value })}
              required
            />
            <Input
              aria-label="Carrier phone"
              placeholder="Phone"
              value={provider.phone_number}
              onChange={(e) => setProvider({ ...provider, phone_number: e.target.value })}
              required
            />
            <Button type="submit">Add carrier</Button>
          </Form>
          <QueryState query={providers} emptyMessage="No carriers yet.">
            {(items) => (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Phone</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((p) => (
                    <Tr key={p.id}>
                      <Td>{p.name}</Td>
                      <Td>{p.phone_number}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </QueryState>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Current rates</h3>
          <QueryState query={rates} emptyMessage="No rates tracked yet.">
            {(items) => (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Service</Th>
                    <Th>Rate</Th>
                    <Th>Updated</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((r) => (
                    <Tr key={r.id}>
                      <Td>{r.service_code}</Td>
                      <Td>
                        {r.currency === 'GBP' ? formatMoney(r.rate) : `${Number(r.rate).toFixed(2)} ${r.currency}`}
                      </Td>
                      <Td>{new Date(r.last_updated).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </QueryState>
        </div>
      </div>

      <FreightAlertsPage />
    </section>
  );
};

export default FreightPovPage;

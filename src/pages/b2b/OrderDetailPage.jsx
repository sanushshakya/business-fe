import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Input } from '@/components/ui';
import axios from '../../utils/axios';
import { apiErrorMessage } from '../../utils/http';
import { formatMoney } from '../../utils/money';
import { openPdf } from '../../utils/pdf';
import OrderLines from '../../components/b2b/OrderLines';
import OrderInvoice from '../../components/b2b/OrderInvoice';
import ReturnForm from '../../components/b2b/ReturnForm';

const CANCELLABLE = ['draft', 'confirmed', 'picking'];
const HOLDING = ['confirmed', 'picking'];
const AFTER_PICK = ['picked', 'dispatched', 'delivered', 'invoiced'];
const RETURNABLE = ['delivered', 'invoiced'];

/** One trade order (G40–G45): its lines and the steps staff take from here — confirm, allocate, cancel,
 * invoice, returns and credit notes. */
const OrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const url = `/wholesale/orders/${id}/`;
  const order = useQuery({ queryKey: ['order', id], queryFn: () => axios.get(url).then(({ data }) => data) });
  const invoice = useQuery({
    queryKey: ['list', '/wholesale/invoices/', 'order', id],
    queryFn: () =>
      axios.get('/wholesale/invoices/', { params: { order: id } }).then(({ data }) => data.results[0] ?? null),
    enabled: AFTER_PICK.includes(order.data?.status),
  });
  const returns = useQuery({
    queryKey: ['list', '/wholesale/returns/', 'order', id],
    queryFn: () => axios.get('/wholesale/returns/', { params: { order: id } }).then(({ data }) => data.results),
    enabled: RETURNABLE.includes(order.data?.status),
  });
  const [error, setError] = React.useState(location.state?.message ?? null);
  const [reason, setReason] = React.useState('');
  const [cancelling, setCancelling] = React.useState(false);

  const step = useMutation({
    mutationFn: ({ path, body = {} }) => axios.post(path, body),
    onSuccess: () => {
      setError(null);
      setCancelling(false);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'That did not work.')),
  });
  const run = (path, body) => step.mutateAsync({ path, body }).catch(() => {});

  if (order.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (order.isError)
    return (
      <p role="alert" className="text-sm text-red-600">
        Could not load the order.
      </p>
    );
  const data = order.data;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">
          {data.number_display} · {data.customer_code} {data.customer_name}
        </h2>
        <Badge color={data.status === 'cancelled' ? 'gray' : 'blue'}>{data.status}</Badge>
      </div>
      <Card className="space-y-1 p-4 text-sm">
        <p>
          Delivery {data.delivery_date} · {data.line1}, {data.town} {data.postcode}
          {data.customer_ref && ` · Ref ${data.customer_ref}`}
        </p>
        {data.off_delivery_day && (
          <p className="text-amber-700">The customer doesn&apos;t take deliveries on this day.</p>
        )}
        {data.is_short && <p className="text-red-600">Some lines are short at the warehouse.</p>}
        {data.estimated_gross && (
          <p>
            Estimated {formatMoney(data.estimated_net)} + VAT {formatMoney(data.estimated_vat)} ={' '}
            {formatMoney(data.estimated_gross)}
          </p>
        )}
      </Card>
      <OrderLines lines={data.lines} />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {data.status === 'draft' && (
          <Button disabled={step.isLoading} onClick={() => run(`${url}confirm/`)}>
            Confirm
          </Button>
        )}
        {HOLDING.includes(data.status) && (
          <Button variant="secondary" disabled={step.isLoading} onClick={() => run(`${url}allocate/`)}>
            Allocate
          </Button>
        )}
        {CANCELLABLE.includes(data.status) && !cancelling && (
          <Button variant="secondary" onClick={() => setCancelling(true)}>
            Cancel order
          </Button>
        )}
      </div>
      {cancelling && (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(`${url}cancel/`, { reason });
          }}
        >
          <Input
            aria-label="Reason"
            placeholder="Why it is cancelled"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" variant="danger" disabled={!reason.trim() || step.isLoading}>
            Cancel the order
          </Button>
        </form>
      )}
      {AFTER_PICK.includes(data.status) && (
        <OrderInvoice
          invoice={invoice.data ?? null}
          busy={step.isLoading}
          onCreate={() => run('/wholesale/invoices/', { order: data.id })}
          onIssue={(target) => run(`/wholesale/invoices/${target.id}/issue/`)}
          onPdf={(target) =>
            openPdf(`/wholesale/invoices/${target.id}/pdf/`).catch((failure) =>
              setError(apiErrorMessage(failure, 'Could not open the invoice.'))
            )
          }
        />
      )}
      {RETURNABLE.includes(data.status) && (
        <ReturnForm
          lines={data.lines.filter((line) => line.picked_quantity || Number(line.picked_weight_kg))}
          returns={returns.data ?? []}
          busy={step.isLoading}
          onSubmit={(body) =>
            axios.post(`${url}returns/`, body).then(() => queryClient.invalidateQueries({ queryKey: ['list'] }))
          }
          onCredit={(customerReturn) => run('/wholesale/credit-notes/', { customer_return: customerReturn.id })}
        />
      )}
    </section>
  );
};

export default OrderDetailPage;

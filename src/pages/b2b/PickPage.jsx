import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import axios from '../../utils/axios';
import { apiErrorMessage } from '../../utils/http';
import { openPdf } from '../../utils/pdf';
import PickScreen from '../../components/b2b/PickScreen';
import useApiList from '../../hooks/useApiList';
import useMe from '../../hooks/useMe';

/** Picking one order on a tablet (G46b, over G42): start, scan, swap, finish; the pick list PDF. */
const PickPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const base = `/wholesale/orders/${id}/`;
  const order = useQuery({ queryKey: ['order', id], queryFn: () => axios.get(base).then(({ data }) => data) });
  const products = useApiList('/inventory/products/');
  const me = useMe();
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const call = async (request, fallback) => {
    setBusy(true);
    try {
      await request();
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['order', id] });
    } catch (failure) {
      setError(apiErrorMessage(failure, fallback));
      throw failure;
    } finally {
      setBusy(false);
    }
  };
  const quietly = (promise) => promise.catch(() => {});

  if (order.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (order.isError) return <p role="alert" className="text-sm text-red-600">Could not load the order.</p>;
  const data = order.data;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">
          {data.number_display} · {data.customer_name}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              openPdf(`${base}pick-list/`).catch((failure) => setError(apiErrorMessage(failure, 'Could not open it.')))
            }
          >
            Pick list
          </Button>
          {data.status === 'confirmed' && (
            <Button disabled={busy} onClick={() => quietly(call(() => axios.post(`${base}start-pick/`, {}), 'Could not start.'))}>
              Start picking
            </Button>
          )}
          {data.status === 'picking' && (
            <Button disabled={busy} onClick={() => quietly(call(() => axios.post(`${base}finish-pick/`, {}), 'Could not finish.'))}>
              Finish picking
            </Button>
          )}
        </div>
      </div>
      {data.status === 'picking' ? (
        <PickScreen
          order={data}
          products={products.data ?? []}
          isStaff={Boolean(me.data?.is_staff)}
          busy={busy}
          error={error}
          onScan={(body) => call(() => axios.post(`${base}picks/`, body), 'That scan was not taken.')}
          onRemove={(pick) => quietly(call(() => axios.delete(`${base}picks/${pick.id}/`), 'Could not remove it.'))}
          onPropose={(body) => call(() => axios.post(`${base}substitutions/`, body), 'Could not propose the swap.')}
          onDecide={(line, approve) =>
            quietly(
              call(
                () => axios.post(`${base}substitutions/${line.id}/${approve ? 'approve' : 'reject'}/`, {}),
                'Could not decide the swap.'
              )
            )
          }
        />
      ) : (
        <>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <p className="text-sm text-gray-600">
            {data.status === 'confirmed' ? 'Start picking to scan.' : `This order is ${data.status}.`}
          </p>
        </>
      )}
    </section>
  );
};

export default PickPage;

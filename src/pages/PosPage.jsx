import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import axios from '../utils/axios';
import { apiErrorMessage } from '../utils/http';
import { formatMoney } from '../utils/money';
import { Button, Card, Modal } from '@/components/ui';
import Cart from '../components/pos/Cart';
import CashUpForm from '../components/pos/CashUpForm';
import OpenTillForm from '../components/pos/OpenTillForm';
import PaymentPanel from '../components/pos/PaymentPanel';
import ProductPicker from '../components/pos/ProductPicker';
import Receipt from '../components/pos/Receipt';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';
import useCart from '../hooks/useCart';
import { useOffline } from '../offline/OfflineProvider';

const SESSIONS = '/sales/sessions/';
const STORAGE_KEY = 'pos_till';

const readStoredTill = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const storeTill = (id) => {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // remembering the till is a convenience only
  }
};

const PosPage = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useOffline();
  const cart = useCart();
  const attempt = React.useRef(null);
  const [tillId, setTillId] = React.useState(readStoredTill);
  const [receipt, setReceipt] = React.useState(null);
  const [cashUpOpen, setCashUpOpen] = React.useState(false);
  const [closed, setClosed] = React.useState(null);

  const tills = useApiList('/tenants/tills/');
  const branches = useApiList('/tenants/branches/');
  const products = useApiList('/inventory/products/');

  const branchNames = Object.fromEntries((branches.data || []).map((b) => [b.id, b.name]));
  const tillOptions = (tills.data || [])
    .filter((t) => t.is_active)
    .map((t) => ({ id: t.id, label: `${branchNames[t.branch] ?? 'Branch'} – Till ${t.number}` }));
  const till = tillOptions.some((t) => String(t.id) === String(tillId)) ? String(tillId) : '';

  const chooseTill = (id) => {
    setTillId(id);
    storeTill(id);
  };

  const session = useQuery({
    queryKey: ['list', SESSIONS, 'open-for', till],
    enabled: Boolean(till),
    queryFn: async () => {
      const { data } = await axios.get(SESSIONS, { params: { till, status: 'open' } });
      return data.results[0] ?? null;
    },
  });
  const current = session.data;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['list', SESSIONS] });
    queryClient.invalidateQueries({ queryKey: ['list', '/sales/sales/'] });
    queryClient.invalidateQueries({ queryKey: ['list', '/inventory/products/'] });
  };

  const open = useMutation({
    mutationFn: (payload) => axios.post(SESSIONS, payload).then((r) => r.data),
    onSuccess: refresh,
  });

  const sell = useMutation({
    mutationFn: (payload) => axios.post('/sales/sales/', payload).then((r) => r.data),
    onSuccess: (sale) => {
      setReceipt(sale);
      cart.clear();
      attempt.current = null;
      refresh();
    },
    onError: (error) => {
      // Stock or the session moved under us: show the truth before the next attempt.
      if (error?.response?.status === 400) refresh();
    },
  });

  const closeSession = useMutation({
    mutationFn: ({ id, ...payload }) => axios.post(`${SESSIONS}${id}/close/`, payload).then((r) => r.data),
    onSuccess: (data) => {
      setClosed(data);
      setCashUpOpen(false);
      cart.clear();
      refresh();
    },
  });

  // A failed charge stays on screen only until the basket changes.
  const { reset: resetSale } = sell;
  React.useEffect(() => {
    resetSale();
  }, [cart.lines, resetSale]);

  const charge = (payment) => {
    const body = {
      session: current.id,
      items: cart.lines.map((l) => ({ product: l.product, quantity: l.quantity })),
      ...payment,
    };
    // The same basket and payment keeps its reference, so resending after a lost response cannot charge twice.
    const key = JSON.stringify(body);
    if (attempt.current?.key !== key) attempt.current = { key, ref: uuidv4() };
    sell.mutate({ ...body, client_ref: attempt.current.ref });
  };

  const tillSelector = (
    <QueryState
      query={tills}
      emptyMessage="No tills yet. A staff member can add one under Branches."
      empty={<p className="text-sm text-gray-500">No tills yet. A staff member can add one under Branches.</p>}
    >
      {() =>
        tillOptions.length === 0 ? (
          <p className="text-sm text-gray-500">All tills are inactive. A staff member can activate one.</p>
        ) : (
          <OpenTillForm
            tills={tillOptions}
            till={till}
            onTillChange={chooseTill}
            onOpen={open.mutate}
            submitting={open.isLoading}
          />
        )
      }
    </QueryState>
  );

  let body;
  if (!current) {
    body = (
      <Card className="max-w-md space-y-4">
        <h3 className="font-semibold">Open a till</h3>
        {session.isError && (
          <p role="alert" className="text-sm text-red-600">
            {apiErrorMessage(session.error, 'Could not check this till.')}
          </p>
        )}
        {till && session.isLoading ? <p className="text-sm text-gray-500">Checking till…</p> : tillSelector}
        {open.isError && (
          <p role="alert" className="text-sm text-red-600">
            {apiErrorMessage(open.error, 'Could not open the till.')}
          </p>
        )}
      </Card>
    );
  } else {
    const { summary } = current;
    body = (
      <div className="space-y-4">
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold">
              {current.branch_name} – Till {current.till_number}
            </p>
            <p className="text-gray-600">
              Open since {new Date(current.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by{' '}
              {current.opened_by_email} · float {formatMoney(current.opening_float)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              {summary.sales_count} sale{summary.sales_count === 1 ? '' : 's'} · {formatMoney(summary.sales_total)}
            </span>
            <Button variant="secondary" onClick={() => setCashUpOpen(true)}>
              Close till
            </Button>
          </div>
        </Card>

        {!isOnline && (
          <p role="alert" className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            You are offline. Sales need a connection to the server, so charging is paused until you are back online.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2" aria-label="Products">
            <QueryState query={products} emptyMessage="No products yet. Add some under Inventory.">
              {(items) => <ProductPicker products={items} onAdd={cart.add} />}
            </QueryState>
          </section>
          <Card className="space-y-4 self-start" aria-label="Basket">
            <h3 className="font-semibold">Basket</h3>
            <Cart
              lines={cart.lines}
              totalCents={cart.totalCents}
              onQuantity={cart.setQuantity}
              onRemove={cart.remove}
            />
            {cart.lines.length > 0 && (
              <Button variant="secondary" className="w-full" onClick={cart.clear}>
                Clear basket
              </Button>
            )}
            <PaymentPanel
              totalCents={cart.totalCents}
              onCharge={charge}
              submitting={sell.isLoading}
              disabled={!isOnline}
            />
            {sell.isError && (
              <p role="alert" className="text-sm text-red-600">
                {apiErrorMessage(sell.error, 'Could not complete the sale. Check the connection and try again.')}
              </p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Till</h2>
      {body}

      <Modal open={Boolean(receipt)} onClose={() => setReceipt(null)} title="Sale complete">
        {receipt && (
          <>
            <Receipt sale={receipt} />
            <Button className="mt-3 w-full" onClick={() => setReceipt(null)}>
              New sale
            </Button>
          </>
        )}
      </Modal>

      <Modal open={cashUpOpen} onClose={() => setCashUpOpen(false)} title="Close till">
        {current && (
          <>
            <CashUpForm
              session={current}
              onSubmit={(payload) => closeSession.mutate({ id: current.id, ...payload })}
              submitting={closeSession.isLoading}
            />
            {closeSession.isError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {apiErrorMessage(closeSession.error, 'Could not close the till.')}
              </p>
            )}
          </>
        )}
      </Modal>

      <Modal open={Boolean(closed)} onClose={() => setClosed(null)} title="Till closed">
        {closed && (
          <div className="space-y-2 text-sm">
            <p>
              {closed.branch_name} – Till {closed.till_number}
            </p>
            <p>
              Expected {formatMoney(closed.expected_cash)}, counted {formatMoney(closed.counted_cash)}.
            </p>
            <p className="font-semibold" data-testid="closed-variance">
              {Number(closed.summary.variance) === 0
                ? 'Drawer balanced.'
                : `${Number(closed.summary.variance) > 0 ? 'Over' : 'Short'} by ${formatMoney(Math.abs(closed.summary.variance))}.`}
            </p>
            <p>
              {closed.summary.sales_count} sale{closed.summary.sales_count === 1 ? '' : 's'},{' '}
              {formatMoney(closed.summary.sales_total)} taken (cash {formatMoney(closed.summary.cash_total)}, card{' '}
              {formatMoney(closed.summary.card_total)}).
            </p>
            <Button className="mt-2" onClick={() => setClosed(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default PosPage;

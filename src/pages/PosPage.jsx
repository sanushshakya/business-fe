import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import axios from '../utils/axios';
import { apiErrorMessage, isRejection } from '../utils/http';
import { formatMoney, varianceText } from '../utils/money';
import { Button, Card, Modal } from '@/components/ui';
import Cart from '../components/pos/Cart';
import CashUpForm from '../components/pos/CashUpForm';
import LoyaltyCard from '../components/pos/LoyaltyCard';
import OpenTillForm from '../components/pos/OpenTillForm';
import PaymentPanel from '../components/pos/PaymentPanel';
import ProductPicker from '../components/pos/ProductPicker';
import Receipt from '../components/pos/Receipt';
import WeightEntry from '../components/pos/WeightEntry';
import QueryState from '../components/QueryState';
import useCart from '../hooks/useCart';
import useMe from '../hooks/useMe';
import useOfflineSales from '../hooks/useOfflineSales';
import useTillCatalogue from '../hooks/useTillCatalogue';
import CacheAge from '../components/pos/CacheAge';
import OfflineBanner from '../components/pos/OfflineBanner';
import OfflineQueue from '../components/pos/OfflineQueue';
import { askPersistentStorage, branchPrefix } from '../offline/salesQueue';
import useAuthStore from '../stores/authStore';
import { tokenUserId } from '../utils/jwt';
import { offlineReceipt } from '../utils/offlineReceipt';
import { readScan } from '../utils/barcodes';
import { ukToday } from '../utils/dateUtils';
import { useOffline } from '../offline/OfflineProvider';

const SESSIONS = '/sales/sessions/';
const HOUR_MS = 3_600_000;
const LOOKUP = '/sync/loyalty/lookup/';

// What the card box says about a lookup. Only a found card is sent with the charge; anything else sells without points.
const loyaltyStatus = (lookup, card) => {
  if (card) return 'found';
  if (lookup.isLoading) return 'loading';
  if (!lookup.isError) return 'idle';
  const status = lookup.error?.response?.status;
  if (status === 404) return 'not_found';
  if (status === 400 || status === 409) return 'error';
  return 'unavailable';
};
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

// What the till keeps of an open session for when the server can't be reached: no staff names or emails.
const sessionCopy = (found) =>
  found && {
    id: found.id,
    till: found.till,
    till_number: found.till_number,
    branch_name: found.branch_name,
    opened_at: found.opened_at,
    opening_float: found.opening_float,
    summary: found.summary,
  };

// What Charge sends for a basket line: a label as its raw barcode, a typed weight as the product and its kg (and
// pieces for catch-weight), anything else as the product and quantity. The server prices all of them.
const chargeLine = (line) => {
  if (line.barcode) return { barcode: line.barcode };
  if (line.manual)
    return { product: line.product, weight_kg: line.weightKg, ...(line.pieces ? { quantity: line.pieces } : {}) };
  return { product: line.product, quantity: line.quantity };
};

const PosPage = () => {
  const queryClient = useQueryClient();
  const { isOnline, retryFailed, sending } = useOffline();
  const cart = useCart();
  const attempt = React.useRef(null);
  const [tillId, setTillId] = React.useState(readStoredTill);
  const [receipt, setReceipt] = React.useState(null);
  const [card, setCard] = React.useState(null); // {barcode, customer} once a lookup finds the card
  const [cashUpOpen, setCashUpOpen] = React.useState(false);
  const [closed, setClosed] = React.useState(null);
  const [scanProblem, setScanProblem] = React.useState('');
  const [weighing, setWeighing] = React.useState(null); // a weighed product with no label: the cashier types its kg
  // Products, rules and tills come from the till's own copy (G26), so it keeps finding and pricing while offline.
  const catalogue = useTillCatalogue();
  const { rules } = catalogue;
  const cashierId = tokenUserId(useAuthStore((state) => state.accessToken));
  const me = useMe(); // is_staff decides who may void offline sales (unknown offline: then only one's own)
  // Selling offline (G27, ADR 0001): the server could not be reached on the last charge, or the browser is offline.
  const [serverDown, setServerDown] = React.useState(false);
  const [offlineProblem, setOfflineProblem] = React.useState('');
  const [confirming, setConfirming] = React.useState(null); // a charge waiting for "keep selling offline?"
  const [confirmedAt, setConfirmedAt] = React.useState(null);
  const [storageWarning, setStorageWarning] = React.useState(false);
  const [scannedCard, setScannedCard] = React.useState(''); // the last card scanned, for when the lookup can't run
  const askedStorage = React.useRef(false);

  const branchNames = Object.fromEntries(catalogue.branches.map((b) => [b.id, b.name]));
  const tillOptions = catalogue.tills
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
      let found;
      try {
        const { data } = await axios.get(SESSIONS, { params: { till, status: 'open' } });
        found = data.results[0] ?? null;
      } catch (error) {
        // The server can't be reached: carry on with the session this till last saw open (ADR 0001).
        const cached = isRejection(error) ? undefined : await catalogue.readSession(till);
        if (cached === undefined) throw error;
        return cached && { ...cached, fromCache: true };
      }
      await Promise.resolve(catalogue.saveSession(till, sessionCopy(found))).catch(() => {}); // only a convenience
      setServerDown(false); // the server answered: charges go online again
      return found;
    },
    // A cached session is only the last known one: keep asking until the server answers again.
    refetchInterval: (data) => (data?.fromCache ? 30_000 : false),
  });
  const current = session.data;
  const offline = useOfflineSales(till);
  const sellingOffline = !isOnline || serverDown;

  // A refresh that reached the server again means charges can be tried online again.
  React.useEffect(() => {
    if (catalogue.refreshedAt && !catalogue.error) setServerDown(false);
  }, [catalogue.refreshedAt, catalogue.error]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['list', SESSIONS] });
    queryClient.invalidateQueries({ queryKey: ['list', '/sales/sales/'] });
    catalogue.refresh();
  };

  const open = useMutation({
    mutationFn: (payload) => axios.post(SESSIONS, payload).then((r) => r.data),
    onSuccess: refresh,
  });

  const lookup = useMutation({
    mutationFn: (barcode) => axios.post(LOOKUP, { barcode }).then((r) => r.data),
    onSuccess: (customer, barcode) => setCard({ barcode, customer }),
  });
  const { reset: resetLookup } = lookup;
  const clearCard = React.useCallback(() => {
    setCard(null);
    resetLookup();
  }, [resetLookup]);
  const scanCard = (barcode) => {
    setCard(null);
    setScannedCard(barcode);
    lookup.mutate(barcode);
  };

  // A scanned barcode or label: the line is shown from our own reading; the server reads the code again on Charge.
  const scanProduct = (code) => {
    if (inFlight.current || sell.isLoading) return; // the basket is locked while a charge waits for its answer
    const scan = readScan(code, { rules, products: catalogue.products, today: ukToday() });
    setScanProblem(scan.kind === 'error' ? scan.message : '');
    if (scan.kind === 'product') cart.add(scan.product, { unlimited: sellingOffline });
    if (scan.kind === 'label') cart.addLabel(scan);
  };

  const sell = useMutation({
    mutationFn: (payload) => axios.post('/sales/sales/', payload).then((r) => r.data),
    onSuccess: (sale, payload) => {
      setReceipt({ sale, loyalty: payload.loyalty_barcode ? (attempt.current?.customer ?? null) : null });
      cart.clear();
      setWeighing(null);
      clearCard();
      attempt.current = null;
      setServerDown(false);
      refresh();
    },
    onError: (error, payload) => {
      // Stock or the session moved under us: show the truth before the next attempt.
      if (error?.response?.status === 400) refresh();
      if (isRejection(error)) return;
      // No answer, a 5xx or a timeout: the server may not have it, so the sale is kept here with the same
      // client_ref (if it did arrive, sending it again later cannot book it twice). Card sales first need the
      // terminal's auth code, which the payment panel now asks for.
      setServerDown(true);
      // Only the attempt still on screen is kept offline, with the basket it was sent with.
      if (payload.payment_method === 'cash' && attempt.current?.ref === payload.client_ref)
        chargeOffline(payload, null, false, attempt.current.lines);
    },
  });

  const closeSession = useMutation({
    mutationFn: ({ id, ...payload }) => axios.post(`${SESSIONS}${id}/close/`, payload).then((r) => r.data),
    onSuccess: (data) => {
      setClosed(data);
      setCashUpOpen(false);
      cart.clear();
      setWeighing(null);
      clearCard();
      refresh();
    },
  });

  // A failed charge stays on screen only until the basket changes.
  const { reset: resetSale } = sell;
  React.useEffect(() => {
    resetSale();
  }, [cart.lines, resetSale]); // (the basket can't change while a charge is in flight: it is locked)

  // A tapped product: counted ones go straight in, weighed ones ask for their kg first.
  // While a charge is waiting for its answer the basket is locked: what is queued or charged is what was sent.
  const [queueing, setQueueing] = React.useState(false);
  const inFlight = React.useRef(false); // set the moment Charge is pressed, before React re-renders
  const charging = sell.isLoading || queueing;
  const locked = () => inFlight.current || charging;

  const pickProduct = (product) => {
    if (locked()) return;
    if (product.sold_by === 'weight') setWeighing(product);
    else cart.add(product, { unlimited: sellingOffline });
  };

  const finishSale = () => {
    cart.clear();
    setWeighing(null);
    clearCard();
    setScannedCard('');
    attempt.current = null;
  };

  // Keep a charge on this till until G28 sends it: numbered, priced from the cached catalogue, receipt shown.
  const chargeOffline = async (payload, cardAuthCode = null, confirmed = false, lines = cart.lines) => {
    setOfflineProblem('');
    if (!offline.available) {
      setOfflineProblem(
        offline.failed
          ? "This browser can't keep offline sales (its storage is blocked). Reconnect to keep selling."
          : 'Offline storage is still opening. Try again in a moment.'
      );
      return;
    }
    const settings = catalogue.settings ?? {};
    const hours = catalogue.refreshedAt ? (Date.now() - catalogue.refreshedAt) / HOUR_MS : Infinity;
    if (hours > (settings.offline_stop_hours ?? 72)) {
      setOfflineProblem('Prices on this till are too old to sell offline. Reconnect to keep selling.');
      return;
    }
    let confirmation = confirmedAt;
    if (hours > (settings.offline_confirm_hours ?? 24)) {
      if (confirmed) {
        confirmation = Date.now();
        setConfirmedAt(confirmation);
      } else if (!confirmedAt || Date.now() - confirmedAt > HOUR_MS) {
        setConfirming({ payload, cardAuthCode, lines });
        return;
      }
    }
    const { client_ref: clientRef, ...charged } = payload;
    // A card the server could not check (no answer, or still asking) goes with the sale and is checked at sync;
    // one it said is unknown or invalid does not.
    const status = loyaltyStatus(lookup, card);
    const unchecked = !card && scannedCard && (status === 'unavailable' || status === 'loading') ? scannedCard : '';
    const createdAt = new Date().toISOString();
    const printed = offlineReceipt({
      lines,
      products: catalogue.products,
      vatRates: catalogue.vatRates,
      payment: { ...charged, ...(cardAuthCode ? { card_auth_code: cardAuthCode } : {}) },
      number: '',
      createdAt,
      ukDate: ukToday(),
      branchName: current.branch_name,
      tillNumber: current.till_number,
      cashierName: me.data?.name || null,
    });
    if (!printed.vat_recorded) {
      const missing = printed.items.filter((item) => item.vat_rate === null).map((item) => item.product_name);
      setOfflineProblem(`${missing.join(', ')}: no VAT rate on this till. Sell it when the till is back online.`);
      return;
    }
    const tillRow = catalogue.tills.find((t) => String(t.id) === till);
    const branch = catalogue.branches.find((b) => b.id === tillRow?.branch);
    setQueueing(true);
    try {
      const queued = await offline.queue({
        sale: {
          client_ref: clientRef,
          created_at: createdAt,
          session: current.id,
          cashier: cashierId,
          body: { ...charged, client_ref: clientRef, ...(unchecked ? { loyalty_barcode: unchecked } : {}) },
          ...(cardAuthCode ? { card_auth_code: cardAuthCode } : {}),
          ...(hours > (settings.offline_confirm_hours ?? 24)
            ? { confirmed_at: new Date(confirmation).toISOString() }
            : {}),
          receipt: printed,
        },
        tillId: till,
        branchCode: branchPrefix(branch),
        tillNumber: current.till_number,
      });
      setReceipt({ sale: { ...printed, receipt_number: queued.offline_number }, loyalty: null });
      finishSale();
    } catch (error) {
      setOfflineProblem(`Could not keep the sale on this till: ${error.message}`);
      return;
    } finally {
      setQueueing(false);
    }
    if (!askedStorage.current) {
      askedStorage.current = true;
      if ((await askPersistentStorage()) === false) setStorageWarning(true);
    }
  };

  const charge = ({ card_auth_code: cardAuthCode, card_last4: cardLast4, ...payment }) => {
    const body = {
      session: current.id,
      items: cart.lines.map(chargeLine),
      ...payment,
      ...(card ? { loyalty_barcode: card.barcode } : {}),
    };
    // The same basket and payment keeps its reference, so resending after a lost response cannot charge twice
    // (online or offline: the auth code is not part of it).
    const key = JSON.stringify(body);
    if (attempt.current?.key !== key) attempt.current = { key, ref: uuidv4() };
    attempt.current.customer = card?.customer ?? null; // named on the receipt, as charged
    attempt.current.lines = cart.lines; // the basket as sent, for an offline receipt if the answer never comes
    const payload = { ...body, client_ref: attempt.current.ref };
    if (locked()) return;
    if (sellingOffline) chargeOffline(payload, cardAuthCode ?? null, false, cart.lines);
    else {
      inFlight.current = true;
      // Online the terminal's details go with the charge (G36); they are not part of the retry key above.
      const terminal = cardAuthCode
        ? { card_auth_code: cardAuthCode, ...(cardLast4 ? { card_last4: cardLast4 } : {}) }
        : {};
      sell.mutate(
        { ...payload, ...terminal },
        {
          onSettled: () => {
            inFlight.current = false;
          },
        }
      );
    }
  };

  const catalogueQuery = {
    isLoading: !catalogue.ready || (catalogue.refreshedAt === null && !catalogue.error),
    isError: catalogue.refreshedAt === null && Boolean(catalogue.error),
    error: catalogue.error,
  };
  const tillSelector = (
    <QueryState
      query={{ ...catalogueQuery, data: catalogue.tills }}
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
    const waiting = offline.sales.filter((sale) => sale.status === 'queued' && sale.session === current.id).length;
    body = (
      <div className="space-y-4">
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold">
              {current.branch_name} – Till {current.till_number}
            </p>
            <p className="text-gray-600">
              Open since {new Date(current.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {(current.opened_by_name ?? current.opened_by_email) &&
                ` by ${current.opened_by_name ?? current.opened_by_email}`}{' '}
              · float {formatMoney(current.opening_float)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              {summary.sales_count} sale{summary.sales_count === 1 ? '' : 's'} · {formatMoney(summary.sales_total)}
            </span>
            <Button variant="secondary" onClick={() => setCashUpOpen(true)} disabled={waiting > 0}>
              Close till
            </Button>
          </div>
          {waiting > 0 && (
            <p className="w-full text-xs text-amber-700">
              {waiting} offline sale{waiting === 1 ? ' is' : 's are'} waiting to be sent: close the till once they have
              gone, so the cash-up counts them.
            </p>
          )}
        </Card>

        {current.fromCache && (
          <p role="status" className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Last known state of this till: the server can&apos;t be reached, so the session and its totals may be out of
            date.
          </p>
        )}
        <OfflineBanner
          online={!sellingOffline}
          serverOnly={serverDown && isOnline}
          since={catalogue.refreshedAt}
          waiting={offline.sales.filter((sale) => !sale.error).length}
          failed={offline.sales.filter((sale) => sale.error).length}
          sending={sending}
          onRetry={retryFailed}
        />
        {storageWarning && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            This browser may clear offline sales if it runs short of space. Reconnect soon.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2" aria-label="Products">
            <QueryState
              query={{ ...catalogueQuery, data: catalogue.products }}
              emptyMessage="No products yet. Add some under Inventory."
            >
              {(items) => (
                <ProductPicker
                  products={items}
                  onAdd={pickProduct}
                  onScan={scanProduct}
                  allowOutOfStock={sellingOffline}
                />
              )}
            </QueryState>
            {weighing && (
              <div className="mt-2">
                <WeightEntry
                  key={weighing.id}
                  product={weighing}
                  onAdd={({ weightKg, pieces }) => {
                    cart.addWeighed(weighing, weightKg, pieces);
                    setWeighing(null);
                  }}
                  onCancel={() => setWeighing(null)}
                  maxKg={catalogue.settings?.manual_weight_max_kg ?? null}
                />
              </div>
            )}
            {scanProblem && (
              <p role="status" className="mt-2 rounded-md bg-yellow-50 p-2 text-sm text-yellow-800">
                {scanProblem}
              </p>
            )}
          </section>
          <Card className="space-y-4 self-start" aria-label="Basket">
            <h3 className="font-semibold">Basket</h3>
            <Cart
              lines={cart.lines}
              totalCents={cart.totalCents}
              onQuantity={(...args) => !locked() && cart.setQuantity(...args)}
              onRemove={(...args) => !locked() && cart.remove(...args)}
            />
            {cart.lines.length > 0 && (
              <Button variant="secondary" className="w-full" onClick={cart.clear} disabled={charging}>
                Clear basket
              </Button>
            )}
            <LoyaltyCard
              value={card?.customer ?? null}
              status={loyaltyStatus(lookup, card)}
              message={apiErrorMessage(lookup.error, 'Could not look up the card.')}
              onScan={scanCard}
              onClear={clearCard}
            />
            <PaymentPanel
              totalCents={cart.totalCents}
              onCharge={charge}
              submitting={charging}
              offline={sellingOffline}
            />
            {offlineProblem && (
              <p role="alert" className="text-sm text-red-600">
                {offlineProblem}
              </p>
            )}
            {sell.isError && isRejection(sell.error) && (
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
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">Till</h2>
        <CacheAge
          refreshedAt={catalogue.refreshedAt}
          warnHours={catalogue.settings?.offline_warn_hours}
          failing={Boolean(catalogue.error)}
        />
      </div>
      {body}

      <OfflineQueue
        sales={offline.sales}
        onReprint={(sale) =>
          setReceipt({
            sale: {
              ...sale.receipt,
              receipt_number: sale.offline_number,
              status: sale.status,
              void_reason: sale.void_reason,
            },
            loyalty: null,
          })
        }
        me={{ id: cashierId, is_staff: Boolean(me.data?.is_staff) }}
        onRetry={retryFailed}
        onVoid={(sale, reason) =>
          offline.voidSale(sale.client_ref, reason, cashierId).catch((error) => setOfflineProblem(error.message))
        }
      />

      <Modal open={Boolean(confirming)} onClose={() => setConfirming(null)} title="Keep selling offline?">
        {confirming && (
          <div className="space-y-3 text-sm">
            <p>
              This till has not reached the server since{' '}
              {new Date(catalogue.refreshedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}.
              Prices may be out of date. You will be asked again in an hour.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                const { payload, cardAuthCode, lines } = confirming;
                setConfirming(null);
                chargeOffline(payload, cardAuthCode, true, lines);
              }}
            >
              Keep selling offline
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(receipt)} onClose={() => setReceipt(null)} title="Sale complete">
        {receipt && (
          <>
            <Receipt sale={receipt.sale} loyalty={receipt.loyalty} />
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
            <p data-testid="closed-card-variance">
              {closed.counted_card === null || closed.counted_card === undefined
                ? `Card: expected ${formatMoney(closed.summary.expected_card)}, terminal total not entered.`
                : `Card: expected ${formatMoney(closed.summary.expected_card)}, terminal ${formatMoney(closed.counted_card)}. ${varianceText(closed.summary.card_variance, 'Terminal balanced.')}`}
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

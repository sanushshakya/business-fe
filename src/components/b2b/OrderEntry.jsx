import React from 'react';
import { Input, Select } from '@/components/ui';

const UNITS = /^\d+$/;
const KG = /^\d+(\.\d{1,3})?$/;
const PRICE_DELAY_MS = 300;

const kind = (product) => {
  if (product.sold_by !== 'weight') return 'each';
  return product.is_catch_weight ? 'catch' : 'loose';
};
const LABELS = { each: 'Quantity', catch: 'Pieces', loose: 'Kg' };

const amountProblem = (product, amount) => {
  if (amount === '') return null;
  if (kind(product) === 'loose') return KG.test(amount) && Number(amount) > 0 ? null : 'Kg to 3 decimal places';
  return UNITS.test(amount) && Number(amount) > 0 ? null : 'Whole units';
};

/** What the price lookup is asked for: units, kg, or pieces × nominal kg (in whole grams, never floats). */
const priceQuantity = (product, amount) => {
  if (kind(product) !== 'catch') return amount;
  const [whole, fraction = ''] = String(product.nominal_weight_kg ?? '0').split('.');
  const grams = Number(amount) * (Number(whole) * 1000 + Number(fraction.padEnd(3, '0').slice(0, 3)));
  return `${Math.floor(grams / 1000)}.${String(grams % 1000).padStart(3, '0')}`;
};

export const tomorrow = (today) => {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const matches = (product, text) => {
  const query = text.trim().toLowerCase();
  if (!query) return false;
  return product.plu === query || product.barcode === query || product.name.toLowerCase().includes(query);
};

const customerMatches = (customer, text) => {
  const query = text.trim().toLowerCase();
  if (!query) return false;
  return (
    customer.account_code.toLowerCase().startsWith(query) ||
    `${customer.trading_name} ${customer.legal_name}`.toLowerCase().includes(query)
  );
};

/**
 * Fast keyboard entry of a trade order (G46a). Type the account code and Enter; then a product (PLU, barcode or
 * name) and Enter adds the top match and moves to its quantity; Enter goes back to the search box. Prices come
 * live from `onResolve(customer, date, lines)` (the server's trade prices, for show: the server prices at
 * confirm). Ctrl+S saves a draft, Ctrl+Enter saves and confirms: `onSave(body, {confirm})`, never twice at once.
 */
const OrderEntry = ({ customers, products, onResolve, onSave, today, error = null }) => {
  const [customerText, setCustomerText] = React.useState('');
  const [customer, setCustomer] = React.useState(null);
  const [deliveryDate, setDeliveryDate] = React.useState(() => tomorrow(today));
  const [address, setAddress] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [note, setNote] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [lines, setLines] = React.useState([]); // [{product, amount}]
  const [prices, setPrices] = React.useState({}); // product id -> resolved row, or 'failed'
  const [saving, setSaving] = React.useState(false);
  const searchRef = React.useRef(null);
  const amountRefs = React.useRef({});
  const pendingFocus = React.useRef(null);
  const busy = React.useRef(false);

  const byId = React.useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const suggestions = customer ? products.filter((p) => matches(p, search)).slice(0, 8) : [];
  const customerSuggestions = customer ? [] : customers.filter((c) => customerMatches(c, customerText)).slice(0, 8);
  const addresses = customer?.addresses ?? [];

  React.useEffect(() => {
    if (pendingFocus.current === 'search') searchRef.current?.focus();
    else if (pendingFocus.current) amountRefs.current[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  });

  const pickCustomer = (chosen) => {
    setCustomer(chosen);
    setCustomerText(`${chosen.account_code} ${chosen.trading_name || chosen.legal_name}`);
    const fallback =
      chosen.addresses.find((a) => a.is_default) ?? (chosen.addresses.length === 1 ? chosen.addresses[0] : null);
    setAddress(fallback ? String(fallback.id) : '');
    pendingFocus.current = 'search';
  };

  const addTop = () => {
    const top = suggestions[0];
    if (!top) return;
    if (!lines.some((line) => line.product === top.id))
      setLines((current) => [...current, { product: top.id, amount: '' }]);
    setSearch('');
    pendingFocus.current = top.id;
  };

  const setAmount = (productId, amount) =>
    setLines((current) => current.map((line) => (line.product === productId ? { ...line, amount } : line)));
  const remove = (productId) => setLines((current) => current.filter((line) => line.product !== productId));

  const valid = lines.filter((line) => line.amount !== '' && !amountProblem(byId[line.product], line.amount));
  const priceKey = JSON.stringify([customer?.id, deliveryDate, valid.map((l) => [l.product, l.amount])]);

  React.useEffect(() => {
    if (!customer || !valid.length) return undefined;
    let stale = false;
    const timer = setTimeout(() => {
      const asked = valid.map((line) => ({
        product: line.product,
        quantity: priceQuantity(byId[line.product], line.amount),
      }));
      onResolve(customer.id, deliveryDate, asked)
        .then((rows) => {
          if (!stale) setPrices(Object.fromEntries(rows.map((row) => [row.product, row])));
        })
        .catch(() => {
          if (!stale) setPrices(Object.fromEntries(asked.map((row) => [row.product, 'failed'])));
        });
    }, PRICE_DELAY_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
    // priceKey carries everything the lookup depends on
  }, [priceKey]);

  const problems = [
    !customer && 'Choose the customer.',
    customer && !addresses.length && 'No delivery address.',
    customer && addresses.length > 0 && !address && 'Choose the delivery address.',
    !lines.length && 'Add at least one product.',
    lines.some((line) => line.amount === '' || amountProblem(byId[line.product], line.amount)) &&
      'Every line needs a valid quantity or kg.',
  ].filter(Boolean);

  const save = async (confirm) => {
    if (problems.length || busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await onSave(
        {
          customer: customer.id,
          delivery_date: deliveryDate,
          address: Number(address),
          customer_ref: reference,
          note,
          lines: lines.map((line) =>
            kind(byId[line.product]) === 'loose'
              ? { product: line.product, weight_kg: line.amount }
              : { product: line.product, quantity: Number(line.amount) }
          ),
        },
        { confirm }
      );
    } catch {
      // the page shows the error; the order stays as typed
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const shortcuts = (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === 's' || event.key === 'S') {
      event.preventDefault();
      save(false);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      save(true);
    }
  };

  const priceText = (line) => {
    const price = prices[line.product];
    if (!price || line.amount === '' || amountProblem(byId[line.product], line.amount)) return null;
    if (price === 'failed') return <span className="text-amber-700">Price not checked</span>;
    if (price.error) return <span className="text-red-600">No trade price</span>;
    const per = kind(byId[line.product]) === 'each' ? 'each' : 'per kg';
    return (
      <span>
        £{price.unit_price} {per}
        {price.price_list_name && <span className="ml-2 text-xs text-gray-500">{price.price_list_name}</span>}
      </span>
    );
  };

  return (
    <div onKeyDown={shortcuts} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Input
            aria-label="Customer"
            placeholder="Account code or name, then Enter"
            value={customerText}
            onChange={(event) => {
              setCustomer(null);
              setCustomerText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && customerSuggestions[0]) {
                event.preventDefault();
                pickCustomer(customerSuggestions[0]);
              }
            }}
          />
          {customerSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full rounded border bg-white shadow">
              {customerSuggestions.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className="w-full px-2 py-1 text-left text-sm"
                    onClick={() => pickCustomer(option)}
                  >
                    {option.account_code} {option.trading_name || option.legal_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {customer && <p className="text-sm text-gray-600">{customer.trading_name || customer.legal_name}</p>}
        </div>
        <Input
          type="date"
          aria-label="Delivery date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />
        <Input
          aria-label="Your reference"
          placeholder="Their PO number"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      {customer && addresses.length > 0 && (
        <Select aria-label="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)}>
          <option value="">Delivery address…</option>
          {addresses.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}, {option.line1}, {option.postcode}
            </option>
          ))}
        </Select>
      )}
      <div className="relative">
        <Input
          ref={searchRef}
          aria-label="Add product"
          placeholder="PLU, barcode or name, then Enter"
          value={search}
          disabled={!customer}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
              event.preventDefault();
              addTop();
            }
          }}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full rounded border bg-white shadow">
            {suggestions.map((product, index) => (
              <li key={product.id} className={index === 0 ? 'bg-blue-50 px-2 py-1 text-sm' : 'px-2 py-1 text-sm'}>
                {product.name}
                {product.plu && <span className="ml-2 text-xs text-gray-500">PLU {product.plu}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-1">Product</th>
            <th>Amount</th>
            <th>Trade price (ex VAT)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const product = byId[line.product];
            const label = `${LABELS[kind(product)]} ${product.name}`;
            const problem = amountProblem(product, line.amount);
            return (
              <tr key={line.product} className="border-t">
                <td className="py-1">{product.name}</td>
                <td>
                  <Input
                    ref={(element) => {
                      amountRefs.current[line.product] = element;
                    }}
                    aria-label={label}
                    inputMode={kind(product) === 'loose' ? 'decimal' : 'numeric'}
                    className="w-28"
                    value={line.amount}
                    onChange={(event) => setAmount(line.product, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
                        event.preventDefault();
                        pendingFocus.current = 'search';
                        searchRef.current?.focus();
                      }
                    }}
                  />
                  {problem && <span className="ml-2 text-xs text-red-600">{problem}</span>}
                </td>
                <td>{priceText(line)}</td>
                <td className="text-right">
                  <button
                    type="button"
                    className="text-gray-500"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => remove(line.product)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Input aria-label="Note" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      {customer && !addresses.length && (
        <p role="alert" className="text-sm text-red-600">
          {`${customer.account_code} has no delivery address: add one on the customer first.`}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {problems[0] ?? 'Ctrl+S saves the draft · Ctrl+Enter saves and confirms'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm"
            disabled={saving}
            onClick={() => save(false)}
          >
            Save draft
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-white"
            disabled={saving}
            onClick={() => save(true)}
          >
            Save and confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEntry;

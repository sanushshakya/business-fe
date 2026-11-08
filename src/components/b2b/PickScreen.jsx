import React from 'react';
import { Button, Input, Select } from '@/components/ui';

const ZONES = [
  ['ambient', 'Ambient'],
  ['chilled', 'Chilled'],
  ['frozen', 'Frozen'],
  ['butchery', 'Butchery'],
];
// A scale label (EAN-13 starting with 2) or a GS1 code: the server reads the product and kg from it.
const isLabel = (code) => /^2\d{12}$/.test(code) || code.startsWith('(') || code.startsWith(']');

const grams = (kg) => {
  const [whole, fraction = ''] = String(kg ?? '0').split('.');
  return Number(whole) * 1000 + Number(fraction.padEnd(3, '0').slice(0, 3));
};
const kgText = (total) => `${Math.floor(total / 1000)}.${String(total % 1000).padStart(3, '0')}`;

const kindOf = (product) => {
  if (!product || product.sold_by !== 'weight') return 'each';
  return product.is_catch_weight ? 'catch' : 'loose';
};

const progress = (line, kind) => {
  const units = line.picks.reduce((sum, pick) => sum + (pick.quantity || 0), 0);
  const kg = line.picks.reduce((sum, pick) => sum + grams(pick.weight_kg), 0);
  if (kind === 'loose') return { text: `${kgText(kg)} of ${line.weight_kg} kg`, done: kg >= grams(line.weight_kg) };
  if (kind === 'catch')
    return { text: `${units} of ${line.quantity} pcs · ${kgText(kg)} kg`, done: units >= line.quantity };
  return { text: `${units} of ${line.quantity}`, done: units >= line.quantity };
};

/**
 * Picking on a tablet (G46b): lines by zone, a scan box that keeps the focus (a hardware scanner types and presses
 * Enter). A scale/GS1 label is sent as `barcode`; anything else is a lot number, sent with the amount typed for the
 * selected line. One scan at a time; the page shows the server's answer.
 */
const PickScreen = ({
  order,
  products,
  isStaff,
  onScan,
  onRemove,
  onPropose,
  onDecide,
  error = null,
  busy = false,
}) => {
  const byId = React.useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const lines = order.lines.filter((line) => line.substitution !== 'rejected');
  const pickable = lines.filter((line) => line.substitution !== 'proposed');
  const firstOpen = pickable.find((line) => !progress(line, kindOf(byId[line.product])).done) ?? pickable[0];
  const [selectedId, setSelectedId] = React.useState(firstOpen?.id ?? null);
  const selected = pickable.find((line) => line.id === selectedId) ?? firstOpen;
  const kind = kindOf(byId[selected?.product]);
  const [units, setUnits] = React.useState('');
  const [kg, setKg] = React.useState('');
  const [code, setCode] = React.useState('');
  const [swapping, setSwapping] = React.useState(false);
  const [swap, setSwap] = React.useState({ product: '', amount: '' });
  const scanRef = React.useRef(null);
  const scanning = React.useRef(false);

  // Back to the scan box when the screen opens, another line is chosen or the swap form closes (and after each
  // scan, in `send`) — never while an amount is being typed.
  React.useEffect(() => {
    if (!swapping) scanRef.current?.focus();
  }, [swapping, selected?.id]);

  const send = async () => {
    const scanned = code.trim();
    if (!scanned || !selected || scanning.current) return;
    scanning.current = true;
    const body = { line: selected.id };
    if (isLabel(scanned)) body.barcode = scanned;
    else {
      body.batch_number = scanned;
      if (kind !== 'loose') body.quantity = Number(units);
      if (kind !== 'each') body.weight_kg = kg.trim();
    }
    try {
      await onScan(body);
    } catch {
      // the page shows why; ready for the next scan
    } finally {
      scanning.current = false;
      setCode('');
      scanRef.current?.focus();
    }
  };

  const propose = async (event) => {
    event.preventDefault();
    const product = byId[swap.product];
    if (!product || !swap.amount.trim()) return;
    const amount = kindOf(product) === 'loose' ? { weight_kg: swap.amount.trim() } : { quantity: Number(swap.amount) };
    try {
      await onPropose({ line: selected.id, product: product.id, ...amount });
      setSwapping(false);
      setSwap({ product: '', amount: '' });
    } catch {
      // the page shows why; keep the form
    }
  };

  const swapKind = kindOf(byId[swap.product]);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 space-y-2 bg-white pb-2">
        <Input
          ref={scanRef}
          aria-label="Scan"
          placeholder="Scan a lot or a label"
          className="text-lg"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              send();
            }
          }}
        />
        {selected && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{selected.product_name}</span>
            {kind !== 'loose' && (
              <Input
                aria-label={kind === 'catch' ? 'Pieces' : 'Quantity'}
                inputMode="numeric"
                className="w-24"
                value={units}
                onChange={(event) => setUnits(event.target.value)}
              />
            )}
            {kind !== 'each' && (
              <Input
                aria-label="Kg"
                inputMode="decimal"
                className="w-28"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
              />
            )}
            <Button variant="secondary" onClick={() => setSwapping(true)}>
              Propose a swap
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {swapping && selected && (
        <form onSubmit={propose} className="flex flex-wrap items-center gap-2 rounded border p-3 text-sm">
          <span>Instead of {selected.product_name}:</span>
          <Select
            aria-label="Swap product"
            value={swap.product}
            onChange={(e) => setSwap({ ...swap, product: e.target.value })}
          >
            <option value="">Product…</option>
            {products
              .filter((product) => product.id !== selected.product)
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
          </Select>
          <Input
            aria-label={swapKind === 'loose' ? 'Swap kg' : 'Swap quantity'}
            inputMode="decimal"
            className="w-24"
            value={swap.amount}
            onChange={(e) => setSwap({ ...swap, amount: e.target.value })}
          />
          <Button type="submit" disabled={busy}>
            Send the swap
          </Button>
          <Button variant="secondary" onClick={() => setSwapping(false)}>
            Never mind
          </Button>
        </form>
      )}

      {ZONES.map(([zone, label]) => {
        const inZone = lines.filter((line) => (line.zone ?? 'ambient') === zone);
        if (!inZone.length) return null;
        return (
          <section key={zone} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-gray-600">{label}</h3>
            {inZone.map((line) => {
              const lineKind = kindOf(byId[line.product]);
              const state = progress(line, lineKind);
              const proposed = line.substitution === 'proposed';
              return (
                <div
                  key={line.id}
                  className={`rounded border p-3 ${line.id === selected?.id ? 'border-primary bg-blue-50' : ''}`}
                >
                  {proposed ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{line.product_name}</span>
                      <span className="text-amber-700">Waiting for approval</span>
                      {isStaff && (
                        <>
                          <Button onClick={() => onDecide(line, true)} aria-label={`Approve swap ${line.product_name}`}>
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => onDecide(line, false)}
                            aria-label={`Reject swap ${line.product_name}`}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left"
                      onClick={() => setSelectedId(line.id)}
                    >
                      <span className="font-medium">{line.product_name}</span>
                      <span className={state.done ? 'text-green-700' : 'text-gray-700'}>{state.text}</span>
                    </button>
                  )}
                  {line.picks.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {line.picks.map((pick) => (
                        <li key={pick.id} className="flex items-center gap-2">
                          <span className="font-mono">{pick.batch_number}</span>
                          <span>
                            {pick.quantity ? `${pick.quantity}` : ''}
                            {pick.weight_kg ? ` ${pick.weight_kg} kg` : ''}
                          </span>
                          <button
                            type="button"
                            className="text-gray-500"
                            onClick={() => onRemove(pick)}
                            aria-label={`Remove pick ${pick.batch_number}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
};

export default PickScreen;

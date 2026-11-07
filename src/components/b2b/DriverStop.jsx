import React from 'react';
import { Button, Input, Select } from '@/components/ui';
import { REASONS } from './ReturnForm';

const kindOf = (line) => {
  if (line.sold_by !== 'weight') return 'each';
  return line.is_catch_weight ? 'catch' : 'loose';
};
const STATUS_TEXT = { delivered: 'Delivered', failed: 'Not delivered', planned: 'Not started' };

/**
 * One stop on the driver's phone (G46b): the address and instructions, then "Delivered" (who received it, notes, an
 * optional photo, anything refused at the door by line) or "Not delivered" (why). With a photo the delivery goes
 * as a multipart form and `refused` as a JSON string; without, as JSON. Keeps what was typed if the server refuses.
 */
const DriverStop = ({ stop, onDeliver, onFail, error = null, busy = false }) => {
  const [mode, setMode] = React.useState(null); // null | 'deliver' | 'fail'
  const [receivedBy, setReceivedBy] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [photo, setPhoto] = React.useState(null);
  const [refusing, setRefusing] = React.useState(false);
  const [refused, setRefused] = React.useState({}); // line id -> {units, kg, reason}
  const [reason, setReason] = React.useState('');
  const set = (id, name, value) =>
    setRefused((current) => ({
      ...current,
      [id]: { units: '', kg: '', reason: 'not_wanted', ...current[id], [name]: value },
    }));

  const refusedLines = () =>
    stop.lines
      .filter((line) => refused[line.id] && (refused[line.id].units || refused[line.id].kg))
      .map((line) => {
        const row = refused[line.id];
        const kind = kindOf(line);
        if (kind === 'loose') return { line: line.id, weight_kg: row.kg.trim(), reason: row.reason };
        const body = { line: line.id, quantity: Number(row.units), reason: row.reason };
        return kind === 'catch' ? { ...body, weight_kg: row.kg.trim() } : body;
      });

  const deliver = async (event) => {
    event.preventDefault();
    const lines = refusing ? refusedLines() : [];
    let body;
    if (photo) {
      body = new FormData();
      body.append('received_by', receivedBy.trim());
      body.append('notes', notes);
      body.append('photo', photo);
      if (lines.length) body.append('refused', JSON.stringify(lines));
    } else {
      body = { received_by: receivedBy.trim(), notes, ...(lines.length ? { refused: lines } : {}) };
    }
    try {
      await onDeliver(body);
    } catch {
      // the page shows why; the form keeps what was typed
    }
  };

  const fail = async (event) => {
    event.preventDefault();
    try {
      await onFail(reason.trim());
    } catch {
      // as above
    }
  };

  return (
    <article className="space-y-2 rounded-lg border p-4">
      <header>
        <p className="text-lg font-semibold">
          {stop.position}. {stop.customer_name}
        </p>
        <p className="text-sm">
          {stop.line1}, {stop.town} {stop.postcode} · {stop.order_number}
        </p>
        {stop.instructions && <p className="text-sm text-amber-800">{stop.instructions}</p>}
      </header>
      {stop.status !== 'pending' ? (
        <p className="text-sm font-medium">
          {STATUS_TEXT[stop.status]}
          {stop.received_by && ` · ${stop.received_by}`}
          {stop.failed_reason && ` · ${stop.failed_reason}`}
        </p>
      ) : (
        <>
          {mode === null && (
            <div className="flex gap-2">
              <Button className="flex-1 py-3" onClick={() => setMode('deliver')}>
                Delivered
              </Button>
              <Button variant="secondary" className="flex-1 py-3" onClick={() => setMode('fail')}>
                Not delivered
              </Button>
            </div>
          )}
          {mode === 'deliver' && (
            <form onSubmit={deliver} className="space-y-2">
              <Input
                aria-label="Received by"
                placeholder="Who took it"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                required
              />
              <Input aria-label="Notes" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <label className="block text-sm">
                Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  aria-label="Photo"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
              <Button variant="secondary" onClick={() => setRefusing((on) => !on)}>
                Refused something?
              </Button>
              {refusing &&
                stop.lines.map((line) => {
                  const kind = kindOf(line);
                  return (
                    <div key={line.id} className="grid grid-cols-[1fr_5rem_5rem_9rem] items-center gap-2 text-sm">
                      <span>{line.product_name}</span>
                      {kind !== 'loose' ? (
                        <Input
                          aria-label={`Refused ${line.product_name}`}
                          inputMode="numeric"
                          value={refused[line.id]?.units ?? ''}
                          onChange={(e) => set(line.id, 'units', e.target.value)}
                        />
                      ) : (
                        <span />
                      )}
                      {kind !== 'each' ? (
                        <Input
                          aria-label={`Refused kg ${line.product_name}`}
                          inputMode="decimal"
                          value={refused[line.id]?.kg ?? ''}
                          onChange={(e) => set(line.id, 'kg', e.target.value)}
                        />
                      ) : (
                        <span />
                      )}
                      <Select
                        aria-label={`Reason ${line.product_name}`}
                        value={refused[line.id]?.reason ?? 'not_wanted'}
                        onChange={(e) => set(line.id, 'reason', e.target.value)}
                      >
                        {REASONS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  );
                })}
              <div className="flex gap-2">
                <Button type="submit" disabled={busy || !receivedBy.trim()}>
                  Record delivery
                </Button>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Back
                </Button>
              </div>
            </form>
          )}
          {mode === 'fail' && (
            <form onSubmit={fail} className="space-y-2">
              <Input aria-label="Why not delivered" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" variant="danger" disabled={busy || !reason.trim()}>
                  Record not delivered
                </Button>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Back
                </Button>
              </div>
            </form>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </>
      )}
    </article>
  );
};

export default DriverStop;

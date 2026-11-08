import React from 'react';
import { Button, Input, Select } from '@/components/ui';

/**
 * Plan a delivery run (G44): date, van, driver, and the picked orders in driving order (↑/↓). Re-planning a run
 * starts from its current stops.
 */
const RunForm = ({ run, vans, drivers, orders, today, onSubmit, onCancel, submitting = false, error = null }) => {
  const [runDate, setRunDate] = React.useState(run?.run_date ?? today);
  const [vehicle, setVehicle] = React.useState(run?.vehicle ? String(run.vehicle) : '');
  const [driver, setDriver] = React.useState(run?.driver ? String(run.driver) : '');
  const [note, setNote] = React.useState(run?.note ?? '');
  const [chosen, setChosen] = React.useState(() => (run?.stops ?? []).map((stop) => stop.order));
  const byId = Object.fromEntries(orders.map((order) => [order.id, order]));
  const label = (order) => `${order.number_display} ${order.customer_name}`;

  const toggle = (id) =>
    setChosen((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  const shift = (index, by) =>
    setChosen((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = (event) => {
    event.preventDefault();
    onSubmit({ run_date: runDate, vehicle: Number(vehicle), driver: Number(driver), orders: chosen, note });
  };

  return (
    <form onSubmit={submit} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="date"
          aria-label="Run date"
          value={runDate}
          onChange={(e) => setRunDate(e.target.value)}
          required
        />
        <Select aria-label="Van" value={vehicle} onChange={(e) => setVehicle(e.target.value)} required>
          <option value="">Van…</option>
          {vans.map((van) => (
            <option key={van.id} value={van.id}>
              {van.code} {van.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Driver" value={driver} onChange={(e) => setDriver(e.target.value)} required>
          <option value="">Driver…</option>
          {drivers.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Picked orders</legend>
        {orders.map((order) => (
          <label key={order.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={chosen.includes(order.id)} onChange={() => toggle(order.id)} />
            {label(order)}
          </label>
        ))}
      </fieldset>
      {chosen.length > 0 && (
        <ol className="space-y-1 text-sm">
          {chosen.map((id, index) => {
            const order = byId[id] ?? { number_display: `#${id}`, customer_name: '' };
            return (
              <li key={id} className="flex items-center gap-2">
                <span className="w-6">{index + 1}.</span>
                <span className="flex-1">{label(order)}</span>
                <Button
                  variant="secondary"
                  onClick={() => shift(index, -1)}
                  aria-label={`Move ${order.number_display} up`}
                >
                  ↑
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => shift(index, 1)}
                  aria-label={`Move ${order.number_display} down`}
                >
                  ↓
                </Button>
              </li>
            );
          })}
        </ol>
      )}
      <Input aria-label="Note" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting || !chosen.length}>
          Save run
        </Button>
      </div>
    </form>
  );
};

export default RunForm;

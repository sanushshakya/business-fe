import React from 'react';
import { Button, Input, Select } from '@/components/ui';

const isWeighed = (product) => product?.sold_by === 'weight';

const fromList = (list) => ({
  name: list?.name ?? '',
  priority: String(list?.priority ?? 0),
  is_active: list?.is_active ?? true,
  valid_from: list?.valid_from ?? '',
  valid_to: list?.valid_to ?? '',
  customers: list?.customers ?? [],
  groups: list?.groups ?? [],
  note: list?.note ?? '',
  entries: (list?.entries ?? []).map((entry) => ({
    product: String(entry.product),
    min_quantity: entry.min_quantity,
    unit_price: entry.unit_price,
  })),
});

const toggle = (values, id) => (values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);

/**
 * A price list (G39): trade prices ex VAT with quantity breaks, for customers and groups. Entries are sent as typed
 * (strings): the server checks units, kg and 4 dp prices. Sending entries replaces them on the server.
 */
const PriceListForm = ({
  priceList,
  products = [],
  customers = [],
  groups = [],
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
}) => {
  const [form, setForm] = React.useState(() => fromList(priceList));
  const byId = Object.fromEntries(products.map((product) => [String(product.id), product]));
  const set = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));
  const setEntry = (index, name, value) =>
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry, at) => (at === index ? { ...entry, [name]: value } : entry)),
    }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      priority: Number(form.priority || 0),
      is_active: form.is_active,
      valid_from: form.valid_from || null,
      valid_to: form.valid_to || null,
      customers: form.customers,
      groups: form.groups,
      note: form.note,
      entries: form.entries.map((entry) => ({
        product: Number(entry.product),
        min_quantity: entry.min_quantity.trim(),
        unit_price: entry.unit_price.trim(),
      })),
    });
  };

  return (
    <form onSubmit={submit} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <Input aria-label="Name" placeholder="Name" value={form.name} onChange={set('name')} required />
        <Input aria-label="Priority" inputMode="numeric" value={form.priority} onChange={set('priority')} />
        <label className="text-sm">
          Valid from
          <Input type="date" aria-label="Valid from" value={form.valid_from} onChange={set('valid_from')} />
        </label>
        <label className="text-sm">
          Valid to
          <Input type="date" aria-label="Valid to" value={form.valid_to} onChange={set('valid_to')} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((current) => ({ ...current, is_active: e.target.checked }))}
          />
          Active
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Customers</legend>
        <div className="flex max-h-32 flex-col overflow-y-auto">
          {customers.map((customer) => (
            <label key={customer.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.customers.includes(customer.id)}
                onChange={() =>
                  setForm((current) => ({ ...current, customers: toggle(current.customers, customer.id) }))
                }
              />
              {`${customer.account_code} ${customer.legal_name}`}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Groups</legend>
        {groups.map((group) => (
          <label key={group.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.groups.includes(group.id)}
              onChange={() => setForm((current) => ({ ...current, groups: toggle(current.groups, group.id) }))}
            />
            {group.name}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Prices (ex VAT)</legend>
        {form.entries.map((entry, index) => {
          const name = `Entry ${index + 1}`;
          const weighed = isWeighed(byId[entry.product]);
          return (
            <div key={index} className="grid grid-cols-[1fr_6rem_7rem_auto] items-center gap-2">
              <Select
                aria-label={`${name} product`}
                value={entry.product}
                onChange={(e) => setEntry(index, 'product', e.target.value)}
              >
                <option value="">Product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              <Input
                aria-label={`${name} from`}
                placeholder={weighed ? 'from kg' : 'from qty'}
                inputMode="decimal"
                value={entry.min_quantity}
                onChange={(e) => setEntry(index, 'min_quantity', e.target.value)}
              />
              <div>
                <Input
                  aria-label={`${name} price`}
                  inputMode="decimal"
                  value={entry.unit_price}
                  onChange={(e) => setEntry(index, 'unit_price', e.target.value)}
                />
                <span className="text-xs text-gray-500">{weighed ? '£ per kg' : '£ each'}</span>
              </div>
              <Button
                variant="secondary"
                aria-label={`Remove ${name}`}
                onClick={() =>
                  setForm((current) => ({ ...current, entries: current.entries.filter((_, at) => at !== index) }))
                }
              >
                ×
              </Button>
            </div>
          );
        })}
        <Button
          variant="secondary"
          onClick={() =>
            setForm((current) => ({
              ...current,
              entries: [...current.entries, { product: '', min_quantity: '1', unit_price: '' }],
            }))
          }
        >
          Add entry
        </Button>
      </fieldset>
      <Input aria-label="Note" placeholder="Note" value={form.note} onChange={set('note')} />
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
        <Button type="submit" disabled={submitting}>
          Save price list
        </Button>
      </div>
    </form>
  );
};

export default PriceListForm;

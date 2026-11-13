import React from 'react';
import { Button, Input, Select } from '@/components/ui';

export const KINDS = {
  multi_buy: 'Multi-buy (e.g. 3 for £5)',
  bogof: 'Buy X get Y free',
  meal_deal: 'Meal deal',
  category_percent: '% off a category',
};

const toggle = (values, id) => (values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
const text = (value) => (value === null || value === undefined ? '' : String(value));

const fromPromotion = (promotion) => ({
  name: promotion?.name ?? '',
  kind: promotion?.kind ?? 'multi_buy',
  priority: text(promotion?.priority ?? 0),
  starts_on: promotion?.starts_on ?? '',
  ends_on: promotion?.ends_on ?? '',
  is_active: promotion?.is_active ?? true,
  stacks: promotion?.stacks ?? false,
  buy_quantity: text(promotion?.buy_quantity),
  get_quantity: text(promotion?.get_quantity),
  deal_price: text(promotion?.deal_price),
  percent: text(promotion?.percent),
  products: promotion?.products ?? [],
  categories: promotion?.categories ?? [],
  branches: promotion?.branches ?? [],
  groups: (promotion?.groups ?? []).map((group) => ({ name: group.name, products: group.products })),
});

const NO_GROUPS = [
  { name: 'Main', products: [] },
  { name: 'Snack', products: [] },
  { name: 'Drink', products: [] },
];

/** What each kind sends; every other field goes as empty, as the server requires. */
const bodyFor = (form) => {
  const number = (value) => (value.trim() === '' ? null : Number(value));
  const money = (value) => (value.trim() === '' ? null : value.trim());
  const base = {
    name: form.name.trim(),
    kind: form.kind, // read-only once saved: the server ignores it on an edit
    priority: Number(form.priority || 0),
    starts_on: form.starts_on,
    ends_on: form.ends_on || null,
    is_active: form.is_active,
    branches: form.branches,
    stacks: false,
    buy_quantity: null,
    get_quantity: null,
    deal_price: null,
    percent: null,
    products: [],
    categories: [],
    groups: [],
  };
  if (form.kind === 'multi_buy')
    return {
      ...base,
      buy_quantity: number(form.buy_quantity),
      deal_price: money(form.deal_price),
      products: form.products,
    };
  if (form.kind === 'bogof')
    return {
      ...base,
      buy_quantity: number(form.buy_quantity),
      get_quantity: number(form.get_quantity),
      products: form.products,
    };
  if (form.kind === 'meal_deal') return { ...base, deal_price: money(form.deal_price), groups: form.groups };
  return { ...base, percent: money(form.percent), categories: form.categories, stacks: form.stacks };
};

const Checklist = ({ legend, items, chosen, onToggle, label = (item) => item.name }) => (
  <fieldset>
    <legend className="text-sm font-medium">{legend}</legend>
    <div className="flex max-h-32 flex-col overflow-y-auto">
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={chosen.includes(item.id)} onChange={() => onToggle(item.id)} />
          {label(item)}
        </label>
      ))}
    </div>
  </fieldset>
);

/**
 * A till promotion (G58). Prices include VAT. The kind is fixed once saved; the server checks every rule (a set of
 * 2+, groups 2–5 with a product in one group only, weighed products only in % off) and its 400 text is shown.
 */
const PromotionForm = ({
  promotion,
  products = [],
  categories = [],
  branches = [],
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
}) => {
  const [form, setForm] = React.useState(() => fromPromotion(promotion));
  const editing = Boolean(promotion?.id);
  const set = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));
  const flip = (name, id) => setForm((current) => ({ ...current, [name]: toggle(current[name], id) }));
  const setGroup = (index, change) =>
    setForm((current) => ({
      ...current,
      groups: current.groups.map((group, at) => (at === index ? { ...group, ...change } : group)),
    }));
  const eachProducts = products.filter((product) => product.sold_by !== 'weight');

  const chooseKind = (event) => {
    const kind = event.target.value;
    setForm((current) => ({
      ...current,
      kind,
      groups: kind === 'meal_deal' && !current.groups.length ? NO_GROUPS : current.groups,
    }));
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(bodyFor(form));
      }}
      className="max-h-[75vh] space-y-3 overflow-y-auto pr-1"
    >
      <div className="grid grid-cols-2 gap-3">
        <Input aria-label="Name" placeholder="Name on the receipt" value={form.name} onChange={set('name')} required />
        <Select aria-label="Kind" value={form.kind} onChange={chooseKind} disabled={editing}>
          {Object.entries(KINDS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <label className="text-sm">
          Starts
          <Input type="date" aria-label="Starts" value={form.starts_on} onChange={set('starts_on')} required />
        </label>
        <label className="text-sm">
          Ends (blank: no end)
          <Input type="date" aria-label="Ends" value={form.ends_on} onChange={set('ends_on')} />
        </label>
        <label className="text-sm">
          Priority (higher goes first)
          <Input aria-label="Priority" inputMode="numeric" value={form.priority} onChange={set('priority')} />
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

      {(form.kind === 'multi_buy' || form.kind === 'bogof') && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            {form.kind === 'multi_buy' ? 'Items in a set' : 'Buy'}
            <Input aria-label="Buy" inputMode="numeric" value={form.buy_quantity} onChange={set('buy_quantity')} />
          </label>
          {form.kind === 'multi_buy' ? (
            <label className="text-sm">
              Set price £ (VAT incl.)
              <Input aria-label="Deal price" inputMode="decimal" value={form.deal_price} onChange={set('deal_price')} />
            </label>
          ) : (
            <label className="text-sm">
              Get free
              <Input
                aria-label="Get free"
                inputMode="numeric"
                value={form.get_quantity}
                onChange={set('get_quantity')}
              />
            </label>
          )}
        </div>
      )}
      {(form.kind === 'multi_buy' || form.kind === 'bogof') && (
        <Checklist
          legend="Products (any mix counts)"
          items={eachProducts}
          chosen={form.products}
          onToggle={(id) => flip('products', id)}
        />
      )}

      {form.kind === 'meal_deal' && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">One item from each group</legend>
          <label className="text-sm">
            Deal price £ (VAT incl.)
            <Input aria-label="Deal price" inputMode="decimal" value={form.deal_price} onChange={set('deal_price')} />
          </label>
          {form.groups.map((group, index) => (
            <div key={index} className="rounded-md border border-gray-200 p-2">
              <div className="flex items-center gap-2">
                <Input
                  aria-label={`Group ${index + 1} name`}
                  value={group.name}
                  onChange={(e) => setGroup(index, { name: e.target.value })}
                />
                <Button
                  variant="secondary"
                  aria-label={`Remove group ${index + 1}`}
                  onClick={() =>
                    setForm((current) => ({ ...current, groups: current.groups.filter((_, at) => at !== index) }))
                  }
                >
                  ×
                </Button>
              </div>
              <Checklist
                legend={`${group.name || `Group ${index + 1}`} products`}
                items={eachProducts}
                chosen={group.products}
                onToggle={(id) => setGroup(index, { products: toggle(group.products, id) })}
              />
            </div>
          ))}
          {form.groups.length < 5 && (
            <Button
              variant="secondary"
              onClick={() =>
                setForm((current) => ({ ...current, groups: [...current.groups, { name: '', products: [] }] }))
              }
            >
              Add group
            </Button>
          )}
        </fieldset>
      )}

      {form.kind === 'category_percent' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              % off
              <Input aria-label="Percent off" inputMode="decimal" value={form.percent} onChange={set('percent')} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.stacks}
                onChange={(e) => setForm((current) => ({ ...current, stacks: e.target.checked }))}
              />
              Also on top of other promotions
            </label>
          </div>
          <Checklist
            legend="Categories"
            items={categories}
            chosen={form.categories}
            onToggle={(id) => flip('categories', id)}
          />
        </>
      )}

      <Checklist
        legend="Branches (none: every branch)"
        items={branches}
        chosen={form.branches}
        onToggle={(id) => flip('branches', id)}
      />
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
          Save promotion
        </Button>
      </div>
    </form>
  );
};

export default PromotionForm;

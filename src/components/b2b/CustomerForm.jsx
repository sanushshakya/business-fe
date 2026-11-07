import React from 'react';
import { Button, Input, Select } from '@/components/ui';

export const WEEKDAYS = [
  ['mon', 'Mon'],
  ['tue', 'Tue'],
  ['wed', 'Wed'],
  ['thu', 'Thu'],
  ['fri', 'Fri'],
  ['sat', 'Sat'],
  ['sun', 'Sun'],
];
export const STATUSES = [
  ['active', 'Active'],
  ['on_hold', 'On hold'],
  ['closed', 'Closed'],
];
const NEW_ADDRESS = { label: '', line1: '', line2: '', town: '', postcode: '', instructions: '', is_default: false };
const NEW_CONTACT = { name: '', role: '', email: '', phone: '', is_primary: false };

const fromCustomer = (customer) => ({
  account_code: customer?.account_code ?? '',
  legal_name: customer?.legal_name ?? '',
  trading_name: customer?.trading_name ?? '',
  vat_number: customer?.vat_number ?? '',
  status: customer?.status ?? 'active',
  group: customer?.group ?? '',
  payment_terms_days: String(customer?.payment_terms_days ?? 30),
  invoice_email: customer?.invoice_email ?? '',
  delivery_days: customer?.delivery_days ?? [],
  note: customer?.note ?? '',
  addresses: (customer?.addresses ?? []).map(({ id: _id, ...rest }) => rest),
  contacts: (customer?.contacts ?? []).map(({ id: _id, ...rest }) => rest),
});

/** The one flagged row, or the first when none is (the backend makes a single one the default too). */
const withOneFlag = (rows, flag) => {
  const chosen = rows.findIndex((row) => row[flag]);
  return rows.map((row, index) => ({ ...row, [flag]: index === (chosen === -1 ? 0 : chosen) }));
};

const Field = ({ label, children }) => (
  <label className="block text-sm">
    <span className="text-gray-700">{label}</span>
    {children}
  </label>
);

/**
 * A trade customer (G38): details, invoicing (G43), delivery days, addresses (one default) and contacts (one
 * primary). Sending addresses/contacts replaces them on the server. Keeps its values if `onSubmit` rejects.
 */
const CustomerForm = ({ customer, groups = [], onSubmit, onCancel, submitting = false, error = null }) => {
  const [form, setForm] = React.useState(() => fromCustomer(customer));
  const set = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));
  const setRow = (list, index, name, value) =>
    setForm((current) => ({
      ...current,
      [list]: current[list].map((row, at) => (at === index ? { ...row, [name]: value } : row)),
    }));
  const flag = (list, flagName, index) =>
    setForm((current) => ({
      ...current,
      [list]: current[list].map((row, at) => ({ ...row, [flagName]: at === index })),
    }));
  const toggleDay = (day) =>
    setForm((current) => ({
      ...current,
      delivery_days: current.delivery_days.includes(day)
        ? current.delivery_days.filter((d) => d !== day)
        : [...current.delivery_days, day],
    }));

  const submit = (event) => {
    event.preventDefault();
    const terms = form.payment_terms_days.trim();
    onSubmit({
      ...form,
      group: form.group === '' ? null : Number(form.group),
      payment_terms_days: terms === '' ? 30 : Number(terms),
      addresses: withOneFlag(form.addresses, 'is_default'),
      contacts: withOneFlag(form.contacts, 'is_primary'),
    });
  };

  return (
    <form onSubmit={submit} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Account code">
          <Input value={form.account_code} onChange={set('account_code')} aria-label="Account code" required />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')} aria-label="Status">
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Legal name">
          <Input value={form.legal_name} onChange={set('legal_name')} aria-label="Legal name" required />
        </Field>
        <Field label="Trading name">
          <Input value={form.trading_name} onChange={set('trading_name')} aria-label="Trading name" />
        </Field>
        <Field label="VAT number">
          <Input value={form.vat_number} onChange={set('vat_number')} aria-label="VAT number" />
        </Field>
        <Field label="Group">
          <Select value={form.group} onChange={set('group')} aria-label="Group">
            <option value="">No group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Invoice email">
          <Input type="email" value={form.invoice_email} onChange={set('invoice_email')} aria-label="Invoice email" />
        </Field>
        <Field label="Payment terms (days)">
          <Input
            inputMode="numeric"
            value={form.payment_terms_days}
            onChange={set('payment_terms_days')}
            aria-label="Payment terms (days)"
          />
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm text-gray-700">Delivery days</legend>
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map(([day, label]) => (
            <label key={day} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={form.delivery_days.includes(day)} onChange={() => toggleDay(day)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Delivery addresses</legend>
        {form.addresses.map((address, index) => {
          const name = `Address ${index + 1}`;
          return (
            <div key={index} className="grid grid-cols-2 gap-2 rounded border p-2">
              {[
                ['label', 'label'],
                ['line1', 'line 1'],
                ['line2', 'line 2'],
                ['town', 'town'],
                ['postcode', 'postcode'],
                ['instructions', 'instructions'],
              ].map(([field, label]) => (
                <Input
                  key={field}
                  aria-label={`${name} ${label}`}
                  placeholder={label}
                  value={address[field]}
                  onChange={(event) => setRow('addresses', index, field, event.target.value)}
                />
              ))}
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="default-address"
                  aria-label={`${name} default`}
                  checked={address.is_default}
                  onChange={() => flag('addresses', 'is_default', index)}
                />
                Default
              </label>
              <Button
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({ ...current, addresses: current.addresses.filter((_, at) => at !== index) }))
                }
              >
                Remove {name}
              </Button>
            </div>
          );
        })}
        <Button
          variant="secondary"
          onClick={() => setForm((current) => ({ ...current, addresses: [...current.addresses, { ...NEW_ADDRESS }] }))}
        >
          Add address
        </Button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Contacts</legend>
        {form.contacts.map((contact, index) => {
          const name = `Contact ${index + 1}`;
          return (
            <div key={index} className="grid grid-cols-2 gap-2 rounded border p-2">
              {['name', 'role', 'email', 'phone'].map((field) => (
                <Input
                  key={field}
                  aria-label={`${name} ${field}`}
                  placeholder={field}
                  value={contact[field]}
                  onChange={(event) => setRow('contacts', index, field, event.target.value)}
                />
              ))}
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="primary-contact"
                  aria-label={`${name} primary`}
                  checked={contact.is_primary}
                  onChange={() => flag('contacts', 'is_primary', index)}
                />
                Primary
              </label>
              <Button
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({ ...current, contacts: current.contacts.filter((_, at) => at !== index) }))
                }
              >
                Remove {name}
              </Button>
            </div>
          );
        })}
        <Button
          variant="secondary"
          onClick={() => setForm((current) => ({ ...current, contacts: [...current.contacts, { ...NEW_CONTACT }] }))}
        >
          Add contact
        </Button>
      </fieldset>

      <Field label="Note">
        <Input value={form.note} onChange={set('note')} aria-label="Note" />
      </Field>
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
          Save customer
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;

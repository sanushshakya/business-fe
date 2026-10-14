import React from 'react';
import { Button, Form, Input, Option, Select } from '@/components/ui';
import { parseMoney } from '../../utils/money';

/**
 * Pick a till and open it with a starting float. `tills` are `{id, label}`; calls `onOpen({till, opening_float})`.
 */
const OpenTillForm = ({ tills = [], till = '', onTillChange, onOpen, submitting = false }) => {
  const [float, setFloat] = React.useState('50.00');
  const floatCents = parseMoney(float);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!till || floatCents === null) return;
    onOpen({ till: Number(till), opening_float: (floatCents / 100).toFixed(2) });
  };

  return (
    <Form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div>
        <label htmlFor="posTill" className="mb-1 block text-sm font-medium">
          Till
        </label>
        <Select id="posTill" value={till} onChange={(e) => onTillChange(e.target.value)} required>
          <Option value="">Choose a till…</Option>
          {tills.map((t) => (
            <Option key={t.id} value={t.id}>
              {t.label}
            </Option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="openingFloat" className="mb-1 block text-sm font-medium">
          Opening float
        </label>
        <Input
          id="openingFloat"
          inputMode="decimal"
          value={float}
          onChange={(e) => setFloat(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-gray-500">The cash you are starting the drawer with.</p>
      </div>
      <Button type="submit" disabled={submitting || !till || floatCents === null}>
        {submitting ? 'Opening…' : 'Open till'}
      </Button>
    </Form>
  );
};

export default OpenTillForm;
